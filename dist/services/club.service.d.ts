import { PrismaClient } from '@prisma/client';
import type { CreateClubDto, UpdateClubDto } from '../dto/club.dto.js';
export declare class ClubService {
    private prisma;
    constructor(prisma: PrismaClient);
    getAll(offset?: number, limit?: number): Promise<{
        clubs: {
            id: number;
            name: string | null;
            address: string | null;
            phone: string | null;
            capacity: number | null;
            openTime: Date | null;
            closeTime: Date | null;
            description: string | null;
            avgRating: number | null;
            reviewCnt: number | null;
            createdAt: Date | null;
            owner: {
                id: number;
                nickname: string | null;
                profilePath: string | null;
            } | undefined;
            mainImage: {
                id: number;
                filePath: string | null;
            } | undefined;
            keywords: {
                id: number;
                name: string | null;
                iconPath: string | null;
            }[];
        }[];
        total: number;
        offset: number;
        limit: number;
    }>;
    getById(id: number): Promise<{
        id: number;
        name: string | null;
        address: string | null;
        phone: string | null;
        capacity: number | null;
        openTime: Date | null;
        closeTime: Date | null;
        description: string | null;
        avgRating: number | null;
        reviewCnt: number | null;
        createdAt: Date | null;
        owner: {
            id: number;
            nickname: string | null;
            profilePath: string | null;
        } | undefined;
        images: {
            id: number;
            filePath: string | null;
            isMain: boolean | null;
            createdAt: Date | null;
        }[];
        keywords: {
            id: number;
            name: string | null;
            iconPath: string | null;
        }[];
        upcomingPerforms: {
            id: number;
            title: string | null;
            performDate: Date | null;
            price: number | null;
        }[];
    } | null>;
    create(userId: number, data: CreateClubDto): Promise<{
        id: number;
        name: string | null;
        address: string | null;
        phone: string | null;
        capacity: number | null;
        openTime: Date | null;
        closeTime: Date | null;
        description: string | null;
        avgRating: number | null;
        reviewCnt: number | null;
        createdAt: Date | null;
        owner: {
            id: number;
            nickname: string | null;
            profilePath: string | null;
        } | undefined;
    }>;
    update(id: number, userId: number, data: UpdateClubDto): Promise<{
        id: number;
        name: string | null;
        address: string | null;
        phone: string | null;
        capacity: number | null;
        openTime: Date | null;
        closeTime: Date | null;
        description: string | null;
        avgRating: number | null;
        reviewCnt: number | null;
        createdAt: Date | null;
        owner: {
            id: number;
            nickname: string | null;
            profilePath: string | null;
        } | undefined;
    }>;
    delete(id: number, userId: number): Promise<void>;
    toggleFavorite(clubId: number, userId: number): Promise<{
        isFavorite: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=club.service.d.ts.map