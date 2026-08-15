import { Prisma, PrismaClient } from '@prisma/client';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/common/error.js';
import { SavedFileInfo } from '@/types/file.types.js';
import {
    BoardCode,
    CreateDraftType,
    CreatePostType,
    DraftListItemType,
    GetDraftsType,
    GetPostsType,
    MAX_LIST_THUMBNAILS,
    PostDetailType,
    PostLikeStateType,
    PostLikeType,
    PostLikeTypeValue,
    PostListItemType,
    UpdateDraftType,
    UpdatePostType,
} from '@/schemas/post.schema.js';
import { commonCreatedAtSortBy, PostSearchType } from '@/types/search.types.js';

const parseSort = (sort: commonCreatedAtSortBy): Prisma.post_tbOrderByWithRelationInput[] => {
    switch (sort) {
        case commonCreatedAtSortBy.OLDEST:
            return [{ created_at: 'asc' }, { id: 'asc' }];
        case commonCreatedAtSortBy.RECENT:
        default:
            return [{ created_at: 'desc' }, { id: 'desc' }];
    }
};

export class PostService {
    constructor(private prisma: PrismaClient) {}

    /**
     * 자유 게시판만 카테고리를 사용한다. 미지정 시 GENERAL.
     */
    private async resolveCategoryId(
        boardCode: string,
        categoryCode: string | undefined
    ): Promise<number | null> {
        if (boardCode !== BoardCode.FREE) {
            return null;
        }
        const code = categoryCode ?? 'GENERAL';
        const category = await this.prisma.post_category_code.findUnique({
            where: { code },
            select: { id: true },
        });
        if (!category) {
            throw new BadRequestError(`존재하지 않는 카테고리입니다: ${code}`);
        }
        return category.id;
    }

    /**
     * 선업로드된 이미지(post_id NULL)를 게시글에 연결한다.
     * 본인이 올린 이미지가 아니거나 다른 글에 연결된 이미지가 섞여 있으면 실패.
     */
    private async linkImages(
        tx: Prisma.TransactionClient,
        userId: number,
        postId: number,
        imageIds: number[]
    ): Promise<void> {
        if (imageIds.length === 0) {
            return;
        }
        const result = await tx.post_img_tb.updateMany({
            where: {
                id: { in: imageIds },
                user_id: userId,
                OR: [{ post_id: null }, { post_id: postId }],
            },
            data: { post_id: postId },
        });
        if (result.count !== imageIds.length) {
            throw new BadRequestError('연결할 수 없는 이미지가 포함되어 있습니다.');
        }
    }

    private async getOwnedPost(postId: number, userId: number) {
        const post = await this.prisma.post_tb.findUnique({
            where: { id: postId },
            select: {
                id: true,
                user_id: true,
                board_tb: { select: { code: true } },
            },
        });
        if (!post) {
            throw new NotFoundError('게시글을 찾을 수 없습니다.');
        }
        if (post.user_id !== userId) {
            throw new ForbiddenError('본인이 작성한 게시글만 수정/삭제할 수 있습니다.');
        }
        return post;
    }

