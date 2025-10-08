export interface CreateReviewDto {
    rating: number;
    content?: string;
    keywords?: number[];
}
export interface UpdateReviewDto {
    rating?: number;
    content?: string;
    keywords?: number[];
}
export interface ReviewResponseDto {
    id: number;
    clubId: number;
    userId: number;
    rating: number | null;
    content: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    user?: {
        id: number;
        nickname: string | null;
        profilePath: string | null;
    };
    keywords?: {
        id: number;
        name: string | null;
    }[];
    images?: {
        id: number;
        filePath: string | null;
        isMain: boolean | null;
    }[];
}
export interface ReviewListResponseDto {
    reviews: ReviewResponseDto[];
    total: number;
    avgRating: number;
}
//# sourceMappingURL=review.dto.d.ts.map