import { ConflictError, NotFoundError } from '@/common/error.js';
import { CreateUserType } from '@/schemas/auth.schema.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import { UserDefaultType } from '@/schemas/user.schema.js';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

export class AuthService {
    constructor(private prisma: PrismaClient) {}

    async registerUser(body: CreateUserType): Promise<UserDefaultType> {
        const { provider, providerId } = body;

        const socialCode = await this.prisma.social_code.findFirst({
            where: { code: provider },
            select: { id: true },
        });

        if (!socialCode) {
            throw new NotFoundError('허용되지 않은 소셜 공급처입니다.');
        }

        const existingUser = await this.prisma.user_tb.findFirst({
            where: {
                social_id: socialCode.id,
                provider_id: providerId,
            },
        });

        if (existingUser) {
            throw new ConflictError('이미 존재하는 사용자입니다.');
        }

        // 추후 닉네임 로직 생성필요
        const generateNickname = randomUUID().slice(0, 8).toString();

        const newUser = await this.prisma.user_tb.create({
            data: {
                social_id: socialCode.id,
                nickname: generateNickname,
                provider_id: providerId,
            },
            select: {
                id: true,
                nickname: true,
                profile_path: true,
                created_at: true,
                updated_at: true,
                bio: true,
            },
        });

        return {
            id: newUser.id,
            nickname: newUser.nickname,
            profilePath: newUser.profile_path ?? null,
            createdAt: newUser.created_at ? newUser.created_at.toISOString() : null,
            updatedAt: newUser.updated_at ? newUser.updated_at.toISOString() : null,
            bio: newUser.bio ?? null,
        };
    }

    async withdrawUser(userId: number): Promise<OperationSuccessType> {
        const existingUser = await this.prisma.user_tb.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            throw new NotFoundError('사용자를 찾을 수 없습니다.');
        }

        await this.prisma.user_tb.delete({
            where: { id: userId },
        });
        // 관련 파일들도 삭제해야함.
        // 리뷰 image, profile 등
        return {
            success: true,
            operation: 'deleted',
            message: '유저가 삭제되었습니다.',
        };
    }
}