    async getPosts(params: GetPostsType): Promise<{
        items: PostListItemType[];
        total: number;
        offset: number;
        limit: number;
    }> {
        const { board, category, keyword, searchType, sort, offset, limit } = params;

        const where: Prisma.post_tbWhereInput = {
            board_tb: { code: board },
            is_draft: false,
        };
        if (category) {
            where.post_category_code = { code: category };
        }
        if (keyword) {
            switch (searchType) {
                case PostSearchType.TITLE:
                    where.title = { contains: keyword, mode: 'insensitive' };
                    break;
                case PostSearchType.CONTENT:
                    where.content = { contains: keyword, mode: 'insensitive' };
                    break;
                case PostSearchType.AUTHOR:
                    where.user_tb = { nickname: { contains: keyword, mode: 'insensitive' } };
                    break;
                case PostSearchType.TITLE_CONTENT:
                default:
                    where.OR = [
                        { title: { contains: keyword, mode: 'insensitive' } },
                        { content: { contains: keyword, mode: 'insensitive' } },
                    ];
                    break;
            }
        }

        const [rows, total] = await Promise.all([
            this.prisma.post_tb.findMany({
                where,
                orderBy: parseSort(sort),
                skip: offset,
                take: limit,
                include: {
                    user_tb: { select: { id: true, nickname: true, profile_path: true } },
                    board_tb: { select: { code: true } },
                    post_category_code: { select: { code: true, name: true } },
                    post_img_tb: {
                        select: { id: true, file_path: true },
                        orderBy: { id: 'asc' },
                        take: MAX_LIST_THUMBNAILS,
                    },
                    _count: {
                        select: {
                            post_comment_tb: { where: { is_deleted: false } },
                            post_img_tb: true,
                        },
                    },
                },
            }),
            this.prisma.post_tb.count({ where }),
        ]);

        const postIds = rows.map((row) => row.id);
        const likeGroups =
            postIds.length > 0
                ? await this.prisma.post_like_tb.groupBy({
                      by: ['post_id', 'like_type'],
                      where: { post_id: { in: postIds } },
                      _count: { _all: true },
                  })
                : [];
        const likeCountMap = new Map<number, { like: number; dislike: number }>();
        for (const group of likeGroups) {
            const entry = likeCountMap.get(group.post_id) ?? { like: 0, dislike: 0 };
            if (group.like_type === PostLikeType.LIKE) {
                entry.like = group._count._all;
            } else {
                entry.dislike = group._count._all;
            }
            likeCountMap.set(group.post_id, entry);
        }

        return {
            items: rows.map((row) => ({
                id: row.id,
                boardCode: row.board_tb.code,
                category: row.post_category_code
                    ? { code: row.post_category_code.code, name: row.post_category_code.name }
                    : null,
                title: row.title,
                createdAt: row.created_at ? row.created_at.toISOString() : null,
                updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
                author: {
                    id: row.user_tb.id,
                    nickname: row.user_tb.nickname,
                    profilePath: row.user_tb.profile_path,
                },
                likeCount: likeCountMap.get(row.id)?.like ?? 0,
                dislikeCount: likeCountMap.get(row.id)?.dislike ?? 0,
                commentCount: row._count.post_comment_tb,
                thumbnails: row.post_img_tb.map((img) => ({ id: img.id, filePath: img.file_path })),
                imageCount: row._count.post_img_tb,
            })),
            total,
            offset,
            limit,
        };
    }

    async createPost(userId: number, dto: CreatePostType): Promise<number> {
        const board = await this.prisma.board_tb.findUnique({
            where: { code: dto.boardCode },
            select: { id: true, code: true },
        });
        if (!board) {
            throw new BadRequestError(`존재하지 않는 게시판입니다: ${dto.boardCode}`);
        }
        const categoryId = await this.resolveCategoryId(board.code, dto.categoryCode);

        return await this.prisma.$transaction(async (tx) => {
            const created = await tx.post_tb.create({
                data: {
                    board_id: board.id,
                    user_id: userId,
                    category_id: categoryId,
                    title: dto.title,
                    content: dto.content,
                },
                select: { id: true },
            });
            await this.linkImages(tx, userId, created.id, dto.imageIds);
            return created.id;
        });
    }

    async getPostById(userId: number | null | undefined, postId: number): Promise<PostDetailType> {
        const row = await this.prisma.post_tb.findUnique({
            where: { id: postId },
            include: {
                user_tb: { select: { id: true, nickname: true, profile_path: true } },
                board_tb: { select: { code: true } },
                post_category_code: { select: { code: true, name: true } },
                post_img_tb: { select: { id: true, file_path: true }, orderBy: { id: 'asc' } },
                _count: {
                    select: { post_comment_tb: { where: { is_deleted: false } } },
                },
            },
        });
        if (!row || (row.is_draft && row.user_id !== userId)) {
            throw new NotFoundError('게시글을 찾을 수 없습니다.');
        }

        const [likeCount, dislikeCount, myLike] = await Promise.all([
            this.prisma.post_like_tb.count({
                where: { post_id: postId, like_type: PostLikeType.LIKE },
            }),
            this.prisma.post_like_tb.count({
                where: { post_id: postId, like_type: PostLikeType.DISLIKE },
            }),
            userId
                ? this.prisma.post_like_tb.findUnique({
                      where: { post_id_user_id: { post_id: postId, user_id: userId } },
                      select: { like_type: true },
                  })
                : null,
        ]);

        return {
            id: row.id,
            boardCode: row.board_tb.code,
            category: row.post_category_code
                ? { code: row.post_category_code.code, name: row.post_category_code.name }
                : null,
            title: row.title,
            content: row.content,
            createdAt: row.created_at ? row.created_at.toISOString() : null,
            updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
            author: {
                id: row.user_tb.id,
                nickname: row.user_tb.nickname,
                profilePath: row.user_tb.profile_path,
            },
            images: row.post_img_tb.map((img) => ({ id: img.id, filePath: img.file_path })),
            likeCount,
            dislikeCount,
            commentCount: row._count.post_comment_tb,
            isMine: userId === row.user_tb.id,
            myLikeType: myLike ? (myLike.like_type as PostLikeTypeValue) : null,
            isDraft: row.is_draft,
        };
    }

