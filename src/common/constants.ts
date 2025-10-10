import dotenv from 'dotenv';

// Allow overriding the dotenv path via DOTENV_CONFIG_PATH, otherwise pick `.env` or `.env.<NODE_ENV>`.
const nodeEnv = process.env.NODE_ENV || 'development';
const envPath = process.env.DOTENV_CONFIG_PATH ?? `.env.${nodeEnv}`;

// Try to load the environment file. If the specific file doesn't exist, this will silently fall back
// to existing process.env values (dotenv doesn't throw on missing files).
dotenv.config({ path: envPath });

export const NODE_ENV = nodeEnv;
export const PORT = Number(process.env.PORT) || 3000;
export const HOST = process.env.HOST || '0.0.0.0';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const API_PREFIX = process.env.API_PREFIX || '/api';