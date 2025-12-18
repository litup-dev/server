import { UnauthorizedError } from '@/common/error.js';
import { JwtTokenType } from '@/schemas/security.schema.js';
import { FastifyRequest } from 'fastify';
import { jwtDecode } from 'jwt-decode';

function getToken(headers: FastifyRequest['headers']): string {
    const authorization = headers['authorization'];

    if (!authorization) {
        throw new UnauthorizedError('헤더가 존재하지 않습니다.');
    }

    if (!authorization.startsWith('Bearer ')) {
        throw new UnauthorizedError('올바른 형식의 토큰이 아닙니다.');
    }

    const token = authorization.replace('Bearer ', '');

    if (!token) {
        throw new UnauthorizedError('토큰이 존재하지 않습니다.');
    }
    return token;
}

export function parseJwt(headers: FastifyRequest['headers'], isNullable: boolean): JwtTokenType {
    const token = getToken(headers);
    const decoded = jwtDecode<{ [key: string]: any }>(token);
    const { userId, iat, exp } = decoded;
    if (isNullable === false) {
        if (!userId) {
            throw new UnauthorizedError('유효하지 않은 토큰입니다.');
        }
    }

    return {
        userId: Number(userId) ?? null,
        iat: null,
        exp: null,
    };
}
