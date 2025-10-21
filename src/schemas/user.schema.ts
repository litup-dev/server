import { z, generateSchema } from '@/common/zod.js';
import { successResponseSchema, paginatedResponseSchema } from '@/schemas/common.schema.js';

export const userSchema = z.object({
    id: z.number().int().positive().openapi({
        type: 'number',
        description: '사용자 ID',
        example: 1,
    }),
    nickname: z.string().nullable().openapi({
        type: 'string',
        description: '사용자 닉네임',
        example: '반려동물타조',
    }),
    createdAt: z.string().nullable().openapi({
        type: 'string',
        format: 'date-time',
        description: '생성 일시',
        example: '2023-10-01T12:34:56Z',
    }),
    bio: z.string().nullable().openapi({
        type: 'string',
        description: '사용자 소개',
        example: '안녕하세요! 저는 반려동물타조입니다.',
    }),
    updatedAt: z.string().nullable().openapi({
        type: 'string',
        format: 'date-time',
        description: '수정 일시',
        example: '2023-10-01T12:34:56Z',
    }),
    profilePath: z.string().nullable().openapi({
        type: 'string',
        format: 'uri',
        description: '프로필 이미지 경로',
        example: 'https://example.com/profile.jpg',
    }),
});

export const userInfoSchema = z.object({
    id: z.number().int().positive().openapi({
        type: 'number',
        description: '사용자 ID',
        example: 1,
    }),
    nickname: z.string().nullable().openapi({
        type: 'string',
        description: '사용자 닉네임',
        example: '반려동물타조',
    }),
    profilePath: z.string().nullable().openapi({
        type: 'string',
        format: 'uri',
        description: '프로필 이미지 경로',
        example: 'https://example.com/profile.jpg',
    }),
    bio: z.string().nullable().openapi({
        type: 'string',
        description: '사용자 소개',
        example: '안녕하세요! 저는 반려동물타조입니다.',
    }),
});

// 유저 목록 응답
export const userListResponseSchema = z.object({
    items: z.array(userSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

// 응답 스키마
export const userRes = successResponseSchema(userSchema);
export const userListRes = successResponseSchema(userListResponseSchema);
export const userInfoRes = successResponseSchema(userInfoSchema);

// Json 스키마
export const userJson = generateSchema(userSchema);
export const userInfoJson = generateSchema(userInfoSchema);

// 타입 추출
export type UserType = z.infer<typeof userSchema>;
export type UserInfoType = z.infer<typeof userInfoSchema>;
