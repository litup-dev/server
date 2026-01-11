import { z, generateSchema } from '@/common/zod.js';
import { paginatedResponseSchema, successResponseSchema } from '@/schemas/common.schema.js';
import { PerformanceReviewSortBy } from '@/types/search.types';

export const performanceReviewSchema = z.object({
    id: z.number(),
    content: z.string().min(1).max(100),
    likeCount: z.number().default(0),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    user: z.object({
        id: z.number(),
        nickname: z.string().nullable(),
        profile_path: z.string().nullable(),
    }),
    performId: z.number().optional().openapi({
        description: '공연 ID',
        example: 1,
    }),
    performTitle: z.string().nullable().optional().openapi({
        description: '공연 제목',
        example: 'Indie Night',
    }),
    isLiked: z.boolean().optional().openapi({
        description: '현재 사용자가 해당 한줄평을 좋아요했는지 여부',
        example: true,
    }),
});

export const performanceReviewForUserSchema = performanceReviewSchema.extend({
    performId: z.number(),
    performTitle: z.string().nullable(),
});

export const performanceReviewListSchema = z.object({
    items: z.array(performanceReviewSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

export const performanceReviewListForUserSchema = z.object({
    items: z.array(performanceReviewForUserSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

export const performanceReviewListResponseWithoutUserInfoSchema = z.object({
    items: z.array(performanceReviewSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

export const getPerformanceReviewsByUserSchema = z.object({
    sort: z.nativeEnum(PerformanceReviewSortBy).optional().openapi({
        description: '정렬 기준',
        example: '-createdAt',
    }),
    offset: z
        .preprocess((val) => {
            if (typeof val === 'string') return parseInt(val, 10);
            return val;
        }, z.number().min(0).default(0))
        .openapi({
            description: '페이징 오프셋',
            example: 0,
        }),
    limit: z
        .preprocess((val) => {
            if (typeof val === 'string') return parseInt(val, 10);
            return val;
        }, z.number().min(1).max(100).default(10))
        .openapi({
            description: '페이징 제한',
            example: 10,
        }),
});

export const createPerformanceReviewSchema = z.object({
    content: z
        .string()
        .min(1)
        .max(100)
        .openapi({
            description: '한줄평 내용',
            example: { content: '정말 좋은 공연이었어요!' },
        }),
});

export const performanceReviewLikeResponseSchema = z.object({
    reviewId: z.number().openapi({
        description: '반영된 한줄평 ID',
        example: 1,
    }),
    totalLikeCount: z.number().openapi({
        description: '반영된 좋아요 수',
        example: 10,
    }),
});

// 응답 스키마
export const performanceReviewListRes = paginatedResponseSchema(performanceReviewSchema);
export const performanceReviewListForUserRes = paginatedResponseSchema(
    performanceReviewForUserSchema
);
export const performanceReviewRes = successResponseSchema(performanceReviewSchema);
export const performanceReviewLikeRes = successResponseSchema(performanceReviewLikeResponseSchema);

// JSON Schema
export const performanceReviewListResJson = generateSchema(performanceReviewListRes);
export const performanceReviewListForUserResJson = generateSchema(performanceReviewListForUserRes);
export const performanceReviewResJson = generateSchema(performanceReviewRes);
export const createPerformanceReviewJson = generateSchema(createPerformanceReviewSchema);
export const performanceReviewLikeResJson = generateSchema(performanceReviewLikeRes);
export const getPerformanceReviewsByUserJson = generateSchema(getPerformanceReviewsByUserSchema);

// 타입 추출
export type PerformanceReviewType = z.infer<typeof performanceReviewSchema>;
export type PerformanceReviewListType = z.infer<typeof performanceReviewListRes>;
export type PerformanceReviewListResponseType = z.infer<typeof performanceReviewListSchema>;
export type PerformanceReviewListForUserType = z.infer<typeof performanceReviewListForUserSchema>;
export type PerformanceReviewLikeResponseType = z.infer<typeof performanceReviewLikeResponseSchema>;
export type GetPerformanceReviewsByUserType = z.infer<typeof getPerformanceReviewsByUserSchema>;
