import { PrismaClient } from '@prisma/client';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/common/error.js';
import {
    CommentBaseType,
    CommentItemType,
    CreateCommentType,
    GetCommentsType,
    MentionableUserType,
    UpdateCommentType,
} from '@/schemas/postComment.schema.js';

const authorSelect = {
    select: { id: true, nickname: true, profile_path: true },
};

type CommentRow = {
    id: number;
    parent_id: number | null;
    content: string;
    created_at: Date | null;
    updated_at: Date | null;
    is_deleted: boolean;
    user_tb: { id: number; nickname: string | null; profile_path: string | null };
};

// 삭제된 댓글(묘비)은 내용/작성자를 마스킹해서 내려준다.
const toBaseItem = (row: CommentRow, userId: number | null | undefined): CommentBaseType => ({
    id: row.id,
    parentId: row.parent_id,
    content: row.is_deleted ? '' : row.content,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
    author: row.is_deleted
        ? null
        : {
              id: row.user_tb.id,
              nickname: row.user_tb.nickname,
              profilePath: row.user_tb.profile_path,
          },
    isMine: !row.is_deleted && userId === row.user_tb.id,
    isDeleted: row.is_deleted,
});

export class PostCommentService {
    constructor(private prisma: PrismaClient) {}

    private async getOwnedComment(commentId: number, userId: number) {
        const comment = await this.prisma.post_comment_tb.findUnique({
            where: { id: commentId },
            select: { id: true, user_id: true, parent_id: true, is_deleted: true },
        });
        if (!comment || comment.is_deleted) {
            throw new NotFoundError('댓글을 찾을 수 없습니다.');
        }
        if (comment.user_id !== userId) {
            throw new ForbiddenError('본인이 작성한 댓글만 수정/삭제할 수 있습니다.');
        }
        return comment;
    }

    async createComment(userId: number, postId: number, dto: CreateCommentType): Promise<number> {
        const post = await this.prisma.post_tb.findUnique({
            where: { id: postId },
            select: { id: true },
        });
        if (!post) {
            throw new NotFoundError('게시글을 찾을 수 없습니다.');
        }

        if (dto.parentId) {
            const parent = await this.prisma.post_comment_tb.findUnique({
                where: { id: dto.parentId },
                select: { post_id: true, parent_id: true, is_deleted: true },
            });
            if (!parent || parent.post_id !== postId) {
                throw new BadRequestError('대상 댓글을 찾을 수 없습니다.');
            }
            if (parent.is_deleted) {
                throw new BadRequestError('삭제된 댓글에는 답글을 달 수 없습니다.');
            }
            // 대댓글 1 depth 제한. n-depth 허용 시 이 검사만 제거하면 된다.
            if (parent.parent_id !== null) {
                throw new BadRequestError('대댓글에는 댓글을 달 수 없습니다.');
            }
        }

        if (dto.mentionedUserIds.length > 0) {
            const mentionable = await this.getMentionableUsers(postId);
            const mentionableIds = new Set(mentionable.map((u) => u.id));
            const invalidIds = dto.mentionedUserIds.filter((id) => !mentionableIds.has(id));
            if (invalidIds.length > 0) {
                throw new BadRequestError('게시글과 관련 없는 사용자는 태그할 수 없습니다.');
            }
        }

        const created = await this.prisma.post_comment_tb.create({
            data: {
                post_id: postId,
                user_id: userId,
                parent_id: dto.parentId ?? null,
                content: dto.content,
            },
            select: { id: true },
        });
        return created.id;
    }

    async getComments(
        userId: number | null | undefined,
        postId: number,
        params: GetCommentsType
    ): Promise<{
        items: CommentItemType[];
        total: number;
        offset: number;
        limit: number;
    }> {
        const { offset, limit } = params;

        const post = await this.prisma.post_tb.findUnique({
            where: { id: postId },
            select: { id: true },
        });
        if (!post) {
            throw new NotFoundError('게시글을 찾을 수 없습니다.');
        }

        const rootWhere = { post_id: postId, parent_id: null };
        const [roots, total] = await Promise.all([
            this.prisma.post_comment_tb.findMany({
                where: rootWhere,
                orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
                skip: offset,
                take: limit,
                include: { user_tb: authorSelect },
            }),
            this.prisma.post_comment_tb.count({ where: rootWhere }),
        ]);

        const replies =
            roots.length > 0
                ? await this.prisma.post_comment_tb.findMany({
                      where: {
                          post_id: postId,
                          parent_id: { in: roots.map((r) => r.id) },
                      },
                      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
                      include: { user_tb: authorSelect },
                  })
                : [];

        const repliesByParent = new Map<number, CommentBaseType[]>();
        for (const reply of replies) {
            const list = repliesByParent.get(reply.parent_id!) ?? [];
            list.push(toBaseItem(reply, userId));
            repliesByParent.set(reply.parent_id!, list);
        }

        return {
            items: roots.map((root) => ({
                ...toBaseItem(root, userId),
                replies: repliesByParent.get(root.id) ?? [],
            })),
            total,
            offset,
            limit,
        };
    }

    // 대댓글 태그 후보: 게시글 작성자 + 댓글/대댓글 작성자(묘비 제외), 작성자 우선 + 최초 댓글순, 중복 제거
    async getMentionableUsers(postId: number): Promise<MentionableUserType[]> {
        const post = await this.prisma.post_tb.findUnique({
            where: { id: postId },
            select: { id: true, user_tb: authorSelect },
        });
        if (!post) {
            throw new NotFoundError('게시글을 찾을 수 없습니다.');
        }

        const commenters = await this.prisma.post_comment_tb.findMany({
            where: { post_id: postId, is_deleted: false },
            distinct: ['user_id'],
            orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
            select: { user_id: true, user_tb: authorSelect },
        });

        const result: MentionableUserType[] = [
            {
                id: post.user_tb.id,
                nickname: post.user_tb.nickname,
                profilePath: post.user_tb.profile_path,
                isAuthor: true,
            },
        ];
        const seen = new Set([post.user_tb.id]);
        for (const commenter of commenters) {
            if (seen.has(commenter.user_id)) continue;
            seen.add(commenter.user_id);
            result.push({
                id: commenter.user_tb.id,
                nickname: commenter.user_tb.nickname,
                profilePath: commenter.user_tb.profile_path,
                isAuthor: false,
            });
        }
        return result;
    }

    async updateComment(userId: number, commentId: number, dto: UpdateCommentType): Promise<void> {
        await this.getOwnedComment(commentId, userId);
        await this.prisma.post_comment_tb.update({
            where: { id: commentId },
            data: {
                content: dto.content,
                updated_at: new Date(),
            },
        });
    }

    /**
     * 대댓글이 있으면 묘비(is_deleted)로 남기고, 없으면 hard delete.
     * 대댓글 삭제로 묘비 부모의 마지막 자식이 사라지면 부모 묘비도 함께 정리한다.
     */
    async deleteComment(userId: number, commentId: number): Promise<void> {
        const comment = await this.getOwnedComment(commentId, userId);

        await this.prisma.$transaction(async (tx) => {
            const childCount = await tx.post_comment_tb.count({
                where: { parent_id: commentId },
            });

            if (childCount > 0) {
                await tx.post_comment_tb.update({
                    where: { id: commentId },
                    data: { is_deleted: true },
                });
                return;
            }

            await tx.post_comment_tb.delete({ where: { id: commentId } });

            if (comment.parent_id !== null) {
                const parent = await tx.post_comment_tb.findUnique({
                    where: { id: comment.parent_id },
                    select: { is_deleted: true },
                });
                if (parent?.is_deleted) {
                    const remaining = await tx.post_comment_tb.count({
                        where: { parent_id: comment.parent_id },
                    });
                    if (remaining === 0) {
                        await tx.post_comment_tb.delete({ where: { id: comment.parent_id } });
                    }
                }
            }
        });
    }
}
