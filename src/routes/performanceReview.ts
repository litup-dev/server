import { FastifyInstance } from 'fastify';
import { PerformanceReviewService } from '@/services/performance_review.service';
import { idParamJson, errorResponseJsonSchema, idParamType } from '@/schemas/common.schema';
import {
    performanceReviewListResJson,
    performanceReviewResJson,
    createPerformanceReviewJson,
} from '@/schemas/perfomanceReview.schema';

export async function performanceReviewRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/performance/:performId/reviews',
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
            const { performId } = request.params as idParamType;
            const service = new PerformanceReviewService(request.server.prisma);
            const result = await service.getReviewsByPerformanceId(performId);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.post(
        '/performance/:performId/reviews',
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
            const { performId } = request.params as idParamType;
            const service = new PerformanceReviewService(request.server.prisma);
            const { content } = request.body as { content: string };
            const userId = 1;
            const result = await service.createReview(performId, userId, content);
            return reply.send({
                data: result,
            });
        }
    );
}
