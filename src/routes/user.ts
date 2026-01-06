import { BadRequestError } from '@/common/error.js';
import {
    bodyIdsJson,
    defaultPaginationJson,
    DefaultPaginationType,
    errorResJson,
    idParamJson,
    idParamSchema,
    successResJson,
} from '@/schemas/common.schema.js';
import { clubListSimpleResJson } from '@/schemas/club.schema.js';
import { performanceRecordsResJson } from '@/schemas/performance.schema.js';
import {
    userInfoResJson,
    userPrivacySettingJson,
    UserPrivacySettingType,
    userProfileEditJson,
    UserProfileEditType,
    userStatsResJson,
} from '@/schemas/user.schema.js';
import { UserService } from '@/services/user.service.js';
import { FastifyInstance } from 'fastify';
import { parseJwt, parseJwtOptional } from '@/utils/jwt.js';
import { getReviewsJson, GetReviewsType, reviewListResJson } from '@/schemas/review.schema';
import { ReviewService } from '@/services/review.service';
import {
    getPerformanceReviewsByUserJson,
    GetPerformanceReviewsByUserType,
    performanceReviewListResJson,
} from '@/schemas/performanceReview.schema';
import { PerformanceReviewService } from '@/services/performanceReview.service';

export async function userRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/users/:entityId',
        {
            schema: {
                params: idParamJson,
                tags: ['User'],
                summary: '유저 정보 조회',
                description: '유저 정보 조회',
                response: {
                    200: userInfoResJson,
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
            const service = new UserService(request.server.prisma);
            const { entityId } = parsed.data;
            const result = await service.getUserById(entityId);

            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/stats/:entityId',
        {
            schema: {
                tags: ['User'],
                summary: '유저 통계 조회',
                description: '유저 통계 조회',
                response: {
                    200: userStatsResJson,
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
            const service = new UserService(request.server.prisma);
            const { entityId } = parsed.data;
            const result = await service.getUserStats(entityId);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/perform-history/:entityId',
        {
            schema: {
                params: idParamJson,
                querystring: defaultPaginationJson,
                tags: ['User'],
                summary: '유저 관람 기록 조회',
                description: '유저 관람 기록 조회',
                response: {
                    200: performanceRecordsResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const { offset, limit } = request.query as DefaultPaginationType;
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }
            const { entityId } = parsed.data;
            const userId = parseJwtOptional(request.headers);
            const service = new UserService(request.server.prisma);
            const result = await service.getUserPerformHistory(entityId, userId, offset, limit);

            return reply.send({ data: result });
        }
    );

    fastify.delete(
        '/users/perform-history',
        {
            schema: {
                tags: ['User'],
                summary: '유저 관람 기록 삭제',
                description: '유저 관람 기록 삭제',
                body: bodyIdsJson,
                response: {
                    200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const { entityIds } = request.body as { entityIds: number[] };
            const service = new UserService(request.server.prisma);
            const { userId } = parseJwt(request.headers);
            const result = await service.deleteUserAttendanceRecords(userId, entityIds);

            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/favorite-clubs/:entityId',
        {
            schema: {
                tags: ['User'],
                params: idParamJson,
                querystring: defaultPaginationJson,
                summary: '유저 관심 클럽 조회',
                description: '유저 관심 클럽 조회',
                response: {
                    200: clubListSimpleResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const { offset, limit } = request.query as DefaultPaginationType;
            const parsed = idParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }
            const { entityId } = parsed.data;
            const userId = parseJwtOptional(request.headers);
            const service = new UserService(request.server.prisma);
            const result = await service.getUserFavoriteClubs(entityId, userId, offset, limit);

            return reply.send({ data: result });
        }
    );

    fastify.delete(
        '/users/favorite-clubs',
        {
            schema: {
                tags: ['User'],
                summary: '유저 관심 클럽 삭제',
                description: '유저 관심 클럽 삭제',
                body: bodyIdsJson,
                response: {
                    200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const { entityIds } = request.body as { entityIds: number[] };
            const service = new UserService(request.server.prisma);
            const { userId } = parseJwt(request.headers);
            const result = await service.deleteUserFavoriteClubs(userId, entityIds);

            return reply.send({ data: result });
        }
    );

    fastify.patch(
        '/users/info',
        {
            schema: {
                tags: ['User'],
                summary: '유저 프로필 수정',
                description: '유저 프로필 수정',
                body: userProfileEditJson,
            },
        },
        async (request, reply) => {
            const service = new UserService(request.server.prisma);
            const { userId } = parseJwt(request.headers);
            const profileData = request.body as UserProfileEditType;
            const result = await service.updateUserProfile(userId, profileData);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/settings/privacy',
        {
            schema: {
                tags: ['User'],
                summary: '유저 정보 공개범위 조회',
                description: '유저 정보 공개범위 조회',
            },
        },
        async (request, reply) => {
            const service = new UserService(request.server.prisma);
            const { userId } = parseJwt(request.headers);
            const result = await service.getUserPrivacySettings(userId);
            return reply.send({ data: result });
        }
    );

    fastify.patch(
        '/users/settings/privacy',
        {
            schema: {
                tags: ['User'],
                summary: '유저 정보 공개범위 수정',
                description: '유저 정보 공개범위 수정',
                body: userPrivacySettingJson,
            },
        },
        async (request, reply) => {
            const service = new UserService(request.server.prisma);
            const { userId } = parseJwt(request.headers);
            const privacyData = request.body as UserPrivacySettingType;
            const result = await service.updateUserPrivacySettings(userId, privacyData);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/me/club-reviews',
        {
            schema: {
                querystring: getReviewsJson,
                tags: ['User'],
                summary: '내가 작성한 모든 클럽의 리뷰 목록 조회',
                description: '내가 작성한 모든 클럽의 리뷰 목록 조회',
                response: {
                    200: reviewListResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetReviewsType;

            const { userId } = parseJwt(request.headers);

            const service = new ReviewService(request.server.prisma);
            const result = await service.getReviewsByUserId(userId, query);

            return reply.send({
                data: result,
            });
        }
    );

    fastify.get(
        '/users/me/perform-review',
        {
            schema: {
                querystring: getPerformanceReviewsByUserJson,
                tags: ['User'],
                summary: '유저 모든 공연 한줄평 조회',
                description: '유저 모든 한줄평 목록 조회',
                response: {
                    200: performanceReviewListResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetPerformanceReviewsByUserType;
            const service = new PerformanceReviewService(request.server.prisma);
            // const { userId } = parseJwt(request.headers);
            const userId = 1;
            const result = await service.getReviewsByUserId(userId, query);
            return reply.send({
                data: result,
            });
        }
    );
}
