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
        await redis.set(`refresh_token:${tokenId}`, publicId, 'EX', JWT_REFRESH_TOKEN_EXPIRES_IN);
    }

    async isExistsRefreshToken(tokenId: string): Promise<boolean> {
        const userId = await redis.get(`refresh_token:${tokenId}`);
        return userId ? true : false;
    }

    async deleteRefreshToken(tokenId: string): Promise<void> {
        await redis.del(`refresh_token:${tokenId}`);
    }

    async getNewAccessToken(request: FastifyRequest, reply: FastifyReply): Promise<string | null> {
        try {
            const token = request.cookies['refreshToken'];

            if (!token) {
                throw new InvalidTokenError('리프레시 토큰이 없습니다.');
            }

            const payload = request.server.jwt.verify(token) as {
                publicId: string;
                type: 'refresh';
                jti: string;
            };

            if (payload.type !== 'refresh') {
                throw new InvalidTokenError('유효하지 않은 토큰 타입입니다.');
            }

            const publicId = payload.publicId;
            const jti = payload.jti;

            const refreshTokenExists = await this.isExistsRefreshToken(jti);
            if (!refreshTokenExists) {
                throw new InvalidTokenError('리프레시 토큰이 유효하지 않습니다.');
            }

            // 리프레시 토큰 로테이션
            await this.deleteRefreshToken(jti);
            const newRefreshTokenId = randomUUID();
            const newRefreshToken = this.generateRefreshToken(publicId, newRefreshTokenId);
            await this.saveRefreshToken(newRefreshTokenId, publicId);

            reply.setCookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: NODE_ENV === 'production' ? true : false,
                sameSite: 'lax',
                path: NODE_ENV === 'production' ? '/auth/refresh' : '/',
            });

            return this.generateJwtToken(publicId);
        } catch (err) {
            throw new InvalidTokenError('토큰이 유효하지 않습니다.');
        }
    }
}
