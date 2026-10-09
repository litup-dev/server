import fastifyMultipart from '@fastify/multipart';
import { MAX_UPLOAD_INPUT_SIZE } from '@/common/constants.js';
import { FastifyInstance } from 'fastify';

export async function registerMultipart(fastify: FastifyInstance) {
    await fastify.register(fastifyMultipart, {
        limits: {
            fileSize: MAX_UPLOAD_INPUT_SIZE, // 5MB 초과 이미지는 FileManager 에서 축소
            files: 5,
        },
        attachFieldsToBody: false,
    });
}
