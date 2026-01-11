import { ConflictError, ForbiddenError, NotFoundError } from '@/common/error.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import {
    GetPerformanceReviewsByUserType,
    PerformanceReviewLikeResponseType,
    PerformanceReviewListResponseType,
    PerformanceReviewType,
} from '@/schemas/performanceReview.schema.js';
import { PrismaClient } from '@prisma/client';

export class PerformanceReviewService {
    constructor(private prisma: PrismaClient) {}

    async getReviewsByPerformanceId(
        userId: number | null,
        performId: number,
        offset = 0,
        limit = 20
    ): Promise<PerformanceReviewListResponseType> {
        console.log('userId:', userId);
        console.log('performId:', performId);
        const [reviews, total] = await Promise.all([
            this.prisma.perform_review_tb.findMany({
                where: { perform_id: performId },
                include: {
                    user_tb: {
                        select: {
                            id: true,
                            nickname: true,
                            profile_path: true,
                        },
                    },
                    perform_review_like_tb: userId
                        ? {
                              where: { user_id: userId },
                          }
                        : false,
                },
                orderBy: { created_at: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.perform_review_tb.count({ where: { perform_id: performId } }),
        ]);

        if (reviews.length === 0) {
            return { items: [], total: total, offset, limit };
        }
        console.log(reviews);

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
                isLiked:
                    r.perform_review_like_tb && r.perform_review_like_tb.length > 0 ? true : false,
            })),
            total,
            offset,
            limit,
        };
    }

    async getReviewsByUserId(
        userId: number,
        query: GetPerformanceReviewsByUserType
    ): Promise<PerformanceReviewListResponseType> {
        const orderBy = this.buildOrderByForObject(query.sort);
        const offset = query.offset ?? 0;
        const limit = query.limit ?? 10;

        const [reviews, total] = await Promise.all([
            this.prisma.perform_review_tb.findMany({
                where: { user_id: userId },
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
                orderBy,
                skip: offset,
                take: limit,
            }),
            this.prisma.perform_review_tb.count({ where: { user_id: userId } }),
        ]);

        if (reviews.length === 0) {
            return { items: [], total: total, offset, limit };
        }

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

    async getLikedReviewsByUserId(
        userId: number,
        query: GetPerformanceReviewsByUserType
    ): Promise<PerformanceReviewListResponseType> {
        const orderBy = this.buildOrderByForObject(query.sort);
        const offset = query.offset ?? 0;
        const limit = query.limit ?? 10;

        const [likes, total] = await Promise.all([
            this.prisma.perform_review_like_tb.findMany({
                where: { user_id: userId },
                include: {
                    perform_review_tb: {
                        include: {
                            user_tb: {
                                select: {
                                    id: true,
                                    nickname: true,
                                    profile_path: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { created_at: orderBy.created_at ?? 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.perform_review_like_tb.count({ where: { user_id: userId } }),
        ]);

        if (likes.length === 0) {
            return { items: [], total: total, offset, limit };
        }

        return {
            items: likes.map((like) => {
                const r = like.perform_review_tb;
                return {
                    id: r.id,
                    content: r.content,
                    likeCount: r.like_count,
                    createdAt:
                        r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
                    updatedAt:
                        r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
                    user: {
                        id: r.user_tb.id,
                        nickname: r.user_tb.nickname,
                        profile_path: r.user_tb.profile_path ?? null,
                    },
                };
            }),
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
        console.log(existingReview);

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
        const review = await this.prisma.perform_review_tb.findUnique({
            where: { id: reviewId },
            select: { id: true },
        });
        if (!review) {
            throw new NotFoundError('리뷰가 존재하지 않습니다.');
        }

        const existing = await this.prisma.perform_review_like_tb.findUnique({
            where: {
                review_id_user_id: { review_id: reviewId, user_id: userId },
            },
        });

        if (existing) {
            await this.prisma.$transaction([
                this.prisma.perform_review_like_tb.delete({
                    where: { id: existing.id },
                }),
                this.prisma.perform_review_tb.update({
                    where: { id: reviewId },
                    data: { like_count: { decrement: 1 } },
                }),
            ]);
        } else {
            await this.prisma.$transaction([
                this.prisma.perform_review_like_tb.create({
                    data: { review_id: reviewId, user_id: userId },
                }),
                this.prisma.perform_review_tb.update({
                    where: { id: reviewId },
                    data: { like_count: { increment: 1 } },
                }),
            ]);
        }

        const updated = await this.prisma.perform_review_tb.findUnique({
            where: { id: reviewId },
            select: { like_count: true },
        });

        return { reviewId, totalLikeCount: Number(updated?.like_count ?? 0) };
    }

    private buildOrderByForObject(sortBy?: string): { [key: string]: 'asc' | 'desc' } {
        const defaultOrder = { created_at: 'desc' as const };

        if (!sortBy) return defaultOrder;
        const [direction, field] = [sortBy[0], sortBy.slice(1)];
        const order = direction === '-' ? 'desc' : 'asc';

        switch (field) {
            case 'createdAt':
                return { created_at: order };
            default:
                return defaultOrder;
        }
    }
}
