import 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
    interface FastifyInstance {
        requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
        optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
