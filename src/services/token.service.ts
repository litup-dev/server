import {
    JWT_ACCESS_TOKEN_EXPIRES_IN,
    JWT_REFRESH_TOKEN_EXPIRES_IN,
    NODE_ENV,
    OAUTH_LOGIN_CODE_EXPIRES_IN,
    REFRESH_TOKEN_COOKIE_PATH,
} from '@/common/constants';
import { InvalidTokenError } from '@/common/error';
import { redis } from '@/configs/redis';
import { randomUUID } from 'crypto';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// 개발환경에서는 access token을 사실상 만료되지 않게 발급한다 (초 단위: 30000일).
const DEV_ACCESS_TOKEN_EXPIRES_IN_SECONDS = 30000 * 24 * 60 * 60;

export class TokenService {
    constructor(private fastify: FastifyInstance) {}

    // accessToken 쿠키 maxAge를 실제 토큰 만료 시간과 맞추기 위한 값 (초 단위).
    // 쿠키가 토큰보다 오래 살아남으면, 만료된 토큰이 계속 전송되어 공개 페이지에서도
    // 401이 발생해 /login으로 튕기는 문제가 생긴다. (routes/auth.ts의 로그인 라우트에서도 사용)
    getAccessTokenExpiresInSeconds(): number {
        return NODE_ENV === 'development'
            ? DEV_ACCESS_TOKEN_EXPIRES_IN_SECONDS
            : JWT_ACCESS_TOKEN_EXPIRES_IN;
    }

    generateJwtToken(publicId: string): string {
        return this.fastify.jwt.sign(
            {
                publicId,
                type: 'access',
            },
            {
                expiresIn: this.getAccessTokenExpiresInSeconds(),
            }
        );
    }

    generateRefreshToken(publicId: string, tokenId: string): string {
        return this.fastify.jwt.sign(
            {
                publicId,
                type: 'refresh',
                jti: tokenId,
            },
            {
                expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
            }
        );
    }

    async saveRefreshToken(tokenId: string, publicId: string): Promise<void> {
        this.fastify.log.info(`토큰 저장 :  ${publicId} - ${tokenId}`);
        await redis.set(`refresh_token:${tokenId}`, publicId, 'EX', JWT_REFRESH_TOKEN_EXPIRES_IN);
        this.fastify.log.info('토큰 저장 완료');
    }

    async isExistsRefreshToken(tokenId: string): Promise<boolean> {
        const userId = await redis.get(`refresh_token:${tokenId}`);
        return userId ? true : false;
    }

    async deleteRefreshToken(tokenId: string): Promise<void> {
        this.fastify.log.info(`토큰 삭제 :  ${tokenId}`);
        await redis.del(`refresh_token:${tokenId}`);
        this.fastify.log.info('토큰 삭제 성공');
    }

    async saveLoginCode(code: string, publicId: string): Promise<void> {
        await redis.set(`login_code:${code}`, publicId, 'EX', OAUTH_LOGIN_CODE_EXPIRES_IN);
    }

    async consumeLoginCode(code: string): Promise<string | null> {
        const publicId = await redis.get(`login_code:${code}`);
        if (publicId) {
            await redis.del(`login_code:${code}`);
        }
        return publicId;
    }

    async getNewAccessToken(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const token = request.cookies['refreshToken'];

            if (!token) {
                this.fastify.log.info('리프레시 토큰이 없습니다.');
                throw new InvalidTokenError('리프레시 토큰이 없습니다.');
            }

            const payload = request.server.jwt.verify(token) as {
                publicId: string;
                type: 'refresh';
                jti: string;
            };

            if (payload.type !== 'refresh') {
                this.fastify.log.info('유효하지 않은 토큰 타입입니다.');
                throw new InvalidTokenError('유효하지 않은 토큰 타입입니다.');
            }

            const publicId = payload.publicId;
            const jti = payload.jti;

            const refreshTokenExists = await this.isExistsRefreshToken(jti);
            if (!refreshTokenExists) {
                this.fastify.log.info('리프레시 토큰이 유효하지 않습니다.');
                throw new InvalidTokenError('리프레시 토큰이 유효하지 않습니다.');
            }

            // 리프레시 토큰 로테이션
            await this.deleteRefreshToken(jti);
            const newRefreshTokenId = randomUUID();
            const newRefreshToken = this.generateRefreshToken(publicId, newRefreshTokenId);
            const newAccessToken = this.generateJwtToken(publicId);
            await this.saveRefreshToken(newRefreshTokenId, publicId);

            reply.setCookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: NODE_ENV === 'production' ? true : false,
                sameSite: 'lax',
                path: REFRESH_TOKEN_COOKIE_PATH,
                maxAge: JWT_REFRESH_TOKEN_EXPIRES_IN,
            });

            reply.setCookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: NODE_ENV === 'production' ? true : false,
                sameSite: 'lax',
                path: '/',
                maxAge: this.getAccessTokenExpiresInSeconds(),
            });
        } catch (err) {
            this.fastify.log.info('토큰 재발급 실패');
            // 재발급 실패(리프레시 토큰 만료/무효/재사용 등) 시 쿠키를 지워서
            // 죽은 쿠키가 계속 전송되어 공개 페이지에서도 401 → /login 리다이렉트가
            // 반복되는 문제를 막는다.
            reply.clearCookie('refreshToken', { path: REFRESH_TOKEN_COOKIE_PATH });
            reply.clearCookie('accessToken', { path: '/' });
            reply.clearCookie('isLogin', { path: '/' });
            throw new InvalidTokenError('토큰이 유효하지 않습니다.');
        }
    }
}
