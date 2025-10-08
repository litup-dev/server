import { PrismaClient } from '@prisma/client';
import { CreateClubDto, UpdateClubDto } from '../dto/club.dto.js';

export class ClubService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.club.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async getById(id: number) {
    return this.prisma.club.findUnique({
      where: { id }
    });
  }

  async create(data: CreateClubDto) {
    return this.prisma.club.create({ 
      data: {
        ...data,
        userId: 1,
        avgRating: 0,
        reviewCnt: 0
      }
    });
  }

  async update(id: number, data: UpdateClubDto) {
    return this.prisma.club.update({
      where: { id },
      data
    });
  }

  async delete(id: number) {
    return this.prisma.club.delete({
      where: { id }
    });
  }
}