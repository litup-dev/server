import { ConflictError, ForbiddenError, NotFoundError } from '@/common/error.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import {
    PerformanceReviewLikeResponseType,
    PerformanceReviewListResponseType,
    PerformanceReviewType,
} from '@/schemas/performanceReview.schema.js';
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
                    updated_at: true,
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
                updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
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
            updatedAt:
                review.updated_at instanceof Date
                    ? review.updated_at.toISOString()
                    : review.updated_at,
            user: {
                id: review.user_tb.id,
                nickname: review.user_tb.nickname,
                profile_path: review.user_tb.profile_path ?? null,
            },
        };
    }

    async patchReview(
        reviewId: number,
        userId: number,
        content: string
    ): Promise<PerformanceReviewType> {
        const existingReview = await this.prisma.perform_review_tb.findUnique({
            where: {
                id: reviewId,
            },
        });

        if (!existingReview) {
            throw new NotFoundError('리뷰가 존재하지 않습니다.');
        }
        if (existingReview.user_id !== userId) {
            throw new ForbiddenError('권한이 없습니다.');
        }
        const review = await this.prisma.perform_review_tb.update({
            where: {
                id: reviewId,
            },
            data: {
                updated_at: new Date(),
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
            updatedAt:
                review.updated_at instanceof Date
                    ? review.updated_at.toISOString()
                    : review.updated_at,
            user: {
                id: review.user_tb.id,
                nickname: review.user_tb.nickname,
                profile_path: review.user_tb.profile_path ?? null,
            },
        };
    }

    async deleteReview(reviewId: number, userId: number): Promise<OperationSuccessType> {
        const existingReview = await this.prisma.perform_review_tb.findUnique({
            where: {
                id: reviewId,
            },
        });

        if (!existingReview) {
            throw new NotFoundError('리뷰가 존재하지 않습니다.');
        }
        if (existingReview.user_id !== userId) {
            throw new ForbiddenError('권한이 없습니다.');
        }
        await this.prisma.perform_review_tb.delete({
            where: {
                id: reviewId,
            },
        });

        return {
            success: true,
            operation: 'deleted',
            message: '리뷰가 삭제되었습니다.',
        };
    }

    async likePerformanceReview(
        userId: number,
        reviewId: number
    ): Promise<PerformanceReviewLikeResponseType> {
        // race condition
        const sql = Prisma.sql`
            WITH ins AS (
                INSERT INTO perform_review_like_tb (review_id, user_id, created_at)
                VALUES (${reviewId}, ${userId}, now())
                ON CONFLICT (review_id, user_id) DO NOTHING
                RETURNING 1 AS added
            ), del AS (
                DELETE FROM perform_review_like_tb
                WHERE review_id = ${reviewId} AND user_id = ${userId}
                AND NOT EXISTS (SELECT 1 FROM ins)
                RETURNING 1 AS removed
            ), delta AS (
                SELECT COALESCE((SELECT added FROM ins), 0) - COALESCE((SELECT removed FROM del), 0) AS d
            )
            UPDATE perform_review_tb
            SET like_count = GREATEST(0, like_count + (SELECT d FROM delta))
            WHERE id = ${reviewId}
            RETURNING (SELECT d FROM delta) AS delta, like_count;
        `;
        const res = await this.prisma.$queryRaw<{ delta: number; like_count: number }[]>(sql);

        const row = res[0];
        if (!row) {
            throw new Error('리뷰가 존재하지 않거나 토글에 실패했습니다.');
        }

        const likeCount = Number(row.like_count ?? 0);

        return {
            reviewId: reviewId,
            likeCount: likeCount,
        };
    }
}
