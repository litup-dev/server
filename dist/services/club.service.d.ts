import { PrismaClient } from '@prisma/client';
import { CreateClubDto, UpdateClubDto } from '../dto/club.dto.js';
export declare class ClubService {
    private prisma;
    constructor(prisma: PrismaClient);
    getAll(): Promise<{
        description: string | null;
        name: string | null;
        id: number;
        userId: number;
        createdAt: Date | null;
        phone: string | null;
        openTime: Date | null;
        closeTime: Date | null;
        capacity: number | null;
        address: string | null;
        avgRating: number | null;
        reviewCnt: number | null;
    }[]>;
    getById(id: number): Promise<{
        description: string | null;
        name: string | null;
        id: number;
        userId: number;
        createdAt: Date | null;
        phone: string | null;
        openTime: Date | null;
        closeTime: Date | null;
        capacity: number | null;
        address: string | null;
        avgRating: number | null;
        reviewCnt: number | null;
    } | null>;
    create(data: CreateClubDto): Promise<{
        description: string | null;
        name: string | null;
        id: number;
        userId: number;
        createdAt: Date | null;
        phone: string | null;
        openTime: Date | null;
        closeTime: Date | null;
        capacity: number | null;
        address: string | null;
        avgRating: number | null;
        reviewCnt: number | null;
    }>;
    update(id: number, data: UpdateClubDto): Promise<{
        description: string | null;
        name: string | null;
        id: number;
        userId: number;
        createdAt: Date | null;
        phone: string | null;
        openTime: Date | null;
        closeTime: Date | null;
        capacity: number | null;
        address: string | null;
        avgRating: number | null;
        reviewCnt: number | null;
    }>;
    delete(id: number): Promise<{
        description: string | null;
        name: string | null;
        id: number;
        userId: number;
        createdAt: Date | null;
        phone: string | null;
        openTime: Date | null;
        closeTime: Date | null;
        capacity: number | null;
        address: string | null;
        avgRating: number | null;
        reviewCnt: number | null;
    }>;
}
//# sourceMappingURL=club.service.d.ts.map