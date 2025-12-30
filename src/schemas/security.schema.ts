import { z, generateSchema } from '@/common/zod.js';

export const jwtTokenSchema = z.object({
    publicId: z.string().nullable().openapi({
        type: 'string',
        description: '사용자 고유 ID',
        example: 'XXXXXXXXXXXXX',
    }),
    iat: z.number().int().nullable().openapi({
        type: 'integer',
        description: '토큰 발급 시간 (Issued At)',
        example: 1625247600,
    }),
    exp: z.number().int().nullable().openapi({
        type: 'integer',
        description: '토큰 만료 시간 (Expiration Time)',
        example: 1625251200,
    }),
});

// 타입 추출
export type JwtTokenType = z.infer<typeof jwtTokenSchema>;
