import { PrismaClient } from '@prisma/client';
import type { CreateClubDto, UpdateClubDto } from '../dto/club.dto.js';
import { ForbiddenError, NotFoundError } from '@/common/error.js';
import { SavedFileInfo } from '@/types/file.types.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';

export class ClubService {
    constructor(private prisma: PrismaClient) {}

    async getAll(offset: number = 0, limit: number = 20) {
        const [clubs, total] = await Promise.all([
            this.prisma.club.findMany({
                include: {
                    user_tb: {
                        select: {
                            id: true,
                            nickname: true,
                            profile_path: true,
                        },
                    },
                    club_img_tb: {
                        where: { is_main: true },
                        select: {
                            id: true,
                            file_path: true,
                            is_main: true,
                        },
                        take: 1,
                    },
                    club_keyword_summary: {
                        include: {
                            keyword_tb: {
                                select: {
                                    id: true,
                                    name: true,
                                    icon_path: true,
                                },
                            },
                        },
                        take: 3,
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.club.count(),
        ]);

        return {
            clubs: clubs.map((club) => ({
                id: club.id,
                name: club.name,
                address: club.address,
                phone: club.phone,
                capacity: club.capacity,
                openTime: club.openTime,
                closeTime: club.closeTime,
                description: club.description,
                avgRating: club.avgRating,
                reviewCnt: club.reviewCnt,
                createdAt: club.createdAt,
                owner: club.user_tb
                    ? {
                          id: club.user_tb.id,
                          nickname: club.user_tb.nickname,
                          profilePath: club.user_tb.profile_path,
                      }
                    : undefined,
                mainImage: club.club_img_tb[0]
                    ? {
                          id: club.club_img_tb[0].id,
                          filePath: club.club_img_tb[0].file_path,
                      }
                    : undefined,
                keywords: club.club_keyword_summary.map((cks) => ({
                    id: cks.keyword_tb.id,
                    name: cks.keyword_tb.name,
                    iconPath: cks.keyword_tb.icon_path,
                })),
            })),
            total,
            offset,
            limit,
        };
    }

    async getById(id: number) {
        const club = await this.prisma.club.findUnique({
            where: { id },
            include: {
                user_tb: {
                    select: {
                        id: true,
                        nickname: true,
                        profile_path: true,
                    },
                },
                club_img_tb: {
                    select: {
                        id: true,
                        file_path: true,
                        is_main: true,
                        created_at: true,
                    },
                    orderBy: [{ is_main: 'desc' }, { created_at: 'desc' }],
                },
                club_keyword_summary: {
                    include: {
                        keyword_tb: {
                            select: {
                                id: true,
                                name: true,
                                icon_path: true,
                            },
                        },
                    },
                },
                perform_tb: {
                    where: {
                        perform_date: {
                            gte: new Date(),
                        },
                        is_cancelled: false,
                    },
                    select: {
                        id: true,
                        title: true,
                        perform_date: true,
                        price: true,
                    },
                    orderBy: { perform_date: 'asc' },
                    take: 5,
                },
            },
        });

        if (!club) throw new NotFoundError('Club not found');

        return {
            id: club.id,
            name: club.name,
            address: club.address,
            phone: club.phone,
            capacity: club.capacity,
            openTime: club.openTime,
            closeTime: club.closeTime,
            description: club.description,
            avgRating: club.avgRating,
            reviewCnt: club.reviewCnt,
            createdAt: club.createdAt,
            owner: club.user_tb
                ? {
                      id: club.user_tb.id,
                      nickname: club.user_tb.nickname,
                      profilePath: club.user_tb.profile_path,
                  }
                : undefined,
            images: club.club_img_tb.map((img) => ({
                id: img.id,
                filePath: img.file_path,
                isMain: img.is_main,
                createdAt: img.created_at,
            })),
            keywords: club.club_keyword_summary.map((cks) => ({
                id: cks.keyword_tb.id,
                name: cks.keyword_tb.name,
                iconPath: cks.keyword_tb.icon_path,
            })),
            upcomingPerforms: club.perform_tb.map((perform) => ({
                id: perform.id,
                title: perform.title,
                performDate: perform.perform_date,
                price: perform.price,
            })),
        };
    }

    async create(userId: number, data: CreateClubDto) {
        const club = await this.prisma.club.create({
            data: {
                name: data.name,
                phone: data.phone ?? null,
                address: data.address ?? null,
                description: data.description ?? null,
                capacity: data.capacity ?? null,
                openTime: data.openTime ?? null,
                closeTime: data.closeTime ?? null,
                userId: userId,
                avgRating: 0,
                reviewCnt: 0,
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
            id: club.id,
            name: club.name,
            address: club.address,
            phone: club.phone,
            capacity: club.capacity,
            openTime: club.openTime,
            closeTime: club.closeTime,
            description: club.description,
            avgRating: club.avgRating,
            reviewCnt: club.reviewCnt,
            createdAt: club.createdAt,
            owner: club.user_tb
                ? {
                      id: club.user_tb.id,
                      nickname: club.user_tb.nickname,
                      profilePath: club.user_tb.profile_path,
                  }
                : undefined,
        };
    }

    async update(id: number, userId: number, data: UpdateClubDto) {
        // 권한 확인
        const club = await this.prisma.club.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!club) {
            throw new NotFoundError('Club not found');
        }

        if (club.userId !== userId) {
            throw new ForbiddenError('Unauthorized');
        }

        const updated = await this.prisma.club.update({
            where: { id },
            data: {
                name: data.name ?? null,
                phone: data.phone ?? null,
                address: data.address ?? null,
                description: data.description ?? null,
                capacity: data.capacity ?? null,
                openTime: data.openTime ?? null,
                closeTime: data.closeTime ?? null,
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
            id: updated.id,
            name: updated.name,
            address: updated.address,
            phone: updated.phone,
            capacity: updated.capacity,
            openTime: updated.openTime,
            closeTime: updated.closeTime,
            description: updated.description,
            avgRating: updated.avgRating,
            reviewCnt: updated.reviewCnt,
            createdAt: updated.createdAt,
            owner: updated.user_tb
                ? {
                      id: updated.user_tb.id,
                      nickname: updated.user_tb.nickname,
                      profilePath: updated.user_tb.profile_path,
                  }
                : undefined,
        };
    }

    async delete(id: number, userId: number) {
        // 권한 확인
        const club = await this.prisma.club.findUnique({
            where: { id },
            select: { userId: true },
        });

        if (!club) {
            throw new NotFoundError('Club not found');
        }

        if (club.userId !== userId) {
            throw new ForbiddenError('Unauthorized');
        }

        await this.prisma.$transaction(async (tx) => {
            // 연관 데이터 삭제
            await tx.club_keyword_summary.deleteMany({
                where: { club_id: id },
            });

            await tx.club_img_tb.deleteMany({
                where: { club_id: id },
            });

            await tx.favorite_tb.deleteMany({
                where: { club_id: id },
            });

            // 클럽 삭제
            await tx.club.delete({
                where: { id },
            });
        });
    }

    async toggleFavorite(clubId: number, userId: number) {
        // 클럽 존재 확인
        const club = await this.prisma.club.findUnique({
            where: { id: clubId },
            select: { id: true },
        });

        if (!club) {
            throw new NotFoundError('Club not found');
        }

        // 기존 즐겨찾기 확인
        const existingFavorite = await this.prisma.favorite_tb.findFirst({
            where: {
                club_id: clubId,
                user_id: userId,
            },
        });

        if (existingFavorite) {
            // 이미 즐겨찾기 되어있으면 삭제
            await this.prisma.favorite_tb.delete({
                where: { id: existingFavorite.id },
            });

            return {
                isFavorite: false,
                message: 'Favorite removed',
            };
        } else {
            // 즐겨찾기 추가
            await this.prisma.favorite_tb.create({
                data: {
                    club_id: clubId,
                    user_id: userId,
                },
            });

            return {
                isFavorite: true,
                message: 'Favorite added',
            };
        }
    }

    async saveClubImages(
        userId: number,
        clubId: number,
        files: SavedFileInfo[]
    ): Promise<OperationSuccessType> {
        // 클럽을 등록한 사람이 맞는지 확인
        const performance = await this.prisma.club.findUnique({
            where: { id: clubId, userId: userId },
        });

        if (!performance) {
            throw new NotFoundError('해당 클럽을 찾을 수 없거나 권한이 없습니다.');
        }

        await this.prisma.$transaction(async (tx) => {
            // 기존 클럽 이미지 삭제
            await tx.club_img_tb.deleteMany({
                where: { club_id: clubId },
            });

            // 그리고 저장
            await this.prisma.club_img_tb.createMany({
                data: files.map((file) => ({
                    club_id: clubId,
                    user_id: userId,
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
