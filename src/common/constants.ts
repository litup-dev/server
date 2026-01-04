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
export const KAKAO_CLIENT_ID = process.env.KAKAO_CLIENT_ID || '';
export const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || '';
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
