import { FastifyInstance } from 'fastify';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post(
        '/auth/register',
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
        '/auth/withdraw',
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
