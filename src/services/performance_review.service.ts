import { ConflictError } from '@/common/error';
import {
    PerformanceReviewListResponseType,
    PerformanceReviewType,
} from '@/schemas/perfomanceReview.schema';
import { PrismaClient } from '@prisma/client';

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

    async createReview(
        performId: number,
        userId: number,
        content: string
    ): Promise<PerformanceReviewType> {
        const existingReview = await this.prisma.perform_review_tb.findUnique({
            where: {
                perform_id_user_id: {
                    perform_id: performId,
                    user_id: userId,
                },
            },
        });

        if (existingReview) {
            throw new ConflictError('작성한 리뷰가 존재합니다.');
        }

        const review = await this.prisma.perform_review_tb.create({
            data: {
                perform_id: performId,
                user_id: userId,
                content: content,
            },
            include: {
                user_tb: {
                    select: {
                        id: true,
                        nickname: true,
                        profile_path: true,
                    },
                },
            },
        });

        return {
            id: review.id,
            content: review.content,
            likeCount: review.like_count,
            createdAt:
                review.created_at instanceof Date
                    ? review.created_at.toISOString()
                    : review.created_at,
            user: {
                id: review.user_tb.id,
                nickname: review.user_tb.nickname,
                profile_path: review.user_tb.profile_path ?? null,
            },
        };
    }
}
