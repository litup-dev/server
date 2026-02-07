import { FastifyInstance } from 'fastify';
import { PerformanceService } from '@/services/performance.service.js';
import {
    getPerformancesByDateRangeJson,
    GetPerformanceByDateRangeType,
    performanceListResJson,
    performDetailResJson,
    searchPerformancesJson,
    SearchPerformancesType,
    getPerformancesByMonthJson,
    GetPerformanceCalendarType,
    performanceCalendarListResponseSchema,
    performanceMonthByClubListResJson,
} from '@/schemas/performance.schema.js';
import {
    idParamSchema,
    idParamJson,
    errorResJson,
    booleanSuccessResJson,
} from '@/schemas/common.schema.js';
import { BadRequestError, NotFoundError } from '@/common/error.js';

export async function performanceRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/performances/search',
        {
            schema: {
                querystring: searchPerformancesJson,
                tags: ['Performances'],
                summary: '공연 목록 전체 조회',
                description: '공연 목록 전체 조회',
                response: {
                    200: performanceListResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as SearchPerformancesType;

            const service = new PerformanceService(request.server.prisma);

            const result = await service.getSearchPerformances(query);

            return reply.send({
                data: result,
            });
        }
    );
    fastify.get(
        '/performances',
        {
            schema: {
                querystring: getPerformancesByDateRangeJson,
                tags: ['Performances'],
                summary: '메인 페이지 공연 목록 기간별 조회',
                description: '메인 페이지 공연 목록 기간별 조회',
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

    fastify.get(
        '/performances/calendar',
        {
            schema: {
                querystring: getPerformancesByMonthJson,
                tags: ['Performances'],
                summary: '메인 페이지 공연 목록 월별 조회',
                description: '메인 페이지 공연 목록 월별 조회',
                response: {
                    // 200: performanceCalendarListResponseSchema,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetPerformanceCalendarType;

            const service = new PerformanceService(request.server.prisma);

            const result = await service.getPerformancesByMonth(query);

            return reply.send({
                data: result,
            });
        }
    );

    fastify.get(
        '/performances/club/:entityId/calendar',
        {
            preHandler: [fastify.optionalAuth],
            schema: {
                params: idParamJson,
                querystring: getPerformancesByMonthJson,
                tags: ['Performances'],
                summary: '클럽별 공연 목록 월별 조회',
                description: '클럽별 공연 목록 월별 조회',
                response: {
                    200: performanceMonthByClubListResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }

            const { entityId } = parsed.data;
            const query = request.query as GetPerformanceCalendarType;
            const service = new PerformanceService(request.server.prisma);

            const result = await service.getClubMonthlyPerformances({
                month: query.month,
                entityId,
                userId: request.userId,
            });

            return reply.send({
                data: result,
            });
        }
    );

    fastify.post(
        '/performances/:entityId/attend',
        {
            preHandler: [fastify.requireAuth],
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
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }

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
            preHandler: [fastify.requireAuth],
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
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }

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
            preHandler: [fastify.optionalAuth],
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
            const result = await service.getPerformanceDetails(entityId, request.userId);
            return reply.send({ data: result });
        }
    );
}
