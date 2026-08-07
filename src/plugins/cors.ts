import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

const allowedOrigins = [
    'http://100.116.32.24:10005',
    'https://litup.kr',
    'https://www.litup.kr',
];

export async function registerCors(fastify: FastifyInstance) {
    await fastify.register(fastifyCors, {
        //origin: (origin, cb) => {
        //    return cb(null, true);
        //},
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return cb(null, true);
            }
            return cb(new Error('Not allowed by CORS'), false);
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-internal-secret'],
        credentials: true,
        preflight: true,
        maxAge: 86400,
    });
}
