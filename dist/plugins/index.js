import { registerSwagger } from './swagger.js';
import { registerPrisma } from './prisma.js';
export async function registerPlugins(fastify) {
    await registerPrisma(fastify);
    await registerSwagger(fastify);
}
//# sourceMappingURL=index.js.map