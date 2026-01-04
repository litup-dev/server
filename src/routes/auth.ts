import { access } from 'fs';
import { API_PREFIX, HOST, PORT } from '@/common/constants';
import { createUserJson, loginJson } from '@/schemas/auth.schema.js';
import { errorResJson, successResJson } from '@/schemas/common.schema.js';
import { userDefaultJson } from '@/schemas/user.schema.js';
import { AuthService } from '@/services/auth.service.js';
import { parseJwt } from '@/utils/jwt.js';
import { FastifyInstance } from 'fastify';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/auth/:provider/callback',
        {
            schema: {
                tags: ['Auth'],
                summary: '소셜 회원가입 & 로그인',
                description: '소셜 회원가입 & 로그인',
                response: {
                    200: loginJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            try {
                request.log.info('OAuth callback 처리 시작');

                const provider = (request.params as any).provider.toLowerCase();
                const service = new AuthService(fastify.prisma);
                let result = null;

                if (provider === 'kakao') {
                    result = await service.registerForKakao(fastify, request);
                } else if (provider === 'google') {
                    result = await service.registerForGoogle(fastify, request);
                }

                // jwt 토큰 발급 로직 넣어야함.
                reply.send({
                    data: {
                        ...result,
                        accessToken: 'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ923123',
                    },
                });
            } catch (err: any) {
                fastify.log.error('Kakao OAuth callback error:', err);
                reply.status(500).send({ error: String(err) });
            }
        }
    );

    // fastify.post(
    //     '/auth/verify',
    //     {
    //         schema: {
    //             body: createUserJson,
    //             tags: ['Auth'],
    //             summary: '회원가입 & 로그인',
    //             description: '회원가입 & 로그인',
    //             response: {
    //                 201: userDefaultJson,
    //                 400: errorResJson,
    //                 500: errorResJson,
    //             },
    //         },
    //     },
    //     async (request, reply) => {
    //         const service = new AuthService(request.server.prisma);
    //         const { provider, providerId, email } = request.body as {
    //             provider: string;
    //             providerId: string;
    //             email: string;
    //         };
    //         const user = await service.verifyUser({ provider, providerId, email });
    //         return reply.send({ data: user });
    //     }
    // );

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
            const { userId } = parseJwt(request.headers);
            const result = await service.withdrawUser(userId);
            return reply.send({
                data: result,
            });
        }
    );

    // fastify.post(
    //     '/auth/dummy/verify',
    //     {
    //         schema: {
    //             tags: ['Auth'],
    //             summary: '회원가입 & 로그인',
    //             description: '회원가입 & 로그인',
    //         },
    //     },
    //     async (request, reply) => {
    //         return reply.code(201).send({
    //             data: {
    //                 userId: 175,
    //                 username: 'newuser',
    //             },
    //         });
    //     }
    // );
    // fastify.delete(
    //     '/auth/dummy/verify',
    //     {
    //         schema: {
    //             tags: ['Auth'],
    //             summary: '회원탈퇴',
    //             description: '회원탈퇴',
    //         },
    //     },
    //     async (request, reply) => {
    //         return reply.code(204).send();
    //     }
    // );
}
