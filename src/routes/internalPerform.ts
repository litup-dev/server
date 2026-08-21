import { BadRequestError } from '@/common/error.js';
import { errorResJson } from '@/schemas/common.schema';
import {
    GetPerformanceByDateRangeType,
    performanceForMarketingListResJson,
} from '@/schemas/performance.schema';
import { getPerformancesByDateRangeJson } from '@/schemas/performance.schema';
import { PerformanceService } from '@/services/performance.service.js';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const tempQuerySchema = z.object({
    offset: z.preprocess(
        (v) => (v !== undefined ? Number(v) : 0),
        z.number().int().min(0).default(0)
    ),
    limit: z.preprocess(
        (v) => (v !== undefined ? Number(v) : 9),
        z.number().int().min(1).default(9)
    ),
});

const createPerformanceSchema = z.object({
    club_id: z.number().int().positive(),
    instagram_shortcode: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    perform_date: z.string(),
    booking_price: z.number().int().min(0),
    onsite_price: z.number().int().min(0),
    booking_url: z.string().url().optional(),
    artists: z.array(z.object({ name: z.string() })),
    sns_links: z.array(z.object({ instagram: z.string().optional() })),
});

const createPerformanceManualSchema = z.object({
    club_id: z.number().int().positive(),
    title: z.string().min(1),
    description: z.string(),
    perform_date: z.string(),
    booking_price: z.number().int().min(0),
    onsite_price: z.number().int().min(0),
    booking_url: z.string().url().optional(),
    artists: z.array(z.object({ name: z.string() })),
    sns_links: z.array(z.object({ instagram: z.string().optional() })),
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

    fastify.get(
        '/internal/performances/marketing',
        {
            preHandler: [fastify.requireInternal],
            schema: {
                querystring: getPerformancesByDateRangeJson,
                tags: ['Performances'],
                summary: '메인 페이지 공연 목록 기간별 조회',
                description: '메인 페이지 공연 목록 기간별 조회',
                response: {
                    200: performanceForMarketingListResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetPerformanceByDateRangeType;

            const service = new PerformanceService(request.server.prisma);

            const result = await service.getPerformancesByDateRangeForMarketing(query);

            return reply.send({
                data: result,
            });
        }
    );

    fastify.post(
        '/internal/performances',
        {
            preHandler: [fastify.requireInternal],
            schema: { hide: true },
        },
        async (request, reply) => {
            const parsed = createPerformanceSchema.safeParse(request.body);
            if (!parsed.success) {
                throw new BadRequestError(parsed.error.errors.map((e) => e.message).join(', '));
            }

            const service = new PerformanceService(request.server.prisma);
            const result = await service.createPerformance(parsed.data);

            return reply.code(201).send(result);
        }
    );

    fastify.post(
        '/internal/performances/manual',
        {
            preHandler: [fastify.requireInternal],
            schema: { hide: true },
        },
        async (request, reply) => {
            const parsed = createPerformanceManualSchema.safeParse(request.body);
            if (!parsed.success) {
                throw new BadRequestError(parsed.error.errors.map((e) => e.message).join(', '));
            }

            const service = new PerformanceService(request.server.prisma);
            const result = await service.createPerformanceManual(parsed.data);

            return reply.code(201).send(result);
        }
    );
}
