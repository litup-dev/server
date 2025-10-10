import path from 'path'
import dotenv from 'dotenv';


if(process.env.NODE_ENV === 'development') {
    dotenv.config({ path: path.resolve('.env.development') });
} else if(process.env.NODE_ENV === 'production') {
    dotenv.config({ path: path.resolve('.env') });
} else {
    throw new Error(`NODE_ENV 미지정 오류`);
}

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = Number(process.env.PORT) || 11000;
export const HOST = process.env.HOST || '0.0.0.0';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const API_PREFIX = process.env.API_PREFIX || '/api';