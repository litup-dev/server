import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@/common/error.js';
import { SavedFileInfo } from '@/types/file.types.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import {
    ClubType,
    GetClubsType,
    ClubSearchResponseType,
    ClubSearchType,
} from '@/schemas/club.schema.js';
import { ClubSearchArea } from '@/types/search.types.js';

export class ClubService {
    constructor(private prisma: PrismaClient) {}

    async getSearch(parameters: GetClubsType): Promise<ClubSearchResponseType> {
        const { searchKey, area, latitude, longitude, keywords, sort, offset, limit } = parameters;

        if (area === ClubSearchArea.NEARBY && latitude && longitude) {
            return this.getSearchNearby(parameters);
        }

        const whereConditions: any = {};

        // 클럽명
        if (searchKey) {
            whereConditions.name = {
                contains: searchKey,
            };
        }

        // 권역
        if (area && area !== 'nearby') {
            if (area == ClubSearchArea.SEOUL) {
                whereConditions.address = {
                    contains: '서울',
                };
            } else if (area == ClubSearchArea.BUSAN) {
                whereConditions.address = {
                    contains: '부산',
                };
            } else if (area == ClubSearchArea.OTHER) {
                whereConditions.AND = [
                    {
                        address: {
                            not: {
                                contains: '서울',
                            },
                        },
                    },
                    {
                        address: {
                            not: {
                                contains: '부산',
                            },
                        },
                    },
                ];
            }
        }

        // 리뷰 키워드
        if (keywords && keywords.length > 0) {
            whereConditions.club_keyword_summary = {
                some: {
                    keyword_tb: {
                        id: {
                            in: keywords,
                        },
                    },
                },
            };
        }

        // 정렬 조건
        const orderBy = this.buildOrderByForObject(sort);

        const [clubs, total] = await Promise.all([
            this.prisma.club.findMany({
                where: whereConditions,
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
                                },
                            },
                        },
                        take: 3,
                    },
                    _count: {
                        select: {
                            favorite_tb: true,
                        },
                    },
                },
                orderBy,
                skip: offset,
                take: limit,
            }),
            this.prisma.club.count({ where: whereConditions }),
        ]);

        return {
            items: clubs.map((club) => this.mapClubSearchToResponse(club)),
            total,
            offset,
            limit,
        };
    }
    private async getSearchNearby(parameters: GetClubsType): Promise<ClubSearchResponseType> {
        const { searchKey, area, latitude, longitude, keywords, sort, offset, limit } = parameters;
        // 반경
        const radiusKm = 5;

        const conditions: string[] = [];
        const params: any[] = [longitude, latitude, radiusKm];
        let paramIndex = 4;

        if (searchKey) {
            conditions.push(`c.name ILIKE '%' || $${paramIndex} || '%'`);
            params.push(searchKey);
            paramIndex++;
        }

        if (keywords && keywords.length > 0) {
            conditions.push(`c.id IN (
                SELECT DISTINCT club_id
                FROM club_keyword_summary
                WHERE keyword_id = ANY($${paramIndex}::int[])
                )`);
            params.push(keywords);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

        const orderByClause = this.buildOrderByForRaw(sort);
        console.log('Keywords param:', keywords);
        console.log('Conditions:', conditions);
        console.log('WhereClause:', whereClause);
        console.log('OrderByClause:', orderByClause);
        console.log('Params:', params);
        const query = `
            SELECT 
                c.id,
                c.user_id,
                c.created_at,
                c.name,
                c.phone,
                c.open_time,
                c.close_time,
                c.capacity,
                c.address,
                c.description,
                c.avg_rating,
                c.review_cnt,
                c.updated_at,
                c.sns_links,
                c.latest_review_at,
                c.latitude,
                c.longitude,
                ST_Distance(
                    c.location::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                ) as distance
            FROM club_tb c
            WHERE ST_DWithin(
                c.location::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3 * 1000
            )
            ${whereClause}
            ${orderByClause}
            OFFSET $${paramIndex}
            LIMIT $${paramIndex + 1}
        `;

        params.push(offset, limit);

        const clubs = (await this.prisma.$queryRawUnsafe(query, ...params)) as any[];

        const countQuery = `
            SELECT COUNT(*) as count
            FROM club_tb c
            WHERE ST_DWithin(
                c.location::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                $3 * 1000
            )
            ${whereClause}
        `;

        const countResult: any = await this.prisma.$queryRawUnsafe(
            countQuery,
            ...params.slice(0, paramIndex - 1)
        );
        const total = Number(countResult[0]?.count || 0);

        const clubIds = clubs.map((c: any) => c.id);
        const fullClubs = await this.prisma.club.findMany({
            where: { id: { in: clubIds } },
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
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        favorite_tb: true,
                    },
                },
            },
        });

        // Raw Query 순서 보존
        const clubMap = new Map(fullClubs.map((club) => [club.id, club]));
        const orderedClubs = clubIds.map((id) => clubMap.get(id)).filter(Boolean) as any[];

        return {
            items: orderedClubs.map((club) => this.mapClubSearchToResponse(club)),
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
                    },
                    orderBy: { perform_date: 'asc' },
                    take: 5,
                },
                _count: {
                    select: {
                        favorite_tb: true,
                    },
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
            openTime: club.openTime ? this.formatTimeOnly(club.openTime) : null,
            closeTime: club.closeTime ? this.formatTimeOnly(club.closeTime) : null,
            description: club.description,
            avgRating: club.avgRating,
            reviewCnt: club.reviewCnt,
            favoriteCount: club._count.favorite_tb,
            createdAt: club.createdAt ? club.createdAt.toISOString() : null,
            latitude: club.latitude,
            longitude: club.longitude,
            keywords: club.club_keyword_summary.map((cks) => ({
                id: cks.keyword_tb.id,
                name: cks.keyword_tb.name,
            })),
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

    private buildOrderByForObject(sortBy?: string): { [key: string]: 'asc' | 'desc' } {
        const defaultOrder = { createdAt: 'desc' as const };

        if (!sortBy) return defaultOrder;
        const [direction, field] = [sortBy[0], sortBy.slice(1)];
        const order = direction === '-' ? 'desc' : 'asc';

        switch (field) {
            case 'reviewCount':
                return { reviewCnt: order };
            case 'rating':
                return { avgRating: order };
            case 'reviewCreatedAt':
                return { latestReviewAt: order };
            default:
                return defaultOrder;
        }
    }
    private buildOrderByForRaw(sortBy?: string) {
        const defaultOrder: string = `ORDER BY c.created_at DESC, distance ASC`;

        if (!sortBy) return defaultOrder;
        const [direction, field] = [sortBy[0], sortBy.slice(1)];
        const order = direction === '-' ? 'desc' : 'asc';

        switch (field) {
            case 'reviewCount':
                return `ORDER BY c.review_cnt ${order.toUpperCase()}, distance ASC`;
            case 'rating':
                return `ORDER BY c.avg_rating ${order.toUpperCase()}, distance ASC`;
            case 'reviewCreatedAt':
                return `ORDER BY c.latest_review_at ${order.toUpperCase()}, distance ASC`;
            default:
                return defaultOrder;
        }
    }

    private mapClubSearchToResponse(club: any): ClubSearchType {
        return {
            id: club.id,
            name: club.name,
            address: club.address,
            avgRating: club.avgRating,
            reviewCnt: club.reviewCnt,
            latitude: club.latitude,
            longitude: club.longitude,
            mainImage: club.club_img_tb[0]
                ? {
                      id: club.club_img_tb[0].id,
                      filePath: club.club_img_tb[0].file_path,
                      isMain: club.club_img_tb[0].is_main,
                  }
                : null,
            favoriteCount: club._count.favorite_tb,
        };
    }

    private formatTimeOnly(time: Date | string): string {
        const date = typeof time === 'string' ? new Date(time) : time;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}
