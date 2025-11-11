import { z, generateSchema } from '@/common/zod.js';

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

// Json 스키마
export const createUserJson = generateSchema(createUserSchema);

// 타입 추출
export type CreateUserType = z.infer<typeof createUserSchema>;