    /**
     * 수정은 최종 상태 전체 전송 방식.
     * imageIds에서 빠진 기존 이미지 row는 삭제하고, 스토리지 삭제용 file_path를 반환한다.
     */
    async updatePost(
        userId: number,
        postId: number,
        dto: UpdatePostType
    ): Promise<{ removedFilePaths: string[] }> {
        const post = await this.getOwnedPost(postId, userId);
        const categoryId = await this.resolveCategoryId(post.board_tb.code, dto.categoryCode);

        const currentImages = await this.prisma.post_img_tb.findMany({
            where: { post_id: postId },
            select: { id: true, file_path: true },
        });
        const nextIds = new Set(dto.imageIds);
        const toRemove = currentImages.filter((img) => !nextIds.has(img.id));

        await this.prisma.$transaction(async (tx) => {
            await tx.post_tb.update({
                where: { id: postId },
                data: {
                    category_id: categoryId,
                    title: dto.title,
                    content: dto.content,
                    updated_at: new Date(),
                },
            });
            if (toRemove.length > 0) {
                await tx.post_img_tb.deleteMany({
                    where: { id: { in: toRemove.map((img) => img.id) } },
                });
            }
            await this.linkImages(tx, userId, postId, dto.imageIds);
        });

        return { removedFilePaths: toRemove.map((img) => img.file_path) };
    }

    /**
     * 좋아요/싫어요 토글. 같은 타입 재요청 = 취소, 다른 타입 = 변경.
     */
    async togglePostLike(
        userId: number,
        postId: number,
        likeType: PostLikeTypeValue
    ): Promise<PostLikeStateType> {
        const post = await this.prisma.post_tb.findUnique({
            where: { id: postId },
            select: { id: true },
        });
        if (!post) {
            throw new NotFoundError('게시글을 찾을 수 없습니다.');
        }

        const uniqueWhere = { post_id_user_id: { post_id: postId, user_id: userId } };
        const existing = await this.prisma.post_like_tb.findUnique({
            where: uniqueWhere,
            select: { like_type: true },
        });

        let myLikeType: PostLikeTypeValue | null;
        if (!existing) {
            await this.prisma.post_like_tb.create({
                data: { post_id: postId, user_id: userId, like_type: likeType },
            });
            myLikeType = likeType;
        } else if (existing.like_type === likeType) {
            await this.prisma.post_like_tb.delete({ where: uniqueWhere });
            myLikeType = null;
        } else {
            await this.prisma.post_like_tb.update({
                where: uniqueWhere,
                data: { like_type: likeType },
            });
            myLikeType = likeType;
        }

        const [likeCount, dislikeCount] = await Promise.all([
            this.prisma.post_like_tb.count({
                where: { post_id: postId, like_type: PostLikeType.LIKE },
            }),
            this.prisma.post_like_tb.count({
                where: { post_id: postId, like_type: PostLikeType.DISLIKE },
            }),
        ]);

        return { myLikeType, likeCount, dislikeCount };
    }

    /**
     * 에디터 선업로드 이미지 등록. post_id는 글 저장 시점에 연결된다.
     */
    async createPostImage(
        userId: number,
        file: SavedFileInfo
    ): Promise<{ id: number; filePath: string }> {
        const created = await this.prisma.post_img_tb.create({
            data: {
                user_id: userId,
                file_path: file.filePath,
                original_name: file.originalName,
                file_size: BigInt(file.size),
            },
            select: { id: true, file_path: true },
        });
        return { id: created.id, filePath: created.file_path };
    }

