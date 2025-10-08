import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
async function prismaPlugin(fastify) {
    const prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
    });
    await prisma.$connect();
    fastify.decorate('prisma', prisma);
    fastify.log.info('Prisma connected');
}
export const registerPrisma = fp(prismaPlugin);
//# sourceMappingURL=prisma.js.map