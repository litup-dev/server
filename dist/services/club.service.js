export class ClubService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll() {
        return this.prisma.club.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }
    async getById(id) {
        return this.prisma.club.findUnique({
            where: { id }
        });
    }
    async create(data) {
        return this.prisma.club.create({
            data: {
                ...data,
                userId: 1,
                avgRating: 0,
                reviewCnt: 0
            }
        });
    }
    async update(id, data) {
        return this.prisma.club.update({
            where: { id },
            data
        });
    }
    async delete(id) {
        return this.prisma.club.delete({
            where: { id }
        });
    }
}
//# sourceMappingURL=club.service.js.map