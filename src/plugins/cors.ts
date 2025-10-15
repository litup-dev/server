import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

export async function registerCors(fastify: FastifyInstance) {
    await fastify.register(fastifyCors, {
        origin: '*',
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        preflight: true,
        maxAge: 86400,
    });
}
