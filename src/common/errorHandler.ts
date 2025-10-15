import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function setupErrorHandler(fastify: FastifyInstance) {
    fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
        request.log.error(error);

        if (error.code === 'FST_ERR_VALIDATION') {
            let message = '입력값이 올바르지 않습니다.';

            if (error.message.includes('more than 100 characters')) {
                message = '100자 이하로 입력해주세요.';
            } else if (error.message.includes('must be string')) {
                message = '문자열이어야 합니다.';
            } else if (error.message.includes('must have required property')) {
                const fieldMatch = error.message.match(/must have required property '([^']+)'/);
                const fieldName = fieldMatch ? fieldMatch[1] : '';

                message = `'${fieldName}' 필드는 필수 항목입니다.`;
            } else if (error.message.includes('must NOT be shorter than 1 character')) {
                message = '내용을 입력해주세요.';
            }

            return reply.status(400).send({
                error: {
                    statusCode: 400,
                    message: message,
                    code: 'VALIDATION_ERROR',
                },
            });
        }

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
