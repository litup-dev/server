import { createUserJson } from '@/schemas/auth.schema.js';
import {
    errorResponseJsonSchema,
    idParamJson,
    successResponseJson,
} from '@/schemas/common.schema.js';
import { userJson } from '@/schemas/user.schema.js';
import { AuthService } from '@/services/auth.service.js';
import { FastifyInstance } from 'fastify';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post(
        '/auth/register',
        {
            schema: {
                body: createUserJson,
                tags: ['Auth'],
                summary: '회원가입',
                description: '회원가입',
                response: {
                    201: userJson,
                    400: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
                },
            },
        },
        async (request, reply) => {
            const service = new AuthService(request.server.prisma);
            const { provider, providerId } = request.body as {
                provider: string;
                providerId: string;
            };
            const user = await service.registerUser({ provider, providerId });
            return { data: user };
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
                    200: successResponseJson,
                    400: errorResponseJsonSchema,
                    500: errorResponseJsonSchema,
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
        '/auth/dummy/register',
        {
            schema: {
                tags: ['Auth'],
                summary: '회원가입',
                description: '회원가입',
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
        '/auth/dummy/withdraw',
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
