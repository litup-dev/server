import { FastifyInstance } from 'fastify';
import { PerformanceService } from '@/services/performance.service';
import { getPerformanceByDateRangeSchema } from '@/schemas/performance.schema';
import { GetPerformancesByDateRangeQueryDto } from '@/dto/performance.dto';

export async function performanceRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/performances',
        {
            schema: {
                ...getPerformanceByDateRangeSchema,
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
}
