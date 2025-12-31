import { UnauthorizedError } from '@/common/error';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
        throw new UnauthorizedError();
    }
}
