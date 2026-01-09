import { NotFoundError } from '@/common/error.js';
import { CreateUserType } from '@/schemas/auth.schema.js';
import { OperationSuccessType } from '@/schemas/common.schema.js';
import { UserSimpleType } from '@/schemas/user.schema.js';
import { PrismaClient } from '@prisma/client';
import { NicknameService } from '@/services/nickname.service.js';
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { getTsid } from 'tsid-ts';

export class AuthService {
    constructor(private prisma: PrismaClient) {}

    async verifyUser(params: CreateUserType): Promise<UserSimpleType> {
        const { provider, providerId, email } = params;

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
            // 만약 공용아이디가 0이면 새로 tsid 발급 후 DB 저장
            // 기존 유저때문에 이 과정을 거침.
            if (existingUser.public_id && existingUser.public_id == '0') {
                const tsid = getTsid().toString();

                await this.prisma.user_tb.update({
                    where: {
                        id: existingUser.id,
                    },
                    data: {
                        public_id: tsid,
                    },
                });

                return {
                    publicId: tsid,
                    nickname: existingUser.nickname,
                    profilePath: existingUser.profile_path ?? null,
                };
            } else {
                return {
                    publicId: existingUser.public_id,
                    nickname: existingUser.nickname,
                    profilePath: existingUser.profile_path ?? null,
                };
            }
        }

        // 추후 닉네임 로직 생성필요
        const nicknameService = new NicknameService(this.prisma);
        const generateNickname = await nicknameService.generateNickname(email);
        const publicId = getTsid().toString();

        const newUser = await this.prisma.user_tb.create({
            data: {
                public_id: publicId,
                social_id: socialCode.id,
                nickname: generateNickname,
                provider_id: providerId,
                email: email,
            },
            select: {
                id: true,
                public_id: true,
                nickname: true,
                profile_path: true,
            },
        });

        // 사용자 환경설정 초기값 생성
        await this.prisma.user_settings_tb.create({
            data: {
                user_id: newUser.id,
            },
        });

        return {
            publicId: newUser.public_id,
            nickname: newUser.nickname,
            profilePath: newUser.profile_path ?? null,
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

    async registerForKakao(
        fastify: FastifyInstance,
        request: FastifyRequest
    ): Promise<UserSimpleType> {
        fastify.log.info('카카오 OAuth 콜백 처리 시작');
        const { token } =
            await fastify.kakaoOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

        const kakaoUserResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${token.access_token}`,
            },
        });

        /**
         * KAKAO USER INFO (2026-01-03 기준)
         * Kakao user info: {
         *      id: 1234567899,
         *      connected_at: '2025-11-19T08:51:47Z',
         *      kakao_account: {
         *          has_email: true,
         *          email_needs_agreement: false,
         *          is_email_valid: true,
         *          is_email_verified: true,
         *          email: '{email address}',
         *      }
         *  }
         */

        const info = await kakaoUserResponse.json();

        const providerId = String(info.id);
        const provider = 'kakao';
        const email = info.kakao_account.email;

        const verifyUser = await this.verifyUser({
            provider,
            providerId,
            email,
        });

        return {
            publicId: verifyUser.publicId,
            nickname: verifyUser.nickname,
            profilePath: verifyUser.profilePath,
        };
    }

    async registerForGoogle(
        fastify: FastifyInstance,
        request: FastifyRequest
    ): Promise<UserSimpleType> {
        fastify.log.info('구글 OAuth 콜백 처리 시작');
        const { token } =
            await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

        const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${token.access_token}`,
            },
        });

        /**
         * Google USER INFO (2026-01-03 기준)
         *  Google user info: {
         *    id: '114273003388577675068',
         *    email: 'xxxxxxxxx@gmail.com',
         *    verified_email: true,
         *    name: 'Tazo Companion',
         *    given_name: 'Tazo',
         *    family_name: 'Companion',
         *    picture: 'https://lh3.googleusercontent.com/a/ACg8ocL7tuyH50Vi4YJVe4OJPARWuDBOMJ7aggusr9y-Ml4zoUMqkuU=s96-c'
         *  }
         */

        const info = await googleUserResponse.json();

        const providerId = String(info.id);
        const provider = 'google';
        const email = info.email;

        const verifyUser = await this.verifyUser({
            provider,
            providerId,
            email,
        });

        return {
            publicId: verifyUser.publicId,
            nickname: verifyUser.nickname,
            profilePath: verifyUser.profilePath,
        };
    }
}
