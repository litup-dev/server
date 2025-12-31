import { requireUser } from '@/common/auth/requireUser';
import { requireAuth } from '@/hooks/auth.hook';
import { createUserJson } from '@/schemas/auth.schema.js';
import { errorResJson, successResJson } from '@/schemas/common.schema.js';
import { userSimpleJson } from '@/schemas/user.schema';
import { AuthService } from '@/services/auth.service.js';
import { parseJwt } from '@/utils/jwt.js';
import { FastifyInstance } from 'fastify';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post(
        '/auth/verify',
        {
            schema: {
                body: createUserJson,
                tags: ['Auth'],
                summary: '회원가입 & 로그인',
                description: '회원가입 & 로그인',
                response: {
                    201: userSimpleJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const service = new AuthService(request.server.prisma);
            const { provider, providerId, email } = request.body as {
                provider: string;
                providerId: string;
                email: string;
            };
            const user = await service.verifyUser({ provider, providerId, email });
            reply.send({ data: user });
        }
    );

    fastify.delete(
        '/auth/withdraw',
        {
            preHandler: [requireAuth],
            schema: {
                tags: ['Auth'],
                summary: '회원탈퇴',
                description: '회원탈퇴',
                response: {
                    200: successResJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            requireUser(request);
            const service = new AuthService(request.server.prisma);
            const userId = request.user.userId;
            const result = await service.withdrawUser(userId);
            reply.send({
                data: result,
            });
        }
    );
}
