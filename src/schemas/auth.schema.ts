import { z, generateSchema } from '@/common/zod.js';
import { userSimpleSchema } from './user.schema';
import { successResponseSchema } from './common.schema';

export const createUserSchema = z.object({
    provider: z.string().openapi({
        type: 'string',
        description: '인증 제공자',
        example: 'google',
    }),
    providerId: z.string().openapi({
        type: 'string',
        description: '인증 제공자 ID',
        example: '123456789',
    }),
    email: z.string().email().openapi({
        type: 'string',
        format: 'email',
        description: '사용자 이메일',
        example: 'user@example.com',
    }),
});

export const accessTokenSchema = z.object({
    accessToken: z.string().openapi({
        type: 'string',
        description: '액세스 토큰',
        example: 'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
});

export const loginSchema = userSimpleSchema.extend({
    accessToken: z.string().openapi({
        type: 'string',
        description: '액세스 토큰',
        example: 'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
});

// 응답 스키마
export const loginRes = successResponseSchema(loginSchema);
export const accessTokenRes = successResponseSchema(accessTokenSchema);
// Json 스키마
export const createUserJson = generateSchema(createUserSchema);
export const loginJson = generateSchema(loginRes);
export const accessTokenJson = generateSchema(accessTokenRes);

// 타입 추출
export type CreateUserType = z.infer<typeof createUserSchema>;
