import { club_img_tb } from './../../node_modules/.prisma/client/index.d';
import { NotFoundError } from '@/common/error.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import { PerformanceRecordsType } from '@/schemas/performance.schema.js';
import {
    UserInfoType,
    UserPrivacySettingType,
    UserProfileEditType,
    UserStatsType,
} from '@/schemas/user.schema.js';
import { PrivacyLevelType } from '@/types/privacy.types.js';
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
        targetUserId: number,
        requesterId: number | null,
        offset: number,
        limit: number
    ): Promise<PerformanceRecordsType> {
        const isSelf = requesterId !== null && requesterId === targetUserId;
        if (!isSelf) {
            const privacyRule = await this.prisma.user_settings_tb.findFirst({
                where: { user_id: targetUserId },
                select: { attendance_privacy: true },
            });
            const privacy = privacyRule?.attendance_privacy;
            if (privacy === 'private') {
                throw new NotFoundError('비공개 상태입니다.');
            } else if (privacy === 'friends') {
                if (requesterId === null) {
                    throw new NotFoundError('비공개 상태입니다.');
                }
                // 추후 친구 관계 생기면 로직 추가
            }
        }

        const attendances = await this.prisma.attend_tb.findMany({
            where: {
                user_id: targetUserId,
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

    async getUserFavoriteClubs(
        targetUserId: number,
        requesterId: number | null,
        offset: number,
        limit: number
    ): Promise<any> {
        const isSelf = requesterId !== null && requesterId === targetUserId;
        console.log(requesterId, targetUserId, isSelf);
        if (!isSelf) {
            const privacyRule = await this.prisma.user_settings_tb.findFirst({
                where: { user_id: targetUserId },
                select: { favorite_clubs_privacy: true },
            });
            const privacy = privacyRule?.favorite_clubs_privacy;
            if (privacy === 'private') {
                throw new NotFoundError('비공개 상태입니다.');
            } else if (privacy === 'friends') {
                if (requesterId === null) {
                    throw new NotFoundError('비공개 상태입니다.');
                }
                // 추후 친구 관계 생기면 로직 추가
            }
        }

        const favoriteClubIds = await this.prisma.favorite_tb.findMany({
            where: { user_id: targetUserId },
            select: { club_id: true },
            skip: offset,
            take: limit,
        });
        const clubIds = favoriteClubIds.map((ids) => ids.club_id);

        console.log('Favorite club IDs:', clubIds);
        if (clubIds.length === 0) {
            throw new NotFoundError('관심 클럽이 없습니다.');
        }

        const [clubs, total] = await this.prisma.$transaction([
            this.prisma.club.findMany({
                where: { id: { in: clubIds } },
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
            }),
            this.prisma.favorite_tb.count({ where: { user_id: targetUserId } }),
        ]);

        console.log('Fetched clubs:', clubs);

        return {
            items: clubs,
            total,
            offset,
            limit,
        };
    }

    async updateUserAvatar(userId: number, avatarPath: string): Promise<OperationSuccessType> {
        const user = await this.prisma.user_tb.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundError('사용자를 찾을 수 없습니다.');
        }

        await this.prisma.user_tb.update({
            where: { id: userId },
            data: { profile_path: avatarPath, updated_at: new Date() },
        });
        return {
            success: true,
            operation: 'updated',
        };
    }

    async updateUserProfile(
        userId: number,
        profileData: UserProfileEditType
    ): Promise<UserInfoType> {
        const user = await this.prisma.user_tb.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundError('사용자를 찾을 수 없습니다.');
        }

        const updatedUser = await this.prisma.user_tb.update({
            where: { id: userId },
            data: {
                nickname: profileData.nickname,
                bio: profileData.bio,
                updated_at: new Date(),
            },
        });
        return {
            id: updatedUser.id,
            nickname: updatedUser.nickname,
            profilePath: updatedUser.profile_path ?? null,
            bio: updatedUser.bio ?? null,
        };
    }

    async getUserPrivacySettings(userId: number): Promise<UserPrivacySettingType> {
        const settings = await this.prisma.user_settings_tb.findUnique({
            where: { user_id: userId },
            select: {
                favorite_clubs_privacy: true,
                attendance_privacy: true,
                perform_history_privacy: true,
            },
        });

        if (!settings) {
            throw new NotFoundError('사용자 설정을 찾을 수 없습니다.');
        }

        return {
            favoriteClubs: settings.favorite_clubs_privacy as PrivacyLevelType,
            attendance: settings.attendance_privacy as PrivacyLevelType,
            performHistory: settings.perform_history_privacy as PrivacyLevelType,
        };
    }

    async updateUserPrivacySettings(
        userId: number,
        settings: UserPrivacySettingType
    ): Promise<OperationSuccessType> {
        await this.prisma.user_settings_tb.update({
            where: { user_id: userId },
            data: {
                ...(settings.favoriteClubs && { favorite_clubs_privacy: settings.favoriteClubs }),
                ...(settings.attendance && { attendance_privacy: settings.attendance }),
                ...(settings.performHistory && {
                    perform_history_privacy: settings.performHistory,
                }),
                updated_at: new Date(),
            },
        });

        return {
            success: true,
            operation: 'updated',
            message: '유저 정보 공개 여부가 업데이트되었습니다.',
        };
    }
}
