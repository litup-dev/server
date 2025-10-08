import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}
declare function prismaPlugin(fastify: FastifyInstance): Promise<void>;
export declare const registerPrisma: typeof prismaPlugin;
export {};
//# sourceMappingURL=prisma.d.ts.map