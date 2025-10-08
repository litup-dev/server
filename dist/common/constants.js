import dotenv from 'dotenv';
dotenv.config();
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const PORT = Number(process.env.PORT) || 3000;
export const HOST = process.env.HOST || '0.0.0.0';
export const DATABASE_URL = process.env.DATABASE_URL || '';
export const API_PREFIX = process.env.API_PREFIX || '/api';
//# sourceMappingURL=constants.js.map