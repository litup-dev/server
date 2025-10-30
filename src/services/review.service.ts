import { PrismaClient } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '@/common/error.js';
import { SavedFileInfo } from '@/types/file.types.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import {
    ReviewType,
    ReviewListResponseType,
    CreateReviewType,
    UpdateReviewType,
} from '@/schemas/review.schema.js';

export class ReviewService {
    constructor(private prisma: PrismaClient) {}

    async getReviewsByClubId(
        clubId: number,
        offset: number = 0,
        limit: number = 10
    ): Promise<ReviewListResponseType> {
        const [reviews, total] = await Promise.all([
            this.prisma.club_review_tb.findMany({
                where: { club_id: clubId },
                include: {
                    user_tb: {
                        select: {
                            id: true,
                            nickname: true,
                            profile_path: true,
                        },
                    },
                    club_review_keyword_tb: {
                        include: {
                            keyword_tb: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    review_img_tb: {
                        select: {
                            id: true,
                            file_path: true,
                            is_main: true,
                        },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.club_review_tb.count({
                where: { club_id: clubId },
            }),
        ]);

        return {
            items: reviews.map((review) => ({
                id: review.id,
                clubId: review.club_id,
                userId: review.user_id,
                rating: review.rating,
                content: review.content,
                createdAt: review.created_at ? review.created_at.toISOString() : null,
                updatedAt: review.updated_at ? review.updated_at.toISOString() : null,
                user: review.user_tb
                    ? {
                          id: review.user_tb.id,
                          nickname: review.user_tb.nickname,
                          profilePath: review.user_tb.profile_path,
                      }
                    : null,
                keywords: review.club_review_keyword_tb.map((krw) => ({
                    id: krw.keyword_tb.id,
                    name: krw.keyword_tb.name,
                })),
                images: review.review_img_tb.map((img) => ({
                    id: img.id,
                    filePath: img.file_path,
                    isMain: img.is_main,
                })),
            })),
            total,
            offset,
            limit,
        };
    }

    async getById(id: number): Promise<ReviewType> {
        const review = await this.prisma.club_review_tb.findUnique({
            where: { id },
            include: {
                user_tb: {
                    select: {
                        id: true,
                        nickname: true,
                        profile_path: true,
                    },
                },
                club_review_keyword_tb: {
                    include: {
                        keyword_tb: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
                review_img_tb: {
                    select: {
                        id: true,
                        file_path: true,
                        is_main: true,
                    },
                },
            },
        });

        if (!review) {
            throw new NotFoundError('리뷰를 찾을 수 없습니다.');
        }

        return {
            id: review.id,
            clubId: review.club_id,
            userId: review.user_id,
            rating: review.rating,
            content: review.content,
            createdAt: review.created_at ? review.created_at.toISOString() : null,
            updatedAt: review.updated_at ? review.updated_at.toISOString() : null,
            user: review.user_tb
                ? {
                      id: review.user_tb.id,
                      nickname: review.user_tb.nickname,
                      profilePath: review.user_tb.profile_path,
                  }
                : null,
            keywords: review.club_review_keyword_tb.map((krw) => ({
                id: krw.keyword_tb.id,
                name: krw.keyword_tb.name,
            })),
            images: review.review_img_tb.map((img) => ({
                id: img.id,
                filePath: img.file_path,
                isMain: img.is_main,
            })),
        };
    }

    async create(clubId: number, userId: number, data: CreateReviewType): Promise<ReviewType> {
        const result = await this.prisma.$transaction(async (tx) => {
            const review = await tx.club_review_tb.create({
                data: {
                    club_id: clubId,
                    user_id: userId,
                    rating: data.rating,
                    content: data.content ?? null,
                },
            });

            if (data.keywords && data.keywords.length > 0) {
                await tx.club_review_keyword_tb.createMany({
                    data: data.keywords.map((keywordId) => ({
                        review_id: review.id,
                        keyword_id: keywordId,
                    })),
                });
            }

            const stats = await tx.club_review_tb.aggregate({
                where: { club_id: clubId },
                _avg: { rating: true },
                _count: true,
            });

            await tx.club.update({
                where: { id: clubId },
                data: {
                    avgRating: stats._avg.rating || 0,
                    reviewCnt: stats._count,
                },
            });

            return review;
        });

        return {
            id: result.id,
            clubId: result.club_id,
            userId: result.user_id,
            rating: result.rating,
            content: result.content,
            createdAt: result.created_at ? result.created_at.toISOString() : null,
            updatedAt: result.updated_at ? result.updated_at.toISOString() : null,
        };
    }

    async update(id: number, userId: number, data: UpdateReviewType): Promise<ReviewType> {
        const review = await this.prisma.club_review_tb.findUnique({
            where: { id },
            select: { user_id: true, club_id: true },
        });

        if (!review) {
            throw new NotFoundError('리뷰를 찾을 수 없습니다.');
        }

        if (review.user_id !== userId) {
            throw new ForbiddenError('권한이 없습니다.');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            // undefined 값 제거하여 업데이트 데이터 구성
            const updateData: any = {
                updated_at: new Date(),
            };
            if (data.rating !== undefined) updateData.rating = data.rating;
            if (data.content !== undefined) updateData.content = data.content;

            const updated = await tx.club_review_tb.update({
                where: { id },
                data: updateData,
            });

            if (data.keywords !== undefined) {
                await tx.club_review_keyword_tb.deleteMany({
                    where: { review_id: id },
                });

                if (data.keywords.length > 0) {
                    await tx.club_review_keyword_tb.createMany({
                        data: data.keywords.map((keywordId) => ({
                            review_id: id,
                            keyword_id: keywordId,
                        })),
                    });
                }
            }

            if (data.rating !== undefined) {
                const stats = await tx.club_review_tb.aggregate({
                    where: { club_id: review.club_id },
                    _avg: { rating: true },
                });

                await tx.club.update({
                    where: { id: review.club_id },
                    data: {
                        avgRating: stats._avg.rating || 0,
                    },
                });
            }

            return updated;
        });

        return {
            id: result.id,
            clubId: result.club_id,
            userId: result.user_id,
            rating: result.rating,
            content: result.content,
            createdAt: result.created_at ? result.created_at.toISOString() : null,
            updatedAt: result.updated_at ? result.updated_at.toISOString() : null,
        };
    }

    async delete(id: number, userId: number): Promise<void> {
        const review = await this.prisma.club_review_tb.findUnique({
            where: { id },
            select: { user_id: true, club_id: true },
        });

        if (!review) {
            throw new NotFoundError('리뷰를 찾을 수 없습니다.');
        }

        if (review.user_id !== userId) {
            throw new ForbiddenError('권한이 없습니다.');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.club_review_keyword_tb.deleteMany({
                where: { review_id: id },
            });

            await tx.review_img_tb.deleteMany({
                where: { review_id: id },
            });

            await tx.club_review_tb.delete({
                where: { id },
            });

            const stats = await tx.club_review_tb.aggregate({
                where: { club_id: review.club_id },
                _avg: { rating: true },
                _count: true,
            });

            await tx.club.update({
                where: { id: review.club_id },
                data: {
                    avgRating: stats._avg.rating || 0,
                    reviewCnt: stats._count,
                },
            });
        });
    }

    async saveReviewImages(
        userId: number,
        reviewId: number,
        files: SavedFileInfo[]
    ): Promise<OperationSuccessType> {
        const review = await this.prisma.club_review_tb.findUnique({
            where: { id: reviewId, user_id: userId },
        });

        if (!review) {
            throw new NotFoundError('해당 리뷰를 찾을 수 없거나 권한이 없습니다.');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.review_img_tb.deleteMany({
                where: { review_id: reviewId },
            });

            await tx.review_img_tb.createMany({
                data: files.map((file) => ({
                    review_id: reviewId,
                    file_path: file.filePath,
                    is_main: file.order === 0,
                    original_name: file.originalName,
                    file_size: file.size,
                    updated_at: new Date(),
                })),
            });
        });

        return { success: true, operation: 'saved' };
    }
}
