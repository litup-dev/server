import { BadRequestError } from '@/common/error';
import {
    bodyIdsJson,
    defaultPaginationJson,
    DefaultPaginationType,
    errorResJson,
    successResJson,
} from '@/schemas/common.schema.js';
import { performanceRecordsResJson } from '@/schemas/performance.schema.js';
import { userInfoResJson, userStatsResJson } from '@/schemas/user.schema.js';
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

            return { data: result };
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
            return { data: result };
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

            return { data: result };
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

            return { data: result };
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

            return { data: result };
        }
    );

    fastify.post(
        '/user/me/avatar',
        {
            schema: {
                tags: ['User'],
                summary: '유저 프로필 이미지 업로드',
                description: '유저 프로필 이미지 업로드',
                consumes: ['multipart/form-data'],
            },
        },
        async (request, reply) => {
            const parts = request.parts();
            for await (const part of parts) {
                if (part.type === 'file') {
                    console.log(part.filename);
                } else {
                    console.log(part);
                }
            }
        }
    );
    // TODO: 유저 정보 수정
}
