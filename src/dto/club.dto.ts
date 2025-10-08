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
  
  // 응답용 DTO (민감한 정보 제외)
  export interface ClubResponseDto {
    id: number;
    name: string | null;
    address: string | null;
    phone: string | null;
    avgRating: number | null;
    reviewCnt: number | null;
    createdAt: Date | null;
  }