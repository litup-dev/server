import { FastifyInstance } from 'fastify';
import { PerformanceReviewService } from '@/services/performance_review.service';
import { idParamJson, errorResponseJsonSchema, idParamType } from '@/schemas/common.schema';
import { performReviewListResJson } from '@/schemas/perfomance_review.schema';

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
                    200: performReviewListResJson,
                    400: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const { performId } = request.params as idParamType;
            const service = new PerformanceReviewService(request.server.prisma);
            try {
                const result = await service.getReviewsByPerformanceId(performId);
                console.log(result);
                return reply.send({
                    data: result,
                });
            } catch (err: any) {
                request.log.error(err);
                return reply.status(500).send({
                    error: {
                        statusCode: 500,
                        message: '요청 실패',
                    },
                });
            }
        }
    );
}
