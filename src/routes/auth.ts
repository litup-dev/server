import { access, fstat } from 'fs';
import { API_PREFIX, HOST, NODE_ENV, PORT } from '@/common/constants';
import { createUserJson, loginJson } from '@/schemas/auth.schema.js';
import { errorResJson, successResJson } from '@/schemas/common.schema.js';
import { userDefaultJson } from '@/schemas/user.schema.js';
import { AuthService } from '@/services/auth.service.js';
import { parseJwt } from '@/utils/jwt.js';
import { FastifyInstance } from 'fastify';
import { TokenService } from '@/services/token.service';
import { randomUUID } from 'crypto';
import path from 'path';
import { InvalidTokenError, NotFoundError } from '@/common/error';

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
                } else {
                    throw new NotFoundError('지원하지 않는 소셜 로그인 제공자입니다.');
                }

                const tokenService = new TokenService(fastify);
                const accessToken = tokenService.generateJwtToken(result!.id);
                const refreshTokenId = randomUUID();
                const refreshToken = tokenService.generateRefreshToken(result!.id, refreshTokenId);
                await tokenService.saveRefreshToken(refreshTokenId, result!.id);

                reply.setCookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: NODE_ENV === 'production' ? true : false,
                    sameSite: 'lax', // CSRF 공격 방지
                    path: '/auth/refresh',
                });

                reply.send({
                    data: {
                        ...result,
                        accessToken: `Bearer ${accessToken}`,
                    },
                });
            } catch (err: any) {
                fastify.log.error('Kakao OAuth callback error:', err);
                reply.status(500).send({ error: String(err) });
            }
        }
    );

    fastify.post(
        '/auth/dev-login',
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
                const body = request.body as any;
                const userId = body.userId;
                const tokenService = new TokenService(fastify);

                const accessToken = tokenService.generateJwtToken(userId);
                const refreshTokenId = randomUUID();
                const refreshToken = tokenService.generateRefreshToken(userId, refreshTokenId);
                await tokenService.saveRefreshToken(refreshTokenId, userId);

                reply.setCookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: NODE_ENV === 'production' ? true : false,
                    sameSite: 'lax', // CSRF 공격 방지
                    path: NODE_ENV === 'production' ? '/auth/refresh' : '/',
                });

                reply.send({
                    data: {
                        id: userId,
                        nickname: 'devuser',
                        profilePath: null,
                        accessToken: `Bearer ${accessToken}`,
                    },
                });
            } catch (err: any) {
                fastify.log.error('Kakao OAuth callback error:', err);
                reply.status(500).send({ error: String(err) });
            }
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
            const { userId } = parseJwt(request.headers);
            const result = await service.withdrawUser(userId);
            return reply.send({
                data: result,
            });
        }
    );

    fastify.post('/auth/refresh', async (request, reply) => {
        const tokenService = new TokenService(fastify);
        const accessToken = await tokenService.getNewAccessToken(request, reply);
        if (!accessToken) {
            throw new InvalidTokenError('토큰이 유효하지 않습니다.');
        }
        reply.send({ data: { accessToken } });
    });
}
