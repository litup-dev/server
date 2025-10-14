import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function setupErrorHandler(fastify: FastifyInstance) {
    fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        request.log.error(error);

        if (error.statusCode && error.statusCode < 500) {
            return reply.status(error.statusCode).send({
                error: {
                    statusCode: error.statusCode,
                    message: error.message,
                    code: error.code || 'UNKNOWN_ERROR',
                },
            });
        }

        return reply.status(500).send({
            error: {
                statusCode: 500,
                message: '서버 내부 오류가 발생했습니다.',
                code: 'INTERNAL_SERVER_ERROR',
            },
        });
    });
}
