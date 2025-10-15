import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

const allowedOrigins = ['http://220.93.50.45:11000', 'http://localhost:11000'];

export async function registerCors(fastify: FastifyInstance) {
    await fastify.register(fastifyCors, {
        origin: (origin, cb) => {
            return cb(null, true);
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        credentials: true,
        preflight: true,
        maxAge: 86400,
    });
}
