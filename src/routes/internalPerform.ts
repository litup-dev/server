import { BadRequestError } from '@/common/error.js';
import { PerformanceService } from '@/services/performance.service.js';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const tempQuerySchema = z.object({
    offset: z.preprocess((v) => (v !== undefined ? Number(v) : 0), z.number().int().min(0).default(0)),
    limit: z.preprocess((v) => (v !== undefined ? Number(v) : 9), z.number().int().min(1).default(9)),
});

export async function internalPerformanceRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/internal/performances/temp',
        {
            preHandler: [fastify.requireInternal],
            schema: { hide: true },
        },
        async (request, reply) => {
            const parsed = tempQuerySchema.safeParse(request.query);
            if (!parsed.success) {
                throw new BadRequestError(parsed.error.errors.map((e) => e.message).join(', '));
            }

            const service = new PerformanceService(request.server.prisma);
            const result = await service.getTempPerformances(parsed.data.offset, parsed.data.limit);

            return reply.send(result);
        }
    );
}
