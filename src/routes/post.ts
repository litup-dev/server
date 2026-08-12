import { FastifyInstance } from 'fastify';
import { PostService } from '@/services/post.service.js';
import {
    idParamJson,
    IdParamType,
    successResJson,
    errorResJson,
} from '@/schemas/common.schema.js';
import {
    createPostJson,
    updatePostJson,
    getPostsJson,
    postDetailResJson,
    postCreatedResJson,
    postListResJson,
    postLikeBodyJson,
    postLikeResJson,
    createDraftJson,
    updateDraftJson,
    getDraftsJson,
    draftCreatedResJson,
    draftPublishedResJson,
    draftListResJson,
    CreatePostType,
    CreateDraftType,
    GetDraftsType,
    GetPostsType,
    PostLikeBodyType,
    UpdateDraftType,
    UpdatePostType,
} from '@/schemas/post.schema.js';
import { NotFoundError } from '@/common/error.js';
import { FileManager } from '@/utils/fileManager.js';
import { createStorageAdapter } from '@/adapters/storage/index.js';

export async function postRoutes(fastify: FastifyInstance) {
    const fileManager = new FileManager(createStorageAdapter());

    async function deleteFilesBestEffort(filePaths: string[]) {
        for (const filePath of filePaths) {
            try {
                await fileManager.deleteFile(filePath);
            } catch (error) {
                fastify.log.error({ error, filePath }, '게시글 이미지 파일 삭제 실패');
            }
        }
    }

    fastify.get(
        '/posts',
        {
            schema: {
                querystring: getPostsJson,
                tags: ['Posts'],
                summary: '게시글 목록 조회',
                description:
                    '게시판별 게시글 목록을 조회합니다. 카테고리 필터, 검색(제목+내용/제목/내용/작성자), 정렬, 페이지네이션을 지원합니다.',
                response: {
                    200: postListResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const params = request.query as GetPostsType;
            const service = new PostService(request.server.prisma);
            const result = await service.getPosts(params);
            return reply.send({ data: result });
        }
    );

    fastify.post(
        '/posts',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                body: createPostJson,
                tags: ['Posts'],
                summary: '게시글 작성',
                description: '게시글을 작성합니다. imageIds는 선업로드된 이미지 ID 목록입니다.',
                response: {
                    200: postCreatedResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const dto = request.body as CreatePostType;
            const service = new PostService(request.server.prisma);
            const id = await service.createPost(userId, dto);
            return reply.send({ data: { id } });
        }
    );

    fastify.get(
        '/posts/:entityId',
        {
            preHandler: [fastify.optionalAuth],
            schema: {
                params: idParamJson,
                tags: ['Posts'],
                summary: '게시글 상세 조회',
                description:
                    '게시글 상세를 조회합니다. 로그인 상태면 isMine, myLikeType이 채워집니다.',
                response: {
                    200: postDetailResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const { entityId } = request.params as IdParamType;
            const service = new PostService(request.server.prisma);
            const result = await service.getPostById(request.userId, entityId);
            return reply.send({ data: result });
        }
    );

    fastify.patch(
        '/posts/:entityId',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                body: updatePostJson,
                tags: ['Posts'],
                summary: '게시글 수정',
                description:
                    '게시글을 수정합니다. imageIds는 수정 후 남는 이미지 전체 목록이며, 빠진 이미지는 삭제됩니다.',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    403: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const { entityId } = request.params as IdParamType;
            const dto = request.body as UpdatePostType;
            const service = new PostService(request.server.prisma);
            const { removedFilePaths } = await service.updatePost(userId, entityId, dto);
            await deleteFilesBestEffort(removedFilePaths);
            return reply.send({ data: { success: true, operation: 'updated' } });
        }
    );

    fastify.post(
        '/posts/draft',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                body: createDraftJson,
                tags: ['Posts'],
                summary: '임시저장 생성',
                description:
                    '작성 중인 글을 임시저장합니다. title/content는 완결성 검사 없이 부분 상태 그대로 저장됩니다. 유저당 draft는 1개만 허용되며, 이미 draft가 있으면 그 내용을 반환하는 게 아니라 이번에 보낸 새 내용으로 덮어씁니다(isNew: false). 기존 draft를 이어서 작성하려면 이 API 대신 GET /posts/:entityId로 불러온 뒤 PATCH /posts/draft/:entityId로 저장하세요.',
                response: {
                    200: draftCreatedResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const dto = request.body as CreateDraftType;
            const service = new PostService(request.server.prisma);
            const { removedFilePaths, ...result } = await service.createDraft(userId, dto);
            await deleteFilesBestEffort(removedFilePaths);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/posts/drafts',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                querystring: getDraftsJson,
                tags: ['Posts'],
                summary: '내 임시저장 목록 조회',
                description: '본인이 작성 중인 임시저장 글 목록을 최근 저장순으로 조회합니다.',
                response: {
                    200: draftListResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const params = request.query as GetDraftsType;
            const service = new PostService(request.server.prisma);
            const result = await service.getDrafts(userId, params);
            return reply.send({ data: result });
        }
    );

    fastify.patch(
        '/posts/draft/:entityId',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                body: updateDraftJson,
                tags: ['Posts'],
                summary: '임시저장 수정 (자동저장)',
                description:
                    '임시저장 글을 수정합니다. imageIds는 수정 후 남는 이미지 전체 목록이며, 빠진 이미지는 삭제됩니다.',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    403: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const { entityId } = request.params as IdParamType;
            const dto = request.body as UpdateDraftType;
            const service = new PostService(request.server.prisma);
            const { removedFilePaths } = await service.updateDraft(userId, entityId, dto);
            await deleteFilesBestEffort(removedFilePaths);
            return reply.send({ data: { success: true, operation: 'updated' } });
        }
    );

    fastify.post(
        '/posts/draft/:entityId/publish',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                tags: ['Posts'],
                summary: '임시저장 게시',
                description:
                    '임시저장 글을 실제 게시글로 전환합니다. title/content가 비어있으면 400. 게시 시각이 createdAt으로 갱신됩니다.',
                response: {
                    200: draftPublishedResJson,
                    400: errorResJson,
                    403: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const { entityId } = request.params as IdParamType;
            const service = new PostService(request.server.prisma);
            const id = await service.publishDraft(userId, entityId);
            return reply.send({ data: { id } });
        }
    );

    fastify.post(
        '/posts/:entityId/like',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                body: postLikeBodyJson,
                tags: ['Posts'],
                summary: '게시글 좋아요/싫어요 토글',
                description:
                    '좋아요/싫어요를 등록합니다. 같은 타입 재요청 시 취소, 다른 타입이면 변경됩니다.',
                response: {
                    200: postLikeResJson,
                    400: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const { entityId } = request.params as IdParamType;
            const { likeType } = request.body as PostLikeBodyType;
            const service = new PostService(request.server.prisma);
            const result = await service.togglePostLike(userId, entityId, likeType);
            return reply.send({ data: result });
        }
    );

    fastify.delete(
        '/posts/:entityId',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                tags: ['Posts'],
                summary: '게시글 삭제',
                description: '게시글을 삭제합니다. 댓글/이미지/좋아요가 함께 삭제됩니다.',
                response: {
                    200: successResJson,
                    403: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const { entityId } = request.params as IdParamType;
            const service = new PostService(request.server.prisma);
            const { filePaths } = await service.deletePost(userId, entityId);
            await deleteFilesBestEffort(filePaths);
            return reply.send({ data: { success: true, operation: 'deleted' } });
        }
    );
}
