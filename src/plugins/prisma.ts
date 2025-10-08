import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}

async function prismaPlugin(fastify: FastifyInstance) {
    const prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
    });

    await prisma.$connect();

    fastify.decorate('prisma', prisma);

    fastify.log.info('Prisma connected');
}

export const registerPrisma = fp(prismaPlugin);
