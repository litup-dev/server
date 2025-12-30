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

export function parseJwt(headers: FastifyRequest['headers']): JwtTokenType & { publicId: string } {
    const token = getToken(headers);
    const decoded = jwtDecode<{ [key: string]: any }>(token);
    const { publicId, iat, exp } = decoded;
    if (!publicId) {
        throw new UnauthorizedError('유효하지 않은 토큰입니다.');
    }

    return {
        publicId,
        iat: null,
        exp: null,
    };
}

function getTokenOptional(headers: FastifyRequest['headers']): string | null {
    const authorization = headers['authorization'];

    if (!authorization) {
        return null;
    }

    if (!authorization.startsWith('Bearer ')) {
        return null;
    }

    const token = authorization.replace('Bearer ', '');

    if (!token) {
        return null;
    }
    return token;
}

export function parseJwtOptional(headers: FastifyRequest['headers']): string | null {
    const token = getTokenOptional(headers);

    if (!token) {
        return null;
    }

    try {
        const decoded = jwtDecode<{ [key: string]: any }>(token);
        const { publicId } = decoded;
        return publicId ? String(publicId) : null;
    } catch {
        return null;
    }
}
