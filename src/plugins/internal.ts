import { INTERNAL_SECRET_KEY } from '@/common/constants';
import { createHash, timingSafeEqual } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

const INTERNAL_SECRET = INTERNAL_SECRET_KEY;

if (!INTERNAL_SECRET) {
    throw new Error('INTERNAL_SECRET 환경변수가 설정되지 않았습니다.');
}

const sha256 = (value: string) => createHash('sha256').update(value).digest();
const EXPECTED_DIGEST = sha256(INTERNAL_SECRET);

// 해시 후 상수 시간 비교 (길이 차이/타이밍으로 값이 유추되지 않도록)
const isValidSecret = (secret: string | string[] | undefined) =>
    typeof secret === 'string' && timingSafeEqual(sha256(secret), EXPECTED_DIGEST);

export const registerInternal = fastifyPlugin(async (fastify) => {
    fastify.decorate('requireInternal', async (request: FastifyRequest, reply: FastifyReply) => {
        if (!isValidSecret(request.headers['x-internal-secret'])) {
            return reply.code(403).send({ error: 'Forbidden' });
        }
    });
});
