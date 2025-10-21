import { z, generateSchema } from '@/common/zod.js';
import { paginatedResponseSchema, successResponseSchema } from '@/schemas/common.schema.js';

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
});

export const performanceReviewListResponseSchema = z.object({
    items: z.array(performanceReviewSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
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
export const performanceReviewRes = successResponseSchema(performanceReviewSchema);
export const performanceReviewLikeRes = successResponseSchema(performanceReviewLikeResponseSchema);

// JSON Schema
export const performanceReviewListResJson = generateSchema(performanceReviewListRes);
export const performanceReviewResJson = generateSchema(performanceReviewRes);
export const createPerformanceReviewJson = generateSchema(createPerformanceReviewSchema);
export const performanceReviewLikeResJson = generateSchema(performanceReviewLikeRes);

// 타입 추출
export type PerformanceReviewType = z.infer<typeof performanceReviewSchema>;
export type PerformanceReviewListType = z.infer<typeof performanceReviewListRes>;
export type PerformanceReviewListResponseType = z.infer<typeof performanceReviewListResponseSchema>;
export type PerformanceReviewLikeResponseType = z.infer<typeof performanceReviewLikeResponseSchema>;
