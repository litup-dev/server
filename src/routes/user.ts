import {
    defaultPaginationJson,
    DefaultPaginationType,
    errorResponseJson,
} from '@/schemas/common.schema';
import { performanceRecordsResJson } from '@/schemas/performance.schema.js';
import { userInfoResJson, userStatsResJson } from '@/schemas/user.schema.js';
import { UserService } from '@/services/user.service.js';
import { FastifyInstance } from 'fastify';

export async function userRoutes(fastify: FastifyInstance) {
    // 유저 정보 조회
    fastify.get(
        '/user/me',
        {
            schema: {
                tags: ['User'],
                summary: '유저 정보 조회',
                description: '유저 정보 조회',
                response: {
                    200: userInfoResJson,
                    400: errorResponseJson,
                    500: errorResponseJson,
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

    // 참석여부, 개시글 수(1차때는 없음), 댓글 수(1차때는 없음)
    fastify.get(
        '/user/me/stats',
        {
            schema: {
                tags: ['User'],
                summary: '유저 통계 조회',
                description: '유저 통계 조회',
                response: {
                    200: userStatsResJson,
                    400: errorResponseJson,
                    500: errorResponseJson,
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

    // 관람기록 (참석여부체크한 공연 중 오늘 시간 이전의 공연 나열)
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
                    400: errorResponseJson,
                    500: errorResponseJson,
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

    // fastify.delete(
    //     '/user/me/attendance-records',
    //     {
    //         schema: {
    //             tags: ['User'],
    //             summary: '유저 관람 기록 삭제',
    //             description: '유저 관람 기록 삭제',
    //             // response: {
    //         },
    //     },
    //     async (request, reply) => {
    //         const { offset, limit } = request.query as DefaultPaginationType;
    //         const service = new UserService(request.server.prisma);
    //         const userId = 1; // 임시 추출
    //         const result = await service.getUserAttendanceRecords(userId, offset, limit);

    //         return { data: result };
    //     }
    // );

    // TODO: 유저 정보 수정
    // 관심 있는 공연
    // get
}
