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
}
