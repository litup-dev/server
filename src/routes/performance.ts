import { FastifyInstance } from 'fastify';
import { PerformanceService } from '@/services/performance.service';
import {
    getPerformanceByDateRangeSchema,
    getPerformanceByDateRangeJsonSchema,
} from '@/schemas/performance.schema';
import { GetPerformancesByDateRangeQueryDto } from '@/dto/performance.dto';
import { idParamSchema, idParamJsonSchema } from '@/schemas/common.schema';

export async function performanceRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/performances',
        {
            schema: {
                querystring: getPerformanceByDateRangeJsonSchema,
                tags: ['Performances'],
                summary: '공연 목록 조회',
                description: '공연 목록 조회',
            },
        },
        async (request, reply) => {
            const parsed = getPerformanceByDateRangeSchema.safeParse(request.query);
            if (!parsed.success) {
                return reply
                    .status(400)
                    .send(`허용되지 않은 쿼리 파라미터 입니다. ${parsed.error.message}`);
            }

            const { startDate, endDate, isFree, area, offset, limit } = parsed.data;

            const service = new PerformanceService(request.server.prisma);

            const q: Partial<GetPerformancesByDateRangeQueryDto> = {
                startDate,
                endDate,
            };
            if (area !== undefined) q.area = area;
            if (isFree) q.isFree = isFree;
            if (offset !== undefined) q.offset = offset;
            if (limit !== undefined) q.limit = limit;

            return service.getPerformancesByDateRange(q as GetPerformancesByDateRangeQueryDto);
        }
    );

    fastify.post(
        '/performances/:performId/attend',
        {
            schema: {
                params: idParamJsonSchema,
                tags: ['Performances'],
                summary: '공연 참석/취소',
                description: '공연 참석/취소',
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                return reply
                    .status(400)
                    .send(`허용되지 않은 쿼리 파라미터 입니다. ${parsed.error.message}`);
            }

            const { performId } = parsed.data;
            // 임시 추출
            const userId = 1;

            const service = new PerformanceService(request.server.prisma);
            try {
                const result = await service.attendPerformance(userId, performId);
                if (result === 'true') {
                    return reply.status(201).send({ data: 'true' });
                } else {
                    return reply.status(200).send({ data: 'false' });
                }
            } catch (err: any) {
                request.log.error(err);
                return reply.status(500).send({ error: '요청 실패' });
            }
        }
    );

    fastify.get(
        '/performances/:performId/attend',
        {
            schema: {
                params: idParamJsonSchema,
                tags: ['Performances'],
                summary: '공연 참석확인',
                description: '공연 참석확인',
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                return reply
                    .status(400)
                    .send(`허용되지 않은 쿼리 파라미터 입니다. ${parsed.error.message}`);
            }

            const { performId } = parsed.data;
            // 임시 추출
            const userId = 1;

            const service = new PerformanceService(request.server.prisma);
            try {
                const result = await service.isUserAttending(userId, performId);
                return reply.status(200).send({ data: result });
            } catch (err: any) {
                request.log.error(err);
                return reply.status(500).send({ error: '요청 실패' });
            }
        }
    );
}
