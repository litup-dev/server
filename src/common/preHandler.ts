import { UserService } from '@/services/user.service';
import { parseJwtOptional } from '@/utils/jwt';
import { FastifyInstance } from 'fastify';

export function setupOptionalAuthHandler(fastify: FastifyInstance) {
    fastify.decorateRequest('user', null);

    fastify.addHook('preHandler', async (request) => {
        const publicId = parseJwtOptional(request.headers);
        if (!publicId) {
            request.user = null;
            return;
        }

        const userService = new UserService(request.server.prisma);
        const userId = await userService.getUserIdByPublicId(publicId);

        request.user = userId ? { userId } : null;
    });
}