    private async getOwnedDraft(postId: number, userId: number) {
        const post = await this.prisma.post_tb.findUnique({
            where: { id: postId },
            select: {
                id: true,
                user_id: true,
                is_draft: true,
                title: true,
                content: true,
                board_tb: { select: { code: true } },
            },
        });
        if (!post || !post.is_draft) {
            throw new NotFoundError('임시저장 글을 찾을 수 없습니다.');
        }
        if (post.user_id !== userId) {
            throw new ForbiddenError('본인의 임시저장 글만 수정할 수 있습니다.');
        }
        return post;
    }

    /**
     * 임시저장 생성. 유저당 draft는 1개만 허용된다. 이미 draft가 있으면 그 내용을 그대로
     * 반환하는 게 아니라, 이번에 보낸 새 내용으로 덮어쓴다 — "이어쓰기"는 배너 클릭 시
     * GET /posts/:entityId로 불러오는 쪽에서 처리하고, 이 API는 항상 "새로 쓰기 시작" 의미다.
     * DB에도 partial unique index(uq_post_tb_user_draft)로 동시 요청 안전장치가 걸려 있다.
     */
    async createDraft(
        userId: number,
        dto: CreateDraftType
    ): Promise<{ id: number; isNew: boolean; removedFilePaths: string[] }> {
        const board = await this.prisma.board_tb.findUnique({
            where: { code: dto.boardCode },
            select: { id: true, code: true },
        });
        if (!board) {
            throw new BadRequestError(`존재하지 않는 게시판입니다: ${dto.boardCode}`);
        }
        const categoryId = await this.resolveCategoryId(board.code, dto.categoryCode);

        const existing = await this.prisma.post_tb.findFirst({
            where: { user_id: userId, is_draft: true },
            select: { id: true },
        });

        if (existing) {
            const currentImages = await this.prisma.post_img_tb.findMany({
                where: { post_id: existing.id },
                select: { id: true, file_path: true },
            });
            const nextIds = new Set(dto.imageIds);
            const toRemove = currentImages.filter((img) => !nextIds.has(img.id));

            await this.prisma.$transaction(async (tx) => {
                await tx.post_tb.update({
                    where: { id: existing.id },
                    data: {
                        board_id: board.id,
                        category_id: categoryId,
                        title: dto.title,
                        content: dto.content,
                        updated_at: new Date(),
                    },
                });
                if (toRemove.length > 0) {
                    await tx.post_img_tb.deleteMany({
                        where: { id: { in: toRemove.map((img) => img.id) } },
                    });
                }
                await this.linkImages(tx, userId, existing.id, dto.imageIds);
            });

            return {
                id: existing.id,
                isNew: false,
                removedFilePaths: toRemove.map((img) => img.file_path),
            };
        }

        const id = await this.prisma.$transaction(async (tx) => {
            const created = await tx.post_tb.create({
                data: {
                    board_id: board.id,
                    user_id: userId,
                    category_id: categoryId,
                    title: dto.title,
                    content: dto.content,
                    is_draft: true,
                },
                select: { id: true },
            });
            await this.linkImages(tx, userId, created.id, dto.imageIds);
            return created.id;
        });
        return { id, isNew: true, removedFilePaths: [] };
    }

    /**
     * 임시저장 수정(자동저장). imageIds는 updatePost와 동일하게 최종 상태 전체 전송.
     */
    async updateDraft(
        userId: number,
        postId: number,
        dto: UpdateDraftType
    ): Promise<{ removedFilePaths: string[] }> {
        const draft = await this.getOwnedDraft(postId, userId);
        const categoryId = await this.resolveCategoryId(draft.board_tb.code, dto.categoryCode);

        const currentImages = await this.prisma.post_img_tb.findMany({
            where: { post_id: postId },
            select: { id: true, file_path: true },
        });
        const nextIds = new Set(dto.imageIds);
        const toRemove = currentImages.filter((img) => !nextIds.has(img.id));

        await this.prisma.$transaction(async (tx) => {
            await tx.post_tb.update({
                where: { id: postId },
                data: {
                    category_id: categoryId,
                    title: dto.title,
                    content: dto.content,
                    updated_at: new Date(),
                },
            });
            if (toRemove.length > 0) {
                await tx.post_img_tb.deleteMany({
                    where: { id: { in: toRemove.map((img) => img.id) } },
                });
            }
            await this.linkImages(tx, userId, postId, dto.imageIds);
        });

        return { removedFilePaths: toRemove.map((img) => img.file_path) };
    }

    /**
     * 임시저장을 실제 게시글로 전환한다. title/content가 비어있으면 게시 불가.
     * 게시 시점을 createdAt으로 보이게 하기 위해 created_at을 현재 시각으로 갱신한다.
     *
     * 자동저장 이후 에디터에서 이미지를 추가/삭제만 하고(자동저장이 다시 붙기 전) 바로
     * 게시하면 본문에서 빠진 이미지가 post_img_tb에는 그대로 연결된 채 남을 수 있다.
     * 업로드된 이미지의 file_path가 곧 마크다운 본문에 삽입되는 URL이므로, 본문에 더는
     * 등장하지 않는 연결 이미지는 여기서 함께 정리한다.
     */
    async publishDraft(userId: number, postId: number): Promise<{ id: number; removedFilePaths: string[] }> {
        const draft = await this.getOwnedDraft(postId, userId);
        if (draft.title.trim().length === 0 || draft.content.trim().length === 0) {
            throw new BadRequestError('제목과 내용을 모두 입력해야 게시할 수 있습니다.');
        }

        const currentImages = await this.prisma.post_img_tb.findMany({
            where: { post_id: postId },
            select: { id: true, file_path: true },
        });
        const toRemove = currentImages.filter((img) => !draft.content.includes(img.file_path));

        await this.prisma.$transaction(async (tx) => {
            if (toRemove.length > 0) {
                await tx.post_img_tb.deleteMany({
                    where: { id: { in: toRemove.map((img) => img.id) } },
                });
            }
            await tx.post_tb.update({
                where: { id: postId },
                data: { is_draft: false, created_at: new Date() },
            });
        });

        return { id: draft.id, removedFilePaths: toRemove.map((img) => img.file_path) };
    }

    async getDrafts(
        userId: number,
        params: GetDraftsType
    ): Promise<{
        items: DraftListItemType[];
        total: number;
        offset: number;
        limit: number;
    }> {
        const { offset, limit } = params;
        const where: Prisma.post_tbWhereInput = { user_id: userId, is_draft: true };

        const [rows, total] = await Promise.all([
            this.prisma.post_tb.findMany({
                where,
                orderBy: [{ updated_at: { sort: 'desc', nulls: 'last' } }, { created_at: 'desc' }],
                skip: offset,
                take: limit,
                include: {
                    board_tb: { select: { code: true } },
                    post_category_code: { select: { code: true, name: true } },
                    post_img_tb: {
                        select: { id: true, file_path: true },
                        orderBy: { id: 'asc' },
                        take: MAX_LIST_THUMBNAILS,
                    },
                    _count: { select: { post_img_tb: true } },
                },
            }),
            this.prisma.post_tb.count({ where }),
        ]);

        return {
            items: rows.map((row) => ({
                id: row.id,
                boardCode: row.board_tb.code,
                category: row.post_category_code
                    ? { code: row.post_category_code.code, name: row.post_category_code.name }
                    : null,
                title: row.title,
                createdAt: row.created_at ? row.created_at.toISOString() : null,
                updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
                thumbnails: row.post_img_tb.map((img) => ({ id: img.id, filePath: img.file_path })),
                imageCount: row._count.post_img_tb,
            })),
            total,
            offset,
            limit,
        };
    }

    /**
     * Hard delete. 댓글/이미지/좋아요는 FK cascade로 함께 삭제된다.
     * 스토리지 삭제용 file_path를 반환한다.
     */
    async deletePost(userId: number, postId: number): Promise<{ filePaths: string[] }> {
        await this.getOwnedPost(postId, userId);

        const images = await this.prisma.post_img_tb.findMany({
            where: { post_id: postId },
            select: { file_path: true },
        });

        await this.prisma.post_tb.delete({ where: { id: postId } });

        return { filePaths: images.map((img) => img.file_path) };
    }
}
