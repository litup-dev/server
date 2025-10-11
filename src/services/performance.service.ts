import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type {
    GetPerformancesByDateRangeQueryDto,
    PerformanceListResponseDto,
} from '../dto/performance.dto';

export class PerformanceService {
    constructor(private prisma: PrismaClient) {}

    async getPerformancesByDateRange(
        query: GetPerformancesByDateRangeQueryDto
    ): Promise<PerformanceListResponseDto> {
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
            if (a === '홍대') {
                where.club_tb = {
                    is: { address: { contains: '마포' } },
                };
            } else if (a === '서울') {
                where.club_tb = {
                    is: {
                        AND: [
                            { address: { contains: '서울' } },
                            { NOT: { address: { contains: '마포' } } },
                        ],
                    },
                };
            } else if(a === '부산'){
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
        return {
            performances: performances.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                performDate: p.perform_date,
                price: p.price,
                isCanceled: p.is_cancelled,
                artists: p.artists as { name: string; description?: string }[] | null,
                snsLinks: p.sns_links as { instagram?: string; youtube?: string }[] | null,
                createdAt: p.created_at,
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

    async attendPerformance(userId: number, performId: number): Promise<string> {
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
        return action;
    }
}