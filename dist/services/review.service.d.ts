import { PrismaClient } from '@prisma/client';
import { CreateReviewDto, UpdateReviewDto } from '../dto/review.dto.js';
export declare class ReviewService {
    private prisma;
    constructor(prisma: PrismaClient);
    getReviewsByClubId(clubId: number, offset?: number, limit?: number): Promise<{
        reviews: {
            id: number;
            clubId: number;
            userId: number;
            rating: number | null;
            content: string | null;
            createdAt: Date | null;
            updatedAt: Date | null;
            user: {
                id: number;
                nickname: string | null;
                profilePath: string | null;
            } | undefined;
            keywords: {
                id: number;
                name: string | null;
            }[];
            images: {
                id: number;
                filePath: string | null;
                isMain: boolean | null;
            }[];
        }[];
        total: number;
        avgRating: number;
    }>;
    getById(id: number): Promise<{
        id: number;
        clubId: number;
        userId: number;
        rating: number | null;
        content: string | null;
        createdAt: Date | null;
        updatedAt: Date | null;
        user: {
            id: number;
            nickname: string | null;
            profilePath: string | null;
        } | undefined;
        keywords: {
            id: number;
            name: string | null;
        }[];
        images: {
            id: number;
            filePath: string | null;
            isMain: boolean | null;
        }[];
    } | null>;
    create(clubId: number, userId: number, data: CreateReviewDto): Promise<{
        content: string | null;
        id: number;
        club_id: number;
        user_id: number;
        created_at: Date | null;
        updated_at: Date | null;
        rating: number | null;
    }>;
    update(id: number, userId: number, data: UpdateReviewDto): Promise<{
        content: string | null;
        id: number;
        club_id: number;
        user_id: number;
        created_at: Date | null;
        updated_at: Date | null;
        rating: number | null;
    }>;
    delete(id: number, userId: number): Promise<void>;
}
//# sourceMappingURL=review.service.d.ts.map