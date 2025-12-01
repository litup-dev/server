import { z, generateSchema } from '@/common/zod.js';
import { successResponseSchema } from '@/schemas/common.schema.js';
import { PrivacyLevel } from '@/types/privacy.types.js';

export const userDefaultSchema = z.object({
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
    updatedAt: z.string().nullable().openapi({
        type: 'string',
        format: 'date-time',
        description: '수정 일시',
        example: '2023-10-01T12:34:56Z',
    }),
    bio: z.string().nullable().openapi({
        type: 'string',
        description: '사용자 소개',
        example: '안녕하세요! 저는 반려동물타조입니다.',
    }),
    profilePath: z.string().nullable().openapi({
        type: 'string',
        format: 'uri',
        description: '프로필 이미지 경로',
        example: 'https://example.com/profile.jpg',
    }),
    email: z.string().email().openapi({
        type: 'string',
        format: 'email',
        description: '사용자 이메일',
        example: 'user@example.com',
    }),
});

export const userInfoSchema = userDefaultSchema.pick({
    id: true,
    nickname: true,
    profilePath: true,
    bio: true,
});

export const userSimpleSchema = userDefaultSchema.pick({
    id: true,
    nickname: true,
    profilePath: true,
});

export const userStatsSchema = z.object({
    attendCount: z.number().int().nonnegative().openapi({
        type: 'number',
        description: '참여한 공연 수',
        example: 42,
    }),
    performReviewCount: z.number().int().nonnegative().openapi({
        type: 'number',
        description: '작성한 공연 한줄평 수',
        example: 15,
    }),
    // 추후 커뮤니티 기능이 들어오면 추가될 예정(ex.게시글 수 등)
});

export const userProfileEditSchema = z.object({
    nickname: z.string().min(3).max(23).openapi({
        type: 'string',
        description: '사용자 닉네임',
        example: '반려동물타조',
    }),
    bio: z.string().max(255).nullable().openapi({
        type: 'string',
        description: '사용자 소개',
        example: '안녕하세요! 저는 반려동물타조입니다.',
    }),
});

// 유저 목록 응답
export const userListResponseSchema = z.object({
    items: z.array(userDefaultSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

// 유저 정보 공개 스키마
export const userPrivacySettingSchema = z
    .object({
        favoriteClubs: z
            .enum([PrivacyLevel.PUBLIC, PrivacyLevel.FRIENDS, PrivacyLevel.PRIVATE])
            .optional()
            .openapi({
                type: 'string',
                description: '관심 클럽 공개 범위',
                example: PrivacyLevel.PUBLIC,
            }),
        attendance: z
            .enum([PrivacyLevel.PUBLIC, PrivacyLevel.FRIENDS, PrivacyLevel.PRIVATE])
            .optional()
            .openapi({
                type: 'string',
                description: '참석 기록 공개 범위',
                example: PrivacyLevel.FRIENDS,
            }),
        performHistory: z
            .enum([PrivacyLevel.PUBLIC, PrivacyLevel.FRIENDS, PrivacyLevel.PRIVATE])
            .optional()
            .openapi({
                type: 'string',
                description: '공연 관람 기록 공개 범위',
                example: PrivacyLevel.PRIVATE,
            }),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: '최소 하나 이상의 설정을 제공해야 합니다.',
    });

// 응답 스키마
export const userDefaultRes = successResponseSchema(userDefaultSchema);
export const userListRes = successResponseSchema(userListResponseSchema);
export const userInfoRes = successResponseSchema(userInfoSchema);
export const userStatsRes = successResponseSchema(userStatsSchema);
export const userPrivacyRes = successResponseSchema(userPrivacySettingSchema);

// Json 스키마
export const userDefaultJson = generateSchema(userDefaultSchema);
export const userInfoJson = generateSchema(userInfoSchema);
export const userInfoResJson = generateSchema(userInfoRes);
export const userStatsResJson = generateSchema(userStatsRes);
export const userProfileEditJson = generateSchema(userProfileEditSchema);
export const userPrivacySettingJson = generateSchema(userPrivacySettingSchema);
export const userPrivacyResJson = generateSchema(userPrivacyRes);

// 타입 추출
export type UserDefaultType = z.infer<typeof userDefaultSchema>;
export type UserInfoType = z.infer<typeof userInfoSchema>;
export type UserSimpleType = z.infer<typeof userSimpleSchema>;
export type UserStatsType = z.infer<typeof userStatsSchema>;
export type UserProfileEditType = z.infer<typeof userProfileEditSchema>;
export type UserPrivacySettingType = z.infer<typeof userPrivacySettingSchema>;
