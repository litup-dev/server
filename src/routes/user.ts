import { BadRequestError, NotFoundError } from '@/common/error.js';
import {
    bodyIdsJson,
    commonSortJson,
    CommonSortType,
    defaultPaginationJson,
    DefaultPaginationType,
    errorResJson,
    publicIdParamJson,
    publicIdParamSchema,
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
import { reviewListResponseByUserResJson } from '@/schemas/review.schema';
import { ReviewService } from '@/services/review.service';
import {
    getPerformanceReviewsByUserJson,
    GetPerformanceReviewsByUserType,
    performanceReviewListForUserResJson,
} from '@/schemas/performanceReview.schema';
import { PerformanceReviewService } from '@/services/performanceReview.service';

export async function userRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/users/:publicId',
        {
            schema: {
                params: publicIdParamJson,
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
            const parsed = publicIdParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }
            const service = new UserService(request.server.prisma);
            const { publicId } = parsed.data;
            const result = await service.getUserByPublicId(publicId);

            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/stats/:publicId',
        {
            schema: {
                params: publicIdParamJson,
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
            const parsed = publicIdParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }
            const service = new UserService(request.server.prisma);
            const { publicId } = parsed.data;
            const result = await service.getUserStats(publicId);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/perform-history/:publicId',
        {
            preHandler: [fastify.optionalAuth],
            schema: {
                params: publicIdParamJson,
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
            const parsed = publicIdParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }
            const { publicId } = parsed.data;
            const service = new UserService(request.server.prisma);
            const result = await service.getUserPerformHistory(
                publicId,
                request.userId,
                offset,
                limit
            );

            return reply.send({ data: result });
        }
    );

    fastify.delete(
        '/users/perform-history',
        {
            preHandler: [fastify.requireAuth],
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
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const result = await service.deleteUserAttendanceRecords(userId, entityIds);

            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/favorite-clubs/:publicId',
        {
            preHandler: [fastify.optionalAuth],
            schema: {
                tags: ['User'],
                params: publicIdParamJson,
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
            const parsed = publicIdParamSchema.safeParse(request.params);
            if (!parsed.success) {
                throw new BadRequestError(`허용되지 않은 파라미터입니다. ${parsed.error.message}`);
            }
            const { publicId } = parsed.data;
            const service = new UserService(request.server.prisma);
            const result = await service.getUserFavoriteClubs(
                publicId,
                request.userId,
                offset,
                limit
            );

            return reply.send({ data: result });
        }
    );

    fastify.delete(
        '/users/favorite-clubs',
        {
            preHandler: [fastify.requireAuth],
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
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const result = await service.deleteUserFavoriteClubs(userId, entityIds);

            return reply.send({ data: result });
        }
    );

    fastify.patch(
        '/users/info',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                tags: ['User'],
                summary: '유저 프로필 수정',
                description: '유저 프로필 수정',
                body: userProfileEditJson,
            },
        },
        async (request, reply) => {
            const service = new UserService(request.server.prisma);
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const profileData = request.body as UserProfileEditType;
            const result = await service.updateUserProfile(userId, profileData);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/settings/privacy',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                tags: ['User'],
                summary: '유저 정보 공개범위 조회',
                description: '유저 정보 공개범위 조회',
            },
        },
        async (request, reply) => {
            const service = new UserService(request.server.prisma);
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const result = await service.getUserPrivacySettings(userId);
            return reply.send({ data: result });
        }
    );

    fastify.patch(
        '/users/settings/privacy',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                tags: ['User'],
                summary: '유저 정보 공개범위 수정',
                description: '유저 정보 공개범위 수정',
                body: userPrivacySettingJson,
            },
        },
        async (request, reply) => {
            const service = new UserService(request.server.prisma);
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const privacyData = request.body as UserPrivacySettingType;
            const result = await service.updateUserPrivacySettings(userId, privacyData);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/users/me/club-reviews',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                querystring: commonSortJson,
                tags: ['User'],
                summary: '내가 작성한 모든 클럽의 리뷰 목록 조회',
                description: '내가 작성한 모든 클럽의 리뷰 목록 조회',
                response: {
                    200: reviewListResponseByUserResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as CommonSortType;

            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }

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
            preHandler: [fastify.requireAuth],
            schema: {
                querystring: getPerformanceReviewsByUserJson,
                tags: ['User'],
                summary: '유저 모든 공연 한줄평 조회',
                description: '유저 모든 한줄평 목록 조회',
                response: {
                    200: performanceReviewListForUserResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetPerformanceReviewsByUserType;
            const service = new PerformanceReviewService(request.server.prisma);
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const result = await service.getReviewsByUserId(userId, query);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.get(
        '/users/me/liked-review',
        {
            preHandler: [fastify.requireAuth],
            schema: {
                querystring: getPerformanceReviewsByUserJson,
                tags: ['User'],
                summary: '유저 좋아요한 공연 한줄평 목록 조회',
                description: '유저 좋아요한 공연 한줄평 목록 조회',
                response: {
                    200: performanceReviewListForUserResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const query = request.query as GetPerformanceReviewsByUserType;
            const service = new PerformanceReviewService(request.server.prisma);
            const userId = request.userId;
            if (!userId) {
                throw new NotFoundError('사용자를 찾을 수 없습니다.');
            }
            const result = await service.getLikedReviewsByUserId(userId, query);
            console.log(result);
            return reply.send({
                data: result,
            });
        }
    );
}
