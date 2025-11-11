import { createUserJson } from '@/schemas/auth.schema.js';
import { errorResJson, successResJson } from '@/schemas/common.schema.js';
import { userDefaultJson } from '@/schemas/user.schema.js';
import { AuthService } from '@/services/auth.service.js';
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
                    201: userDefaultJson,
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
            return reply.send({ data: user });
        }
    );

    fastify.delete(
        '/auth/withdraw',
        {
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
            const service = new AuthService(request.server.prisma);
            const userId = 6; // 임시 ID
            const result = await service.withdrawUser(userId);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.post(
        '/auth/dummy/verify',
        {
            schema: {
                tags: ['Auth'],
                summary: '회원가입 & 로그인',
                description: '회원가입 & 로그인',
            },
        },
        async (request, reply) => {
            return reply.code(201).send({
                data: {
                    userId: 175,
                    username: 'newuser',
                },
            });
        }
    );
    fastify.delete(
        '/auth/dummy/verify',
        {
            schema: {
                tags: ['Auth'],
                summary: '회원탈퇴',
                description: '회원탈퇴',
            },
        },
        async (request, reply) => {
            return reply.code(204).send();
        }
    );
}
