import { PrismaClient } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '@/common/error.js';
import { SavedFileInfo } from '@/types/file.types.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import { ClubType, ClubListResponseType } from '@/schemas/club.schema.js';

export class ClubService {
    constructor(private prisma: PrismaClient) {}

    async getAll(offset: number = 0, limit: number = 20): Promise<ClubListResponseType> {
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
            items: clubs.map((club) => ({
                id: club.id,
                name: club.name,
                address: club.address,
                phone: club.phone,
                capacity: club.capacity,
                openTime: club.openTime ? club.openTime.toISOString() : null,
                closeTime: club.closeTime ? club.closeTime.toISOString() : null,
                description: club.description,
                avgRating: club.avgRating,
                reviewCnt: club.reviewCnt,
                createdAt: club.createdAt ? club.createdAt.toISOString() : null,
                owner: club.user_tb
                    ? {
                          id: club.user_tb.id,
                          nickname: club.user_tb.nickname,
                          profilePath: club.user_tb.profile_path,
                      }
                    : null,
                mainImage: club.club_img_tb[0]
                    ? {
                          id: club.club_img_tb[0].id,
                          filePath: club.club_img_tb[0].file_path,
                          isMain: club.club_img_tb[0].is_main,
                      }
                    : null,
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

    async getById(id: number): Promise<ClubType> {
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

        if (!club) {
            throw new NotFoundError('클럽을 찾을 수 없습니다.');
        }

        return {
            id: club.id,
            name: club.name,
            address: club.address,
            phone: club.phone,
            capacity: club.capacity,
            openTime: club.openTime ? club.openTime.toISOString() : null,
            closeTime: club.closeTime ? club.closeTime.toISOString() : null,
            description: club.description,
            avgRating: club.avgRating,
            reviewCnt: club.reviewCnt,
            createdAt: club.createdAt ? club.createdAt.toISOString() : null,
            owner: club.user_tb
                ? {
                      id: club.user_tb.id,
                      nickname: club.user_tb.nickname,
                      profilePath: club.user_tb.profile_path,
                  }
                : null,
            images: club.club_img_tb.map((img) => ({
                id: img.id,
                filePath: img.file_path,
                isMain: img.is_main,
            })),
            keywords: club.club_keyword_summary.map((cks) => ({
                id: cks.keyword_tb.id,
                name: cks.keyword_tb.name,
                iconPath: cks.keyword_tb.icon_path,
            })),
            upcomingPerforms: club.perform_tb.map((perform) => ({
                id: perform.id,
                title: perform.title,
                performDate: perform.perform_date ? perform.perform_date.toISOString() : null,
                price: perform.price,
            })),
        };
    }

    async toggleFavorite(clubId: number, userId: number): Promise<boolean> {
        const club = await this.prisma.club.findUnique({
            where: { id: clubId },
            select: { id: true },
        });

        if (!club) {
            throw new NotFoundError('클럽을 찾을 수 없습니다.');
        }

        const existingFavorite = await this.prisma.favorite_tb.findFirst({
            where: {
                club_id: clubId,
                user_id: userId,
            },
        });

        if (existingFavorite) {
            await this.prisma.favorite_tb.delete({
                where: { id: existingFavorite.id },
            });
            return false;
        } else {
            await this.prisma.favorite_tb.create({
                data: {
                    club_id: clubId,
                    user_id: userId,
                },
            });
            return true;
        }
    }

    async saveClubImages(
        userId: number,
        clubId: number,
        files: SavedFileInfo[]
    ): Promise<OperationSuccessType> {
        const club = await this.prisma.club.findUnique({
            where: { id: clubId, userId: userId },
        });

        if (!club) {
            throw new NotFoundError('해당 클럽을 찾을 수 없거나 권한이 없습니다.');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.club_img_tb.deleteMany({
                where: { club_id: clubId },
            });

            await tx.club_img_tb.createMany({
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

function timeStringToDate(timeStr: string | null): Date | null {
    if (!timeStr) return null;
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, seconds));
    return date;
}
