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

        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (keyword && keyword.trim()) {
            const searchKeyword = `%${keyword.trim()}%`;
            conditions.push(`(
            p.title ILIKE $${paramIndex} OR 
            EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(p.artists) AS artist
                WHERE artist->>'name' ILIKE $${paramIndex}
            )
        )`);
            params.push(searchKeyword);
            paramIndex++;
        }

        const now = new Date();
        if (timeFilter === 'upcoming') {
            conditions.push(`p.perform_date >= $${paramIndex}`);
            params.push(now);
            paramIndex++;
        } else if (timeFilter === 'past') {
            conditions.push(`p.perform_date < $${paramIndex}`);
            params.push(now);
            paramIndex++;
        }

        if (area) {
            const a = area.trim();
            if (a === 'hongdae') {
                conditions.push(`c.address LIKE '%마포%'`);
            } else if (a === 'seoul') {
                conditions.push(`c.address LIKE '%서울%' AND c.address NOT LIKE '%마포%'`);
            } else if (a === 'busan') {
                conditions.push(`c.address LIKE '%부산%'`);
            } else if (a === 'other') {
                conditions.push(
                    `c.address NOT LIKE '%서울%' AND c.address NOT LIKE '%부산%' AND c.address NOT LIKE '%마포%'`
                );
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''; // 조건 AND 절로 결합
        const orderBy = timeFilter === 'past' ? 'DESC' : 'ASC';

        const countSql = `
            SELECT COUNT(*)::int as total
            FROM perform_tb p
            LEFT JOIN club_tb c ON p.club_id = c.id
            ${whereClause}
        `;

        const dataSql = `
            SELECT 
                p.id, p.title, p.description, p.perform_date, p.price, 
                p.is_cancelled, p.artists, p.sns_links, p.created_at,
                c.id as club_id, c.name as club_name, c.address as club_address
            FROM perform_tb p
            LEFT JOIN club_tb c ON p.club_id = c.id
            ${whereClause}
            ORDER BY p.perform_date ${orderBy}
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);

        const [countResult, performances] = await Promise.all([
            this.prisma.$queryRawUnsafe<{ total: number }[]>(countSql, ...params.slice(0, -2)), // 마지막 두 개는 limit, offset
            this.prisma.$queryRawUnsafe<any[]>(dataSql, ...params),
        ]);

        const total = countResult[0]?.total ?? 0;

        if (performances.length === 0) {
            return { items: [], total, offset, limit };
        }

        const performIds = performances.map((p) => p.id);
        const images = await this.prisma.perform_img_tb.findMany({
            where: {
                perform_id: { in: performIds },
                is_main: true,
            },
            select: {
                perform_id: true,
                id: true,
                file_path: true,
                is_main: true,
            },
        });

        const imagesByPerformId = images.reduce(
            (acc, img) => {
                if (!acc[img.perform_id]) acc[img.perform_id] = [];
                acc[img.perform_id]!.push(img);
                return acc;
            },
            {} as Record<number, typeof images>
        );

        return {
            items: performances.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                performDate:
                    p.perform_date instanceof Date ? p.perform_date.toISOString() : p.perform_date,
                price: p.price,
                isCanceled: p.is_cancelled,
                artists: Array.isArray(p.artists) ? (p.artists as { name: string }[]) : null,
                snsLinks: p.sns_links as { instagram?: string; youtube?: string }[] | null,
                createdAt: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
                club: {
                    id: p.club_id,
                    name: p.club_name,
                    address: p.club_address,
                },
                images: (imagesByPerformId[p.id] || []).map((img) => ({
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
        console.log(performances[0]?.artists);
        return {
            items: performances.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                performDate:
                    p.perform_date instanceof Date ? p.perform_date.toISOString() : p.perform_date,
                price: p.price,
                isCanceled: p.is_cancelled,
                artists: Array.isArray(p.artists) ? (p.artists as { name: string }[]) : null,
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
                ? (performance.artists as { name: string }[])
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
