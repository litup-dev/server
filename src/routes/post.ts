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
    CreatePostType,
    GetPostsType,
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
                    '게시판별 게시글 목록을 조회합니다. 카테고리 필터, 제목+내용 검색, 정렬, 페이지네이션을 지원합니다.',
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
