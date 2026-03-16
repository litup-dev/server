import {
    JWT_ACCESS_TOKEN_EXPIRES_IN,
    JWT_REFRESH_TOKEN_EXPIRES_IN,
    NODE_ENV,
} from '@/common/constants';
import { InvalidTokenError } from '@/common/error';
import { redis } from '@/configs/redis';
import { randomUUID } from 'crypto';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export class TokenService {
    constructor(private fastify: FastifyInstance) {}

    generateJwtToken(publicId: string): string {
        return this.fastify.jwt.sign(
            {
                publicId,
                type: 'access',
            },
            {
                expiresIn: NODE_ENV === 'development' ? '30000d' : JWT_ACCESS_TOKEN_EXPIRES_IN,
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
                path: NODE_ENV === 'production' ? '/auth/refresh' : '/',
            });

            reply.setCookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: NODE_ENV === 'production' ? true : false,
                sameSite: 'lax',
                path: '/',
            });
        } catch (err) {
            this.fastify.log.info('토큰 재발급 실패');
            throw new InvalidTokenError('토큰이 유효하지 않습니다.');
        }
    }
}
