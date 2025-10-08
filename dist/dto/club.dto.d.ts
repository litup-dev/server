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
//# sourceMappingURL=club.dto.d.ts.map