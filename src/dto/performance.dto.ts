export interface GetPerformancesByDateRangeQueryDto {
    startDate: string;
    endDate: string;
    offset?: number;
    limit?: number;
    isFree?: boolean;
    area?: string;
}

export interface SnsLinks {
    instagram?: string;
    youtube?: string;
}

export interface ArtistInfo {
    name: string;
    description?: string;
}

export interface PerformanceListResponseDto {
    performances: PerformanceResponseDto[];
    total: number;
    offset: number;
    limit: number;
}

export interface PerformanceResponseDto {
    id: number;
    title: string | null;
    description: string | null;
    performDate: Date | null;
    price: number | null;
    isCanceled: boolean | null;
    artists: ArtistInfo[] | null;
    snsLinks: SnsLinks[] | null;
    createdAt: Date | null;
    club: {
        id: number;
        name: string | null;
        address: string | null;
    };
    images?: {
        id: number;
        filePath: string | null;
        isMain: boolean | null;
    }[];
}
