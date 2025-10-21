import { FastifyInstance } from 'fastify';
import { clubRoutes } from './club.js';
import { reviewRoutes } from './review.js';
import { performanceRoutes } from './performance.js';
import { performanceReviewRoutes } from './performanceReview.js';
import { authRoutes } from './auth.js';
import { userRoutes } from './user.js';
import { API_PREFIX } from '../common/constants.js';

export async function registerRoutes(fastify: FastifyInstance) {
    await fastify.register(clubRoutes, { prefix: API_PREFIX });
    await fastify.register(reviewRoutes, { prefix: API_PREFIX });
    await fastify.register(performanceRoutes, { prefix: API_PREFIX });
    await fastify.register(performanceReviewRoutes, { prefix: API_PREFIX });
    await fastify.register(authRoutes, { prefix: API_PREFIX });
    await fastify.register(userRoutes, { prefix: API_PREFIX });
    fastify.log.info('Routes registered');
}
