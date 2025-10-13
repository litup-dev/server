import { PerformanceReviewListResponseType } from '@/schemas/perfomance_review.schema';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class PerformanceReviewService {
    constructor(private prisma: PrismaClient) {}

    async getReviewsByPerformanceId(
        performId: number,
        offset = 0,
        limit = 20
    ): Promise<PerformanceReviewListResponseType> {
        const [reviews, total] = await Promise.all([
            this.prisma.perform_review_tb.findMany({
                where: { perform_id: performId },
                select: {
                    id: true,
                    content: true,
                    like_count: true,
                    created_at: true,
                    user_tb: {
                        select: {
                            id: true,
                            nickname: true,
                            profile_path: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.perform_review_tb.count({ where: { perform_id: performId } }),
        ]);

        return {
            items: reviews.map((r) => ({
                id: r.id,
                content: r.content,
                likeCount: r.like_count,
                createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
                user: {
                    id: r.user_tb.id,
                    nickname: r.user_tb.nickname,
                    profile_path: r.user_tb.profile_path ?? null,
                },
            })),
            total,
            offset,
            limit,
        };
    }
}
