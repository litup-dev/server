import createError from '@fastify/error';

export const NotFoundError = createError('NOT_FOUND', '%s', 404);
export const ConflictError = createError('CONFLICT', '%s', 409);
export const BadRequestError = createError('BAD_REQUEST', '%s', 400);
export const ForbiddenError = createError('FORBIDDEN', '%s', 403);
export const UnauthorizedError = createError('UNAUTHORIZED', '%s', 401);

// JWT ERROR
export const InvalidTokenError = createError('INVALID_TOKEN', '%s', 401);
export const NoAuthorizationInCookieError = createError(
    'FST_JWT_NO_AUTHORIZATION_IN_COOKIE',
    '헤더에 토큰이 없습니다.',
    10401
);
export const AuthorizationTokenExpiredError = createError(
    'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED',
    '토큰이 만료되었습니다.',
    10401
);
export const AuthorizationTokenUntrustedError = createError(
    'FST_JWT_AUTHORIZATION_TOKEN_UNTRUSTED',
    '토큰이 신뢰할 수 없습니다.',
    10401
);
export const AuthorizationTokenUnsignedError = createError(
    'FAST_JWT_MISSING_SIGNATURE',
    '서명이 누락되었습니다.',
    10401
);
export const NoAuthorizationInHeaderError = createError(
    'FST_JWT_NO_AUTHORIZATION_IN_HEADER',
    '헤더에 토큰이 없습니다.',
    10401
);
export const AuthorizationTokenInvalidError = createError(
    'FST_JWT_AUTHORIZATION_TOKEN_INVALID',
    '토큰이 유효하지 않습니다.',
    10401
);
