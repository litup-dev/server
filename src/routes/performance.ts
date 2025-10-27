import { FastifyInstance } from 'fastify';
import { PerformanceService } from '@/services/performance.service.js';
import {
    getPerformanceByDateRangeJson,
    GetPerformanceByDateRangeType,
    performanceListResJson,
    performDetailResJson,
} from '@/schemas/performance.schema.js';
import {
    idParamSchema,
    idParamJson,
    errorResJson,
    booleanSuccessResJson,
} from '@/schemas/common.schema.js';
import { BadRequestError } from '@/common/error.js';

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
                    400: errorResJson,
                    500: errorResJson,
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
        '/performances/:entityId/attend',
        {
            schema: {
                params: idParamJson,
                tags: ['Performances'],
                summary: '공연 참석/취소',
                description: '공연 참석/취소',
                response: {
                    200: booleanSuccessResJson,
                    201: booleanSuccessResJson,
                    400: errorResJson,
                    500: errorResJson,
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

            const { entityId } = parsed.data;
            // 임시 추출
            const userId = 1;

            const service = new PerformanceService(request.server.prisma);
            const result = await service.attendPerformance(userId, entityId);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.get(
        '/performances/:entityId/attend',
        {
            schema: {
                params: idParamJson,
                tags: ['Performances'],
                summary: '공연 참석확인',
                description: '공연 참석확인',
                response: {
                    200: booleanSuccessResJson,
                    201: booleanSuccessResJson,
                    400: errorResJson,
                    500: errorResJson,
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

            const { entityId } = parsed.data;
            // 임시 추출
            const userId = 1;

            const service = new PerformanceService(request.server.prisma);
            const result = await service.isUserAttending(userId, entityId);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.get(
        '/performances/:entityId/details',
        {
            schema: {
                params: idParamJson,
                tags: ['Performances'],
                summary: '공연 상세정보',
                description: '공연 상세정보',
                response: {
                    200: performDetailResJson,
                    400: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
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

            const { entityId } = parsed.data;

            const service = new PerformanceService(request.server.prisma);
            const result = await service.getPerformanceDetails(entityId);
            return reply.send({ data: result });
        }
    );
}
