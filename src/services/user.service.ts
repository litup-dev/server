import { NotFoundError } from '@/common/error.js';
import { UserInfoType } from '@/schemas/user.schema.js';
import { PrismaClient } from '@prisma/client';

export class UserService {
    constructor(private prisma: PrismaClient) {}

    async getUserById(userId: number): Promise<UserInfoType> {
        const user = await this.prisma.user_tb.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nickname: true,
                profile_path: true,
                bio: true,
            },
        });

        if (!user) {
            throw new NotFoundError('사용자를 찾을 수 없습니다.');
        }

        return {
            id: user.id,
            nickname: user.nickname,
            profilePath: user.profile_path ?? null,
            bio: user.bio ?? null,
        };
    }
}
