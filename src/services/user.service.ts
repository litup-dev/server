import { NotFoundError } from '@/common/error.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import { PerformanceRecordsType } from '@/schemas/performance.schema.js';
import { UserInfoType, UserStatsType } from '@/schemas/user.schema.js';
import { PrismaClient } from '@prisma/client';

export class UserService {
    constructor(private prisma: PrismaClient) {}

    async getUserById(userId: number): Promise<UserInfoType> {
        const user = await this.prisma.user_tb.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nickname: true,
                profile_path: true,
                bio: true,
            },
        });

        if (!user) {
            throw new NotFoundError('사용자를 찾을 수 없습니다.');
        }

        return {
            id: user.id,
            nickname: user.nickname,
            profilePath: user.profile_path ?? null,
            bio: user.bio ?? null,
        };
    }

    async getUserStats(userId: number): Promise<UserStatsType> {
        const attendCount = await this.prisma.attend_tb.count({
            where: { user_id: userId },
        });

        const performReviewCount = await this.prisma.perform_review_tb.count({
            where: { user_id: userId },
        });

        return {
            attendCount,
            performReviewCount,
        };
    }

    async getUserAttendanceRecords(
        userId: number,
        offset: number,
        limit: number
    ): Promise<PerformanceRecordsType> {
        const attendances = await this.prisma.attend_tb.findMany({
            where: {
                user_id: userId,
            },
            select: {
                perform_id: true,
            },
        });
        const performanceIds = attendances.map((a) => a.perform_id);
        if (performanceIds.length === 0) {
            throw new NotFoundError('참석 기록이 없습니다.');
        }
        const [performances, total] = await this.prisma.$transaction([
            this.prisma.perform.findMany({
                where: {
                    id: { in: performanceIds },
                    perform_date: { lt: new Date() },
                },
                orderBy: {
                    perform_date: 'desc',
                },
                select: {
                    id: true,
                    title: true,
                    perform_date: true,
                    artists: true,
                    created_at: true,
                    club_tb: {
                        select: {
                            name: true,
                        },
                    },
                    perform_img_tb: {
                        select: {
                            id: true,
                            file_path: true,
                            is_main: true,
                        },
                    },
                },
                skip: offset,
                take: limit,
            }),
            this.prisma.perform.count({
                where: {
                    id: { in: performanceIds },
                    perform_date: { lt: new Date() },
                },
            }),
        ]);

        if (performances.length === 0) {
            return { items: [], total: total, offset, limit };
        }

        return {
            items: performances.map((performance) => ({
                id: performance.id,
                title: performance.title,
                performDate: performance.perform_date
                    ? performance.perform_date.toISOString()
                    : null,
                artists: Array.isArray(performance.artists)
                    ? performance.artists
                          .filter((artist): artist is string => typeof artist === 'string')
                          .map((artistName: string) => ({ name: artistName }))
                    : null,
                createdAt: performance.created_at ? performance.created_at.toISOString() : null,
                club: { name: performance.club_tb.name ?? null },
                images: performance.perform_img_tb.map((img) => ({
                    id: img.id,
                    filePath: img.file_path ?? null,
                    isMain: img.is_main ?? false,
                })),
            })),
            total: total,
            offset: offset,
            limit: limit,
        };
    }

    async deleteUserAttendanceRecords(
        userId: number,
        ids: number[]
    ): Promise<OperationSuccessType> {
        await this.prisma.attend_tb.deleteMany({
            where: {
                user_id: userId,
                perform_id: { in: ids },
            },
        });
        return {
            success: true,
            operation: 'deleted',
        };
    }

    async getUserFavoriteClubs(userId: number, offset: number, limit: number): Promise<any> {
        const [clubs, total] = await this.prisma.$transaction([
            this.prisma.favorite_tb.findMany({
                where: { user_id: userId },
                select: {
                    club_tb: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            club_img_tb: {
                                where: { is_main: true },
                                select: {
                                    id: true,
                                    file_path: true,
                                    is_main: true,
                                },
                            },
                        },
                    },
                },
                skip: offset,
                take: limit,
            }),
            this.prisma.favorite_tb.count({ where: { user_id: userId } }),
        ]);

        return {
            items: clubs,
            total: total,
            offset,
            limit,
        };
    }
}
