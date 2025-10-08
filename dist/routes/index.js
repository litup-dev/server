import { clubRoutes } from './club.js';
import { API_PREFIX } from '../common/constants.js';
export async function registerRoutes(fastify) {
    await fastify.register(clubRoutes, { prefix: API_PREFIX });
    fastify.log.info('✅ Routes registered');
}
//# sourceMappingURL=index.js.map