import { INTERNAL_SECRET_KEY } from '@/common/constants';
import { FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

const INTERNAL_SECRET = INTERNAL_SECRET_KEY;

if (!INTERNAL_SECRET) {
    throw new Error('INTERNAL_SECRET 환경변수가 설정되지 않았습니다.');
}

export const registerInternal = fastifyPlugin(async (fastify) => {
    fastify.decorate('requireInternal', async (request: FastifyRequest, reply: FastifyReply) => {
        const secret = request.headers['x-internal-secret'];
        if (secret !== INTERNAL_SECRET) {
            return reply.code(403).send({ error: 'Forbidden' });
        }
    });
});
