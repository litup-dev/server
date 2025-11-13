import { NotFoundError } from '@/common/error.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import {
    GetPerformanceByDateRangeType,
    PerformanceListResponseType,
    SearchPerformancesType,
    PerformanceType,
} from '@/schemas/performance.schema.js';
import { SavedFileInfo } from '@/types/file.types.js';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class PerformanceService {
    constructor(private prisma: PrismaClient) {}

    async getSearchPerformances(
        query: SearchPerformancesType
    ): Promise<PerformanceListResponseType> {
        const { keyword, timeFilter, area } = query;

        const offset = query.offset ?? 0;
        const limit = query.limit ?? 1000;
        const where: Prisma.PerformWhereInput = {};

        // 키워드
        if (keyword) {
            const searchKeyword = keyword.trim();
            where.OR = [
                { title: { contains: searchKeyword, mode: 'insensitive' } },
                {
                    artists: {
                        string_contains: searchKeyword,
                    },
                },
            ];
        }

        // 시간
        const now = new Date();
        if (timeFilter === 'upcoming') {
            where.perform_date = { gte: now };
        } else if (timeFilter === 'past') {
            where.perform_date = { lt: now };
        }

        // 지역
        if (area) {
            const a = area.trim();
            if (a === 'hongdae') {
                where.club_tb = {
                    is: { address: { contains: '마포' } },
                };
            } else if (a === 'seoul') {
                where.club_tb = {
                    is: {
                        AND: [
                            { address: { contains: '서울' } },
                            { NOT: { address: { contains: '마포' } } },
                        ],
                    },
                };
            } else if (a === 'busan') {
                where.club_tb = {
                    is: { address: { contains: '부산' } },
                };
            } else if (a === 'other') {
                where.club_tb = {
                    is: {
                        AND: [
                            { NOT: { address: { contains: '서울' } } },
                            { NOT: { address: { contains: '부산' } } },
                            { NOT: { address: { contains: '마포' } } },
                        ],
                    },
                };
            }
        }

        // 쿼리 실행
        const [performances, total] = await Promise.all([
            this.prisma.perform.findMany({
                where,
                include: {
                    club_tb: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                    perform_img_tb: {
                        where: { is_main: true },
                        select: {
                            id: true,
                            file_path: true,
                            is_main: true,
                        },
                        take: 1,
                    },
                },
                orderBy: {
                    perform_date: timeFilter === 'past' ? 'desc' : 'asc',
                },
                skip: offset,
                take: limit,
            }),
            this.prisma.perform.count({ where }),
        ]);

        if (performances.length === 0) {
            return { items: [], total: total, offset, limit };
        }

        return {
            items: performances.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                performDate:
                    p.perform_date instanceof Date ? p.perform_date.toISOString() : p.perform_date,
                price: p.price,
                isCanceled: p.is_cancelled,
                artists: Array.isArray(p.artists)
                    ? p.artists
                          .filter((artist): artist is string => typeof artist === 'string')
                          .map((artistName: string) => ({
                              name: artistName,
                          }))
                    : null,
                snsLinks: p.sns_links as { instagram?: string; youtube?: string }[] | null,
                createdAt: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
                club: {
                    id: p.club_tb.id,
                    name: p.club_tb.name,
                    address: p.club_tb.address,
                },
                images: p.perform_img_tb.map((img) => ({
                    id: img.id,
                    filePath: img.file_path,
                    isMain: img.is_main,
                })),
            })),
            total: total,
            offset: offset ?? 0,
            limit: limit ?? 1000,
        };
    }

    async getPerformancesByDateRange(
        query: GetPerformanceByDateRangeType
    ): Promise<PerformanceListResponseType> {
        const { startDate, endDate, isFree, area } = query;

        const offset = query.offset ?? 0;
        const limit = query.limit ?? 1000;

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const where: Prisma.PerformWhereInput = {
            perform_date: {
                gte: start,
                lte: end,
            },
        };
        if (isFree) {
            where.price = { equals: 0 };
        }

        if (area) {
            const a = area.trim();
            if (a === 'hongdae') {
                where.club_tb = {
                    is: { address: { contains: '마포' } },
                };
            } else if (a === 'seoul') {
                where.club_tb = {
                    is: {
                        AND: [
                            { address: { contains: '서울' } },
                            { NOT: { address: { contains: '마포' } } },
                        ],
                    },
                };
            } else if (a === 'busan') {
                where.club_tb = {
                    is: { address: { contains: '부산' } },
                };
            }
        }

        const [performances, total] = await Promise.all([
            this.prisma.perform.findMany({
                where,
                include: {
                    club_tb: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                        },
                    },
                    perform_img_tb: {
                        where: { is_main: true },
                        select: {
                            id: true,
                            file_path: true,
                            is_main: true,
                        },
                        take: 1,
                    },
                },
                orderBy: { perform_date: 'asc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.perform.count({ where }),
        ]);

        if (performances.length === 0) {
            return { items: [], total: total, offset, limit };
        }

        return {
            items: performances.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                performDate:
                    p.perform_date instanceof Date ? p.perform_date.toISOString() : p.perform_date,
                price: p.price,
                isCanceled: p.is_cancelled,
                artists: Array.isArray(p.artists)
                    ? p.artists
                          .filter((artist): artist is string => typeof artist === 'string')
                          .map((artistName: string) => ({
                              name: artistName,
                          }))
                    : null,
                snsLinks: p.sns_links as { instagram?: string; youtube?: string }[] | null,
                createdAt: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
                club: {
                    id: p.club_tb.id,
                    name: p.club_tb.name,
                    address: p.club_tb.address,
                },
                images: p.perform_img_tb.map((img) => ({
                    id: img.id,
                    filePath: img.file_path,
                    isMain: img.is_main,
                })),
            })),
            total: total,
            offset: offset ?? 0,
            limit: limit ?? 1000,
        };
    }

    async attendPerformance(userId: number, performId: number): Promise<boolean> {
        // 토글로 작성 - 이미 참석한 기록이 있으면 삭제, 없으면 생성
        // 동시성 문제가 생길 수 있다고 로우 쿼리를 추천함.
        // race condition
        const sql = Prisma.sql`
            WITH ins AS (
                INSERT INTO attend_tb (perform_id, user_id, created_at)
                VALUES (${performId}, ${userId}, now())
                ON CONFLICT (perform_id, user_id) DO NOTHING
                RETURNING 'true' AS action
            ), del AS (
                DELETE FROM attend_tb
                WHERE perform_id = ${performId} AND user_id = ${userId}
                AND NOT EXISTS (SELECT 1 FROM ins)
                RETURNING 'false' AS action
            )
            SELECT action FROM ins
            UNION ALL
            SELECT action FROM del;
            `;
        const result = await this.prisma.$queryRaw<{ action: string }[]>(sql);

        if (result.length === 0 || typeof result[0]?.action !== 'string') {
            throw new Error('참석 여부 실패');
        }
        // 'true' or 'false'
        const action = result[0].action;
        return action === 'true';
    }

    async isUserAttending(userId: number, performId: number): Promise<boolean> {
        const attend = await this.prisma.attend_tb.findUnique({
            where: {
                perform_id_user_id: {
                    perform_id: performId,
                    user_id: userId,
                },
            },
        });
        return attend !== null;
    }

    async getPerformanceDetails(performId: number): Promise<PerformanceType | null> {
        const performance = await this.prisma.perform.findUnique({
            where: { id: performId },
            include: {
                club_tb: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
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
        });
        if (!performance) {
            throw new NotFoundError('공연을 찾을 수 없습니다.');
        }
        return {
            id: performance.id,
            title: performance.title ?? null,
            description: performance.description ?? null,
            performDate:
                performance.perform_date instanceof Date
                    ? performance.perform_date.toISOString()
                    : (performance.perform_date ?? null),
            price: performance.price ?? null,
            isCanceled: performance.is_cancelled ?? null,
            artists: Array.isArray(performance.artists)
                ? performance.artists
                      .filter((artist): artist is string => typeof artist === 'string')
                      .map((artistName: string) => ({
                          name: artistName,
                      }))
                : null,
            snsLinks:
                (performance.sns_links as { instagram?: string; youtube?: string }[] | null) ??
                null,
            createdAt:
                performance.created_at instanceof Date
                    ? performance.created_at.toISOString()
                    : (performance.created_at ?? null),
            club: {
                id: performance.club_tb?.id ?? 0,
                name: performance.club_tb?.name ?? null,
                address: performance.club_tb?.address ?? null,
            },
            images: (performance.perform_img_tb ?? []).map((img) => ({
                id: img.id,
                filePath: img.file_path ?? null,
                isMain: img.is_main ?? null,
            })),
        };
    }

    async savePerformancePosters(
        userId: number,
        performId: number,
        files: SavedFileInfo[]
    ): Promise<OperationSuccessType> {
        // 공연을 등록한 사람이 맞는지 확인
        const performance = await this.prisma.perform.findUnique({
            where: { id: performId, user_id: userId },
        });

        if (!performance) {
            throw new NotFoundError('해당 공연을 찾을 수 없거나 권한이 없습니다.');
        }

        await this.prisma.$transaction(async (tx) => {
            // 기존 포스터 삭제
            await tx.perform_img_tb.deleteMany({
                where: { perform_id: performId },
            });

            // 그리고 저장
            await this.prisma.perform_img_tb.createMany({
                data: files.map((file) => ({
                    perform_id: performId,
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
