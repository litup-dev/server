import { ReviewService } from '../services/review.service.js';
import { createReviewSchema, updateReviewSchema, getReviewSchema, getReviewsSchema } from '../schemas/review.schema.js';
export async function reviewRoutes(fastify) {
    fastify.get('/clubs/:id/reviews', { schema: getReviewsSchema }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { page = 1, limit = 10 } = request.query;
            const service = new ReviewService(request.server.prisma);
            const result = await service.getReviewsByClubId(parseInt(id), page, limit);
            request.log.info(`Found ${result.reviews.length} reviews for club ${id}`);
            return result;
        }
        catch (error) {
            request.log.error(error);
            reply.code(500);
            return { error: 'Failed to fetch reviews' };
        }
    });
    fastify.get('/reviews/:id', { schema: getReviewSchema }, async (request, reply) => {
        try {
            const { id } = request.params;
            const service = new ReviewService(request.server.prisma);
            const review = await service.getById(parseInt(id));
            if (!review) {
                reply.code(404);
                return { error: 'Review not found' };
            }
            request.log.info(`Found review with ID ${id}`);
            return review;
        }
        catch (error) {
            request.log.error(error);
            reply.code(500);
            return { error: 'Failed to fetch review' };
        }
    });
    fastify.post('/clubs/:id/reviews', { schema: createReviewSchema }, async (request, reply) => {
        try {
            const { id } = request.params;
            const clubId = parseInt(id);
            const userId = 1;
            const service = new ReviewService(request.server.prisma);
            const club = await request.server.prisma.club.findUnique({
                where: { id: clubId }
            });
            if (!club) {
                reply.code(404);
                return { error: 'Club not found' };
            }
            const review = await service.create(clubId, userId, request.body);
            request.log.info(`Created review with ID ${review.id} for club ${clubId}`);
            reply.code(201);
            return review;
        }
        catch (error) {
            request.log.error(error);
            reply.code(500);
            return { error: 'Failed to create review' };
        }
    });
    fastify.patch('/reviews/:id', { schema: updateReviewSchema }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = 1;
            const service = new ReviewService(request.server.prisma);
            const updated = await service.update(parseInt(id), userId, request.body);
            request.log.info(`Updated review with ID ${id}`);
            return updated;
        }
        catch (error) {
            request.log.error(error);
            if (error.message === 'Review not found') {
                reply.code(404);
                return { error: 'Review not found' };
            }
            if (error.message === 'Unauthorized') {
                reply.code(403);
                return { error: 'You can only edit your own reviews' };
            }
            reply.code(500);
            return { error: 'Failed to update review' };
        }
    });
    fastify.delete('/reviews/:id', { schema: getReviewSchema }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userId = 1;
            const service = new ReviewService(request.server.prisma);
            await service.delete(parseInt(id), userId);
            request.log.info(`Deleted review with ID ${id}`);
            reply.code(204);
            return;
        }
        catch (error) {
            request.log.error(error);
            if (error.message === 'Review not found') {
                reply.code(404);
                return { error: 'Review not found' };
            }
            if (error.message === 'Unauthorized') {
                reply.code(403);
                return { error: 'You can only delete your own reviews' };
            }
            reply.code(500);
            return { error: 'Failed to delete review' };
        }
    });
}
//# sourceMappingURL=review.js.map