import { FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../error';

export function requireUser(request: FastifyRequest): asserts request is FastifyRequest & {
    user: { userId: number };
} {
    if (!request.user) {
        throw new UnauthorizedError();
    }
}
