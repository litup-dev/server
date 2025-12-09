import { errorResJson, reviewCategoryJson } from '@/schemas/common.schema.js';
import { CommonService } from '@/services/common.service';
import { FastifyInstance } from 'fastify';

export async function commonRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/review-category',
        {
            schema: {
                tags: ['Common'],
                summary: '클럽 리뷰 카테고리',
                description: '클럽 리뷰 카테고리',
                response: {
                    200: reviewCategoryJson,
                    400: errorResJson,
                    500: errorResJson,
                },
            },
        },
        async (request, reply) => {
            const service = new CommonService(request.server.prisma);
            const result = await service.getReviewCategory();

            return reply.send({
                data: result,
            });
        }
    );
}
