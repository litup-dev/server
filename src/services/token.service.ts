import { redis } from '@/configs/redis';
import { FastifyInstance } from 'fastify';

export class TokenService {
    constructor(private fastify: FastifyInstance) {}
    generateJwtToken(userId: number): string {
        return this.fastify.jwt.sign(
            {
                sub: userId,
                type: 'access',
            },
            {
                expiresIn: '1h',
            }
        );
    }

    generateRefreshToken(userId: number, tokenId: string): string {
        return this.fastify.jwt.sign(
            {
                sub: userId,
                type: 'refresh',
                jti: tokenId,
            },
            {
                expiresIn: '7d',
            }
        );
    }

    async saveRefreshToken(tokenId: string, userId: number, ttlSeconds: number): Promise<void> {
        await redis.set(`refresh_token:${tokenId}`, String(userId), 'EX', ttlSeconds);
    }

    async getUserId(tokenId: string): Promise<number | null> {
        const userId = await redis.get(`refresh_token:${tokenId}`);
        return userId ? Number(userId) : null;
    }

    async deleteRefreshToken(tokenId: string): Promise<void> {
        await redis.del(`refresh_token:${tokenId}`);
    }
}
