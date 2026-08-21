import { FastifyInstance } from 'fastify';
import { PostCommentService } from '@/services/postComment.service.js';
import {
    idParamJson,
    IdParamType,
    successResJson,
    errorResJson,
} from '@/schemas/common.schema.js';
import {
    createCommentJson,
    updateCommentJson,
    getCommentsJson,
    commentListResJson,
    commentCreatedResJson,
    mentionableUsersResJson,
    commentLikeResJson,
    CreateCommentType,
    GetCommentsType,
    UpdateCommentType,
} from '@/schemas/postComment.schema.js';
import { NotFoundError } from '@/common/error.js';

export async function postCommentRoutes(fastify: FastifyInstance) {
    fastify.post(
        '/posts/:entityId/comments',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                body: createCommentJson,
                tags: ['Post Comments'],
                summary: '댓글 작성',
                description: '게시글에 댓글을 작성합니다. parentId를 주면 대댓글로 등록됩니다.',
                response: {
                    200: commentCreatedResJson,
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
            const dto = request.body as CreateCommentType;
            const service = new PostCommentService(request.server.prisma);
            const id = await service.createComment(userId, entityId, dto);
            return reply.send({ data: { id } });
        }
    );

    fastify.get(
        '/posts/:entityId/comments',
        {
            preHandler: [fastify.optionalAuth],
            schema: {
                params: idParamJson,
                querystring: getCommentsJson,
                tags: ['Post Comments'],
                summary: '댓글 목록 조회',
                description:
                    '게시글의 댓글 목록을 등록순으로 조회합니다. 페이지네이션은 최상위 댓글 기준이며, 대댓글은 각 댓글의 replies에 flat 배열(parentId 포함)로 내려갑니다.',
                response: {
                    200: commentListResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const { entityId } = request.params as IdParamType;
            const params = request.query as GetCommentsType;
            const service = new PostCommentService(request.server.prisma);
            const result = await service.getComments(request.userId, entityId, params);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/posts/:entityId/mentionable-users',
        {
            preHandler: [fastify.optionalAuth],
            schema: {
                params: idParamJson,
                tags: ['Post Comments'],
                summary: '대댓글 태그 가능 사용자 목록 조회',
                description:
                    '게시글 작성자와 댓글/대댓글 작성자(삭제된 댓글 제외)를 중복 없이 반환합니다. 작성자가 배열 첫 번째로 오고, 이후 최초 댓글 등록순입니다.',
                response: {
                    200: mentionableUsersResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const { entityId } = request.params as IdParamType;
            const service = new PostCommentService(request.server.prisma);
            const data = await service.getMentionableUsers(entityId);
            return reply.send({ data });
        }
    );

    fastify.post(
        '/comments/:entityId/like',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                tags: ['Post Comments'],
                summary: '댓글 좋아요 토글',
                description: '댓글에 좋아요를 등록/취소합니다. 이미 눌렀으면 취소됩니다.',
                response: {
                    200: commentLikeResJson,
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
            const service = new PostCommentService(request.server.prisma);
            const result = await service.toggleCommentLike(userId, entityId);
            return reply.send({ data: result });
        }
    );

    fastify.patch(
        '/comments/:entityId',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                body: updateCommentJson,
                tags: ['Post Comments'],
                summary: '댓글 수정',
                description: '본인이 작성한 댓글을 수정합니다.',
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
            const dto = request.body as UpdateCommentType;
            const service = new PostCommentService(request.server.prisma);
            await service.updateComment(userId, entityId, dto);
            return reply.send({ data: { success: true, operation: 'updated' } });
        }
    );

    fastify.delete(
        '/comments/:entityId',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                tags: ['Post Comments'],
                summary: '댓글 삭제',
                description: '본인이 작성한 댓글을 삭제합니다. 대댓글도 함께 삭제됩니다.',
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
            const service = new PostCommentService(request.server.prisma);
            await service.deleteComment(userId, entityId);
            return reply.send({ data: { success: true, operation: 'deleted' } });
        }
    );
}
