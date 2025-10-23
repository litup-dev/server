import fastifyMultipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';

export async function registerMultipart(fastify: FastifyInstance) {
    await fastify.register(fastifyMultipart, {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
            files: 5,
        },
        attachFieldsToBody: false,
    });
}
