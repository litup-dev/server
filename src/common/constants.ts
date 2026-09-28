import path from 'path';
import dotenv from 'dotenv';

export const NODE_ENV = process.env.NODE_ENV || 'development';

const envFile =
    NODE_ENV === 'production'
        ? '.env'
        : NODE_ENV === 'development'
          ? '.env.local'
          : `.env.${NODE_ENV}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const PORT = Number(process.env.PORT) || 11000;
export const HOST = process.env.HOST || '0.0.0.0';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const API_PREFIX = process.env.API_PREFIX || '/api';
export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
export const REDIS_DATABASE = Number(process.env.REDIS_DATABASE) || 4;
export const JWT_ACCESS_TOKEN_EXPIRES_IN = Number(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN) || 3600;
export const JWT_REFRESH_TOKEN_EXPIRES_IN =
    Number(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN) || 604800;
export const OAUTH_LOGIN_CODE_EXPIRES_IN =
    Number(process.env.OAUTH_LOGIN_CODE_EXPIRES_IN) || 60;
// refreshToken 쿠키 path. API_PREFIX(/api/v1)를 포함해야 실제 요청 경로(/api/v1/auth/refresh)와
// 일치해 브라우저가 쿠키를 전송한다. 예전엔 NODE_ENV별로 '/auth/refresh' | '/'로 나뉘어 있었는데
// 운영에서는 실제 요청 경로와 달라 쿠키가 전송되지 않아 토큰 재발급이 항상 실패했다.
export const REFRESH_TOKEN_COOKIE_PATH = `${API_PREFIX}/auth/refresh`;
export const JWT_TOKEN_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET!;
export const COOKIE_SECRET = process.env.COOKIE_SECRET!;
export const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID!;
export const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET!;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5242880;
export const JWT_DEV_ACCESS_TOKEN = process.env.JWT_DEV_ACCESS_TOKEN || '';
export const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY || '';
