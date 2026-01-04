import { COOKIE_SECRET } from '@/common/constants';
import fastifyCookie from '@fastify/cookie';
import { FastifyInstance } from 'fastify';

export async function registerCookie(fastify: FastifyInstance) {
    fastify.register(fastifyCookie, {
        secret: COOKIE_SECRET,
    });
}
