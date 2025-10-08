import { FastifyInstance } from 'fastify';
import { registerSwagger } from './swagger.js';
import { registerPrisma } from './prisma.js';

export async function registerPlugins(fastify: FastifyInstance) {
    await registerPrisma(fastify);
    await registerSwagger(fastify);
}
