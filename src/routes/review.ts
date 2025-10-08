import { FastifyInstance } from 'fastify';
import { ReviewService } from '../services/review.service.js';
import { createReviewSchema, updateReviewSchema, getReviewSchema, getReviewsSchema } from '../schemas/review.schema.js';
import type { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto.js';

export async function reviewRoutes(fastify: FastifyInstance) {

  fastify.get('/clubs/:id/reviews', { 
      schema: {
        ...getReviewsSchema,
        tags: ['Reviews'],
        summary: '클럽의 리뷰 목록 조회',
        description: '클럽의 리뷰 목록 조회',
      },
    }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { offset = 0, limit = 10 } = request.query as { offset?: number; limit?: number };
      
      const service = new ReviewService(request.server.prisma);
      const result = await service.getReviewsByClubId(parseInt(id), offset, limit);

      request.log.info(`Found ${result.reviews.length} reviews for club ${id}`);
      return result;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to fetch reviews' };
    }
  });

  fastify.get('/reviews/:id', { 
      schema: {
        ...getReviewSchema,
        tags: ['Reviews'],
        summary: '리뷰 상세 조회',
        description: '리뷰 상세 조회',
      },
    }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const service = new ReviewService(request.server.prisma);
      const review = await service.getById(parseInt(id));

      if (!review) {
        reply.code(404);
        return { error: 'Review not found' };
      }

      request.log.info(`Found review with ID ${id}`);
      return review;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to fetch review' };
    }
  });

  fastify.post('/clubs/:id/reviews', { 
      schema: {
        ...createReviewSchema,
        tags: ['Reviews'],
        summary: '리뷰 등록',
        description: '리뷰 상세 조회',
      },
    }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const clubId = parseInt(id);
      
      // TODO: 실제로는 인증된 사용자 ID를 사용
      // const userId = request.user.id;
      const userId = 1; // 임시로 하드코딩
      
      const service = new ReviewService(request.server.prisma);
      
      // 클럽 존재 여부 확인
      const club = await request.server.prisma.club.findUnique({
        where: { id: clubId }
      });

      if (!club) {
        reply.code(404);
        return { error: 'Club not found' };
      }

      const review = await service.create(clubId, userId, request.body as CreateReviewDto);
      
      request.log.info(`Created review with ID ${review.id} for club ${clubId}`);
      return review;
    } catch (error) {
      request.log.error(error);
      reply.code(500);
      return { error: 'Failed to create review' };
    }
  });

  fastify.patch('/reviews/:id',  { 
      schema: {
        ...updateReviewSchema,
        tags: ['Reviews'],
        summary: '리뷰 수정',
        description: '리뷰 수정',
      },
    }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      // TODO: 실제로는 인증된 사용자 ID를 사용
      // const userId = request.user.id;
      const userId = 1; // 임시로 하드코딩
      
      const service = new ReviewService(request.server.prisma);
      const updated = await service.update(parseInt(id), userId, request.body as UpdateReviewDto);
      
      request.log.info(`Updated review with ID ${id}`);
      return updated;
    } catch (error: any) {
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

  // 리뷰 삭제
  fastify.delete('/reviews/:id', { 
      schema: {
        ...getReviewSchema,
        tags: ['Reviews'],
        summary: '리뷰 삭제',
        description: '리뷰 삭제',
      },
    }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      // TODO: 실제로는 인증된 사용자 ID를 사용
      // const userId = request.user.id;
      const userId = 1; // 임시로 하드코딩
      
      const service = new ReviewService(request.server.prisma);
      await service.delete(parseInt(id), userId);
      
      request.log.info(`Deleted review with ID ${id}`);
      return;
    } catch (error: any) {
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
