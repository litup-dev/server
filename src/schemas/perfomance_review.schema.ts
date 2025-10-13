import { z, generateSchema } from '@/common/zod';
import { paginatedResponseSchema } from '@/schemas/common.schema';

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

// 응답 스키마
export const performReviewListRes = paginatedResponseSchema(performanceReviewSchema);

// JSON Schema
export const performReviewListResJson = generateSchema(performReviewListRes);

// 타입 추출
export type PerformanceReviewType = z.infer<typeof performanceReviewSchema>;
export type PerformanceReviewListType = z.infer<typeof performReviewListRes>;
export type PerformanceReviewListResponseType = z.infer<typeof performanceReviewListResponseSchema>;
