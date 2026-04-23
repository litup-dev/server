import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

const allowedOrigins = [
    'http://100.116.32.24:11000',
    'http://localhost:11000',
    'http://127.0.0.1:11000',
    'https://litup.kr',
    'https://www.litup.kr',
];

export async function registerCors(fastify: FastifyInstance) {
    await fastify.register(fastifyCors, {
        origin: (origin, cb) => {
            return cb(null, true);
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-internal-secret'],
        credentials: true,
        preflight: true,
        maxAge: 86400,
    });
}
