import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

const allowedOrigins = [
    'http://100.116.32.24:11000',
    'http://localhost:11000',
    'http://127.0.0.1:11000',
    'http://100.94.94.123',
    'http://100.91.160.64',
    'http://100.125.51.55', 
    'http://100.109.228.88', 
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
