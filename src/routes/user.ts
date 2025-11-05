import {
    bodyIdsJson,
    defaultPaginationJson,
    DefaultPaginationType,
    errorResJson,
    successResJson,
} from '@/schemas/common.schema.js';
import { performanceRecordsResJson } from '@/schemas/performance.schema.js';
import {
    userInfoResJson,
    userPrivacySettingJson,
    UserPrivacySettingType,
    userProfileEditJson,
    UserProfileEditType,
    userStatsResJson,
    userPrivacyResJson,
} from '@/schemas/user.schema.js';
import { UserService } from '@/services/user.service.js';
import { FastifyInstance } from 'fastify';

export async function userRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/user/me',
        {
            schema: {
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
            const service = new UserService(request.server.prisma);
            const userId = 1; // 임시 추출
            const result = await service.getUserById(userId);

            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/user/me/stats',
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
            const service = new UserService(request.server.prisma);
            const userId = 1; // 임시 추출
            const result = await service.getUserStats(userId);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/user/me/attendance-records',
        {
            schema: {
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
            const service = new UserService(request.server.prisma);
            const userId = 1; // 임시 추출
            const result = await service.getUserAttendanceRecords(userId, offset, limit);

            return reply.send({ data: result });
        }
    );

    fastify.delete(
        '/user/me/attendance-records',
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
            const userId = 1; // 임시 추출
            const result = await service.deleteUserAttendanceRecords(userId, entityIds);

            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/user/me/favorite-clubs',
        {
            schema: {
                tags: ['User'],
                querystring: defaultPaginationJson,
                summary: '유저 관심 클럽 조회',
                description: '유저 관심 클럽 조회',
                response: {
                    // 200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const { offset, limit } = request.query as DefaultPaginationType;
            const service = new UserService(request.server.prisma);
            const userId = 1; // 임시 추출
            const result = await service.getUserFavoriteClubs(userId, offset, limit);

            return reply.send({ data: result });
        }
    );

    fastify.patch(
        '/user/me/info',
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
            const userId = 1;
            const profileData = request.body as UserProfileEditType;
            const result = await service.updateUserProfile(userId, profileData);
            return reply.send({ data: result });
        }
    );

    fastify.patch(
        '/user/me/settings/privacy',
        {
            schema: {
                tags: ['User'],
                summary: '유저 개인정보 보호 설정 수정',
                description: '유저 개인정보 보호 설정 수정',
                body: userPrivacySettingJson,
            },
        },
        async (request, reply) => {
            const service = new UserService(request.server.prisma);
            const userId = 1;
            const privacySettings = request.body as UserPrivacySettingType;
            const result = await service.updateUserPrivacySettings(userId, privacySettings);
            return reply.send({ data: result });
        }
    );

    fastify.get(
        '/user/me/settings/privacy',
        {
            schema: {
                tags: ['User'],
                summary: '유저 개인정보 보호 설정 조회',
                description: '유저 개인정보 보호 설정 조회',
                response: {
                    200: userPrivacyResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const service = new UserService(request.server.prisma);
            const userId = 1;
            const result = await service.getUserPrivacySettings(userId);
            return reply.send({ data: result });
        }
    );
}
