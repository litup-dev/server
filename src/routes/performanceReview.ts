import { FastifyInstance } from 'fastify';
import { PerformanceReviewService } from '@/services/performanceReview.service.js';
import {
    idParamJson,
    successResponseJson,
    errorResponseJsonSchema,
    idParamType,
} from '@/schemas/common.schema.js';
import {
    performanceReviewListResJson,
    performanceReviewResJson,
    createPerformanceReviewJson,
} from '@/schemas/performanceReview.schema.js';

export async function performanceReviewRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/performance/:entityId/reviews',
        {
            schema: {
                params: idParamJson,
                tags: ['Performance Reviews'],
                summary: '공연 한줄평 목록 조회',
                description: '공연 한줄평 목록 조회',
                response: {
                    200: performanceReviewListResJson,
                    400: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const { entityId } = request.params as idParamType;
            const service = new PerformanceReviewService(request.server.prisma);
            const result = await service.getReviewsByPerformanceId(entityId);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.post(
        '/performance/:entityId/reviews',
        {
            schema: {
                params: idParamJson,
                body: createPerformanceReviewJson,
                tags: ['Performance Reviews'],
                summary: '공연 한줄평 작성',
                description: '공연 한줄평 작성',
                response: {
                    201: performanceReviewResJson,
                    400: errorResponseJsonSchema,
                    409: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const { entityId } = request.params as idParamType;
            const service = new PerformanceReviewService(request.server.prisma);
            const { content } = request.body as { content: string };
            const userId = 1; // 임시 ID
            const result = await service.createReview(entityId, userId, content);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.patch(
        '/performance/reviews/:entityId',
        {
            schema: {
                params: idParamJson,
                body: createPerformanceReviewJson,
                tags: ['Performance Reviews'],
                summary: '공연 한줄평 수정',
                description: '공연 한줄평 수정',
                response: {
                    201: performanceReviewResJson,
                    400: errorResponseJsonSchema,
                    409: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const { entityId } = request.params as idParamType;
            const service = new PerformanceReviewService(request.server.prisma);
            const { content } = request.body as { content: string };
            const userId = 1; // 임시 ID
            const result = await service.patchReview(entityId, userId, content);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.delete(
        '/performance/reviews/:entityId',
        {
            schema: {
                params: idParamJson,
                tags: ['Performance Reviews'],
                summary: '공연 한줄평 삭제',
                description: '공연 한줄평 삭제',
                response: {
                    200: successResponseJson,
                    400: errorResponseJsonSchema,
                    409: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const { entityId } = request.params as idParamType;
            const service = new PerformanceReviewService(request.server.prisma);
            const userId = 1; // 임시 ID
            const result = await service.deleteReview(entityId, userId);
            return { data: result };
        }
    );
}
