import { NotFoundError } from '@/common/error.js';
import { CreateUserType } from '@/schemas/auth.schema.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import { UserDefaultType } from '@/schemas/user.schema.js';
import { PrivacyLevel } from '@/types/privacy.types.js';
import { PrismaClient } from '@prisma/client';
import { NicknameService } from '@/services/nickname.service.js';

export class AuthService {
    constructor(private prisma: PrismaClient) {}

    async verifyUser(body: CreateUserType): Promise<UserDefaultType> {
        const { provider, providerId, email } = body;

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
            // throw new ConflictError('이미 존재하는 사용자입니다.');
            // 소셜 로그인만 존재해 로그인, 회원가입에 대한 구분이 애매함.
            return {
                id: existingUser.id,
                nickname: existingUser.nickname,
                email: existingUser.email!,
                profilePath: existingUser.profile_path ?? null,
                createdAt: existingUser.created_at ? existingUser.created_at.toISOString() : null,
                updatedAt: existingUser.updated_at ? existingUser.updated_at.toISOString() : null,
                bio: existingUser.bio ?? null,
            };
        }

        // 추후 닉네임 로직 생성필요
        const nicknameService = new NicknameService(this.prisma);
        const generateNickname = await nicknameService.generateNickname(email);

        const newUser = await this.prisma.user_tb.create({
            data: {
                social_id: socialCode.id,
                nickname: generateNickname,
                provider_id: providerId,
                email: email,
            },
            select: {
                id: true,
                nickname: true,
                email: true,
                profile_path: true,
                created_at: true,
                updated_at: true,
                bio: true,
            },
        });

        // 사용자 환경설정 초기값 생성
        await this.prisma.user_settings_tb.create({
            data: {
                user_id: newUser.id,
                favorite_clubs_privacy: PrivacyLevel.PUBLIC,
                attendance_privacy: PrivacyLevel.PUBLIC,
                perform_history_privacy: PrivacyLevel.PUBLIC,
            },
        });

        return {
            id: newUser.id,
            nickname: newUser.nickname,
            email: newUser.email!,
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
        // 삭제 해야하는 데이터
        // 일반
        //     이미지 : 클럽 리뷰 이미지, 클럽 이미지, 프로필 이미지, 공연 이미지
        //     데이터 : 클럽 리뷰, 한줄평, 참석의사, 관심클럽,
        // 매니저
        // 한줄평, 클럽 리뷰 이미지, 클럽 이미지, 프로필 이미지, 공연 이미지

        return {
            success: true,
            operation: 'deleted',
            message: '유저가 삭제되었습니다.',
        };
    }
}
