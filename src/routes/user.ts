import { errorResponseJson } from '@/schemas/common.schema';
import { userInfoJson, userInfoRes } from '@/schemas/user.schema';
import { UserService } from '@/services/user.service';
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
                    200: userInfoJson,
                    400: errorResponseJson,
                    500: errorResponseJson,
                },
            },
        },
        async (request, reply) => {
            const service = new UserService(request.server.prisma);
            const userId = 1; // 임시 추출
            const result = await service.getUserById(userId);

            return result;
        }
    );
    // 유저 정보 수정
    // 참석여부, 개시글 수(1차때는 없음), 댓글 수(1차때는 없음)
    // 관람기록 (참석여부체크한 공연 중 오늘 시간 이전의 공연 나열)
    // get, delete(다건 가능)
    // 관심 있는 공연
    // get
}
