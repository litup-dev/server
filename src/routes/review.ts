import { FastifyInstance } from 'fastify';
import { ReviewService } from '@/services/review.service.js';
import {
    createReviewJson,
    CreateReviewType,
    updateReviewJson,
    UpdateReviewType,
    getReviewsJson,
    GetReviewsType,
    reviewDetailResJson,
    reviewListResJson,
} from '@/schemas/review.schema.js';
import { idParamSchema, idParamJson, errorResJson } from '@/schemas/common.schema.js';
import { BadRequestError, NotFoundError } from '@/common/error.js';

export async function reviewRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/clubs/:entityId/reviews',
        {
            preHandler: [fastify.optionalAuth],
            schema: {
                params: idParamJson,
                querystring: getReviewsJson,
                tags: ['Reviews'],
                summary: '클럽의 리뷰 목록 조회',
                description: '클럽의 리뷰 목록 조회',
                response: {
                    200: reviewListResJson,
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
            const query = request.query as GetReviewsType;
            let userId = null;
            if (request.user) {
                userId = request.user.userId;
            }

            const service = new ReviewService(request.server.prisma);
            const result = await service.getReviewsByClubId(userId, entityId, query);

            request.log.info(`Found ${result.items.length} reviews for club ${entityId}`);

            return reply.send({
                data: result,
            });
        }
    );

    fastify.get(
        '/reviews/:entityId',
        {
            schema: {
                params: idParamJson,
                tags: ['Reviews'],
                summary: '리뷰 상세 조회',
                description: '리뷰 상세 조회',
                response: {
                    200: reviewDetailResJson,
                    400: errorResJson,
                    404: errorResJson,
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

            const service = new ReviewService(request.server.prisma);
            const result = await service.getById(entityId);

            request.log.info(`Found review with ID ${entityId}`);

            return reply.send({ data: result });
        }
    );

    fastify.post(
        '/clubs/:entityId/reviews',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                body: createReviewJson,
                tags: ['Reviews'],
                summary: '리뷰 등록',
                description: '리뷰 등록',
                response: {
                    201: reviewDetailResJson,
                    400: errorResJson,
                    404: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }

            const { entityId: clubId } = parsed.data;
            const body = request.body as CreateReviewType;

            const userId = request.user.userId;

            const service = new ReviewService(request.server.prisma);

            // 클럽 존재 여부 확인
            const club = await request.server.prisma.club.findUnique({
                where: { id: clubId },
            });

            if (!club) {
                throw new NotFoundError('클럽을 찾을 수 없습니다.');
            }

            const result = await service.create(clubId, userId, body);

            request.log.info(`Created review with ID ${result.id} for club ${clubId}`);

            return reply.status(201).send({ data: result });
        }
    );

    fastify.patch(
        '/reviews/:entityId',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                body: updateReviewJson,
                tags: ['Reviews'],
                summary: '리뷰 수정',
                description: '리뷰 수정',
                response: {
                    200: reviewDetailResJson,
                    400: errorResJson,
                    404: errorResJson,
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
            const body = request.body as UpdateReviewType;

            const userId = request.user.userId;

            const service = new ReviewService(request.server.prisma);
            const result = await service.update(entityId, userId, body);

            request.log.info(`Updated review with ID ${entityId}`);

            return reply.send({ data: result });
        }
    );

    fastify.delete(
        '/reviews/:entityId',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                params: idParamJson,
                tags: ['Reviews'],
                summary: '리뷰 삭제',
                description: '리뷰 삭제',
                response: {
                    204: { type: 'null', description: '삭제 성공' },
                    400: errorResJson,
                    404: errorResJson,
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

            const userId = request.user.userId;

            const service = new ReviewService(request.server.prisma);
            await service.delete(entityId, userId);

            request.log.info(`Deleted review with ID ${entityId}`);

            return reply.status(204).send();
        }
    );
}
