export interface CreateClubDto {
    name: string;
    phone?: string;
    address?: string;
    description?: string;
    capacity?: number;
    openTime?: Date;
    closeTime?: Date;
}
export interface UpdateClubDto {
    name?: string;
    phone?: string;
    address?: string;
    description?: string;
    capacity?: number;
    openTime?: Date;
    closeTime?: Date;
}
export interface ClubResponseDto {
    id: number;
    name: string | null;
    address: string | null;
    phone: string | null;
    avgRating: number | null;
    reviewCnt: number | null;
    createdAt: Date | null;
}
//# sourceMappingURL=club.dto.d.ts.map