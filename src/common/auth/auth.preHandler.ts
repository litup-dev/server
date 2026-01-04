import fastifyPlugin from 'fastify-plugin';
import { InvalidTokenError } from '../error';
import { FastifyRequest, FastifyReply } from 'fastify';

export const registerAuthPreHandler = fastifyPlugin(async (fastify) => {
    fastify.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
            if (request.user.type !== 'access') {
                throw new InvalidTokenError('토큰 타입이 올바르지 않습니다.');
            }
        } catch {
            throw new InvalidTokenError('인증이 필요합니다.');
        }
    });

    fastify.decorate('optionalAuth', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
        } catch {
            // pass
        }
    });
});
