import { FastifyInstance } from 'fastify';
import { registerSwagger } from './swagger.js';
import { registerPrisma } from './prisma.js';
import { registerCors } from './cors.js';
import { registerSchedule } from './schedule.js';
import { registerMultipart } from './multipart.js';
import { registerOauth } from './oauth.js';
import { registerJwt } from './jwt.js';

export async function registerPlugins(fastify: FastifyInstance) {
    await registerPrisma(fastify);
    await registerSwagger(fastify);
    await registerCors(fastify);
    await registerSchedule(fastify);
    await registerMultipart(fastify);
    await registerJwt(fastify);
    await registerOauth(fastify);
}
