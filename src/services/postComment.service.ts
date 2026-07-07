import { PrismaClient } from '@prisma/client';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/common/error.js';
import {
    CommentBaseType,
    CommentItemType,
    CreateCommentType,
    GetCommentsType,
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
    user_tb: { id: number; nickname: string | null; profile_path: string | null };
};

const toBaseItem = (row: CommentRow, userId: number | null | undefined): CommentBaseType => ({
    id: row.id,
    parentId: row.parent_id,
    content: row.content,
    createdAt: row.created_at ? row.created_at.toISOString() : null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
    author: {
        id: row.user_tb.id,
        nickname: row.user_tb.nickname,
        profilePath: row.user_tb.profile_path,
    },
    isMine: userId === row.user_tb.id,
});

export class PostCommentService {
    constructor(private prisma: PrismaClient) {}

    private async getOwnedComment(commentId: number, userId: number) {
        const comment = await this.prisma.post_comment_tb.findUnique({
            where: { id: commentId },
            select: { id: true, user_id: true },
        });
        if (!comment) {
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
                select: { post_id: true, parent_id: true },
            });
            if (!parent || parent.post_id !== postId) {
                throw new BadRequestError('대상 댓글을 찾을 수 없습니다.');
            }
            // 대댓글 1 depth 제한. n-depth 허용 시 이 검사만 제거하면 된다.
            if (parent.parent_id !== null) {
                throw new BadRequestError('대댓글에는 댓글을 달 수 없습니다.');
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
     * Hard delete. 대댓글은 FK cascade로 함께 삭제된다.
     */
    async deleteComment(userId: number, commentId: number): Promise<void> {
        await this.getOwnedComment(commentId, userId);
        await this.prisma.post_comment_tb.delete({ where: { id: commentId } });
    }
}
