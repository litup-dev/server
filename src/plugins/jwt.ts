import { JWT_TOKEN_SECRET } from '@/common/constants';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';

export function registerJwt(fastify: FastifyInstance) {
    fastify.register(fastifyJwt, {
        secret: JWT_TOKEN_SECRET,
    });
}
