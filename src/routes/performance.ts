import { FastifyInstance } from 'fastify';
import { PerformanceService } from '@/services/performance.service';
import {
    getPerformanceByDateRangeSchema,
    getPerformanceByDateRangeJson,
    GetPerformanceByDateRangeType,
    performanceListResJson,
    attendRes,
    performDetailResJson,
} from '@/schemas/performance.schema';
import {
    idParamSchema,
    idParamJson,
    errorResponseJsonSchema,
    booleanSuccessResponseJsonSchema,
} from '@/schemas/common.schema';
import { BadRequestError } from '@/common/error';

export async function performanceRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/performances',
        {
            schema: {
                querystring: getPerformanceByDateRangeJson,
                tags: ['Performances'],
                summary: '공연 목록 조회',
                description: '공연 목록 조회',
                response: {
                    200: performanceListResJson,
                    400: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetPerformanceByDateRangeType;

            const service = new PerformanceService(request.server.prisma);

            const result = await service.getPerformancesByDateRange(query);

            return reply.send({
                data: result,
            });
        }
    );

    fastify.post(
        '/performances/:performId/attend',
        {
            schema: {
                params: idParamJson,
                tags: ['Performances'],
                summary: '공연 참석/취소',
                description: '공연 참석/취소',
                response: {
                    200: booleanSuccessResponseJsonSchema,
                    201: booleanSuccessResponseJsonSchema,
                    400: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(
                    `허용되지 않은 쿼리 파라미터 입니다. ${parsed.error.message}`
                );
            }

            const { performId } = parsed.data;
            // 임시 추출
            const userId = 1;

            const service = new PerformanceService(request.server.prisma);
            const result = await service.attendPerformance(userId, performId);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.get(
        '/performances/:performId/attend',
        {
            schema: {
                params: idParamJson,
                tags: ['Performances'],
                summary: '공연 참석확인',
                description: '공연 참석확인',
                response: {
                    200: booleanSuccessResponseJsonSchema,
                    201: booleanSuccessResponseJsonSchema,
                    400: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(
                    `허용되지 않은 쿼리 파라미터 입니다. ${parsed.error.message}`
                );
            }

            const { performId } = parsed.data;
            // 임시 추출
            const userId = 1;

            const service = new PerformanceService(request.server.prisma);
            const result = await service.isUserAttending(userId, performId);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.get(
        '/performances/:performId/details',
        {
            schema: {
                params: idParamJson,
                tags: ['Performances'],
                summary: '공연 상세정보',
                description: '공연 상세정보',
                response: {
                    200: performDetailResJson,
                    400: errorResponseJsonSchema,
                    404: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(
                    `허용되지 않은 쿼리 파라미터 입니다. ${parsed.error.message}`
                );
            }

            const { performId } = parsed.data;

            const service = new PerformanceService(request.server.prisma);
            const result = await service.getPerformanceDetails(performId);
            return reply.send({ data: result });
        }
    );
}
