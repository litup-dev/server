import { z, generateSchema } from '@/common/zod';
import { paginatedResponseSchema, successResponseSchema } from '@/schemas/common.schema';

export const performanceReviewSchema = z.object({
    id: z.number(),
    content: z.string().min(1).max(100),
    likeCount: z.number().default(0),
    createdAt: z.string().nullable(),
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
    content: z.string().min(1).max(100).openapi({
        description: '한줄평 내용',
        example: '정말 좋은 공연이었어요!',
    }),
});

// 응답 스키마
export const performanceReviewListRes = paginatedResponseSchema(performanceReviewSchema);
export const performanceReviewRes = successResponseSchema(performanceReviewSchema);

// JSON Schema
export const performanceReviewListResJson = generateSchema(performanceReviewListRes);
export const performanceReviewResJson = generateSchema(performanceReviewRes);
export const createPerformanceReviewJson = generateSchema(createPerformanceReviewSchema);

// 타입 추출
export type PerformanceReviewType = z.infer<typeof performanceReviewSchema>;
export type PerformanceReviewListType = z.infer<typeof performanceReviewListRes>;
export type PerformanceReviewListResponseType = z.infer<typeof performanceReviewListResponseSchema>;
