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
