import { FastifyInstance } from 'fastify';
import { clubRoutes } from './club.js';
import { API_PREFIX } from '../common/constants.js';

export async function registerRoutes(fastify: FastifyInstance) {
  await fastify.register(clubRoutes, { prefix: API_PREFIX });
  fastify.log.info('✅ Routes registered');
}