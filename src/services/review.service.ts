import { PrismaClient } from '@prisma/client';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto.js';
import { NotFoundError } from '@/common/error.js';

export class ReviewService {
    constructor(private prisma: PrismaClient) {}

    async getReviewsByClubId(clubId: number, offset: number = 0, limit: number = 10) {
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

        const club = await this.prisma.club.findUnique({
            where: { id: clubId },
            select: { avgRating: true },
        });

        return {
            reviews: reviews.map((review) => ({
                id: review.id,
                clubId: review.club_id,
                userId: review.user_id,
                rating: review.rating,
                content: review.content,
                createdAt: review.created_at,
                updatedAt: review.updated_at,
                user: review.user_tb
                    ? {
                          id: review.user_tb.id,
                          nickname: review.user_tb.nickname,
                          profilePath: review.user_tb.profile_path,
                      }
                    : undefined,
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
            total: reviews.length,
            avgRating: club?.avgRating || 0,
        };
    }

    async getById(id: number) {
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

        if (!review) throw new NotFoundError('Review not found');

        return {
            id: review.id,
            clubId: review.club_id,
            userId: review.user_id,
            rating: review.rating,
            content: review.content,
            createdAt: review.created_at,
            updatedAt: review.updated_at,
            user: review.user_tb
                ? {
                      id: review.user_tb.id,
                      nickname: review.user_tb.nickname,
                      profilePath: review.user_tb.profile_path,
                  }
                : undefined,
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

    async create(clubId: number, userId: number, data: CreateReviewDto) {
        const result = await this.prisma.$transaction(async (tx) => {
            // 1. 리뷰 생성
            const review = await tx.club_review_tb.create({
                data: {
                    club_id: clubId,
                    user_id: userId,
                    rating: data.rating ?? null,
                    content: data.content ?? null,
                },
            });

            // 2. 리뷰-키워드 연결
            if (data.keywords && data.keywords.length > 0) {
                await tx.club_review_keyword_tb.createMany({
                    data: data.keywords.map((keywordId) => ({
                        review_id: review.id,
                        keyword_id: keywordId,
                    })),
                });
            }

            // TODO: club_keyword_summary(TB) - review_id(COL) 추가 후 주석 해제
            // 3. 클럽-키워드 연결
            //   if (data.keywords && data.keywords.length > 0) {
            //     await tx.club_keyword_summary.createMany({
            //       data: data.keywords.map(keywordId => ({
            //         review_id: review.id,
            //         club_id: clubId,
            //         keyword_id: keywordId
            //       }))
            //     });
            //   }

            // 4. 클럽의 평균 평점과 리뷰 수 업데이트
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

        return result;
    }

    async update(id: number, userId: number, data: UpdateReviewDto) {
        const review = await this.prisma.club_review_tb.findUnique({
            where: { id },
            select: { user_id: true, club_id: true },
        });

        if (!review) {
            throw new Error('Review not found');
        }

        if (review.user_id !== userId) {
            throw new Error('Unauthorized');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            // 1. 리뷰 업데이트
            const updated = await tx.club_review_tb.update({
                where: { id },
                data: {
                    rating: data.rating ?? null,
                    content: data.content ?? null,
                    updated_at: new Date(),
                },
            });

            // 2. 키워드 업데이트 (기존 삭제 후 재생성)
            if (data.keywords !== undefined) {
                await tx.club_review_keyword_tb.deleteMany({
                    where: { review_id: id },
                });

                // TODO: club_keyword_summary(TB) - review_id(COL) 추가 후 주석 해제
                // await tx.club_keyword_summary.deleteMany({
                //     where: { review_id: id }
                // });

                if (data.keywords.length > 0) {
                    await tx.club_review_keyword_tb.createMany({
                        data: data.keywords.map((keywordId) => ({
                            review_id: id,
                            keyword_id: keywordId,
                        })),
                    });
                    // TODO: club_keyword_summary 데이터 추가 로직
                    //     await tx.club_keyword_summary.createMany({
                    //       data: data.keywords.map(keywordId => ({
                    //         review_id: id,
                    //         club_id: review.club_id,
                    //         keyword_id: keywordId
                    //       }))
                    //     });
                }
            }

            // 3. 클럽의 평균 평점 업데이트
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

        return result;
    }

    async delete(id: number, userId: number) {
        const review = await this.prisma.club_review_tb.findUnique({
            where: { id },
            select: { user_id: true, club_id: true },
        });

        if (!review) {
            throw new Error('Review not found');
        }

        if (review.user_id !== userId) {
            throw new Error('Unauthorized');
        }

        await this.prisma.$transaction(async (tx) => {
            // 1. 연관 데이터 삭제
            await tx.club_review_keyword_tb.deleteMany({
                where: { review_id: id },
            });

            // TODO: club_keyword_summary(TB) - review_id(COL) 추가 후 주석 해제
            // await tx.club_keyword_summary.deleteMany({
            //     where: { review_id: id }
            // });

            await tx.review_img_tb.deleteMany({
                where: { review_id: id },
            });

            // 2. 리뷰 삭제
            await tx.club_review_tb.delete({
                where: { id },
            });

            // 3. 클럽의 평균 평점과 리뷰 수 업데이트
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
}
