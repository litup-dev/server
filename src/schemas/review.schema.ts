import { z, generateSchema } from '@/common/zod.js';
import { successResponseSchema, paginatedResponseSchema } from '@/schemas/common.schema.js';

// 리뷰 키워드 스키마
const reviewKeywordSchema = z.object({
    id: z.number(),
    name: z.string().nullable(),
});

// 사용자 정보 스키마
const reviewUserSchema = z.object({
    id: z.number(),
    nickname: z.string().nullable(),
    profilePath: z.string().nullable(),
});

// 이미지 스키마
const reviewImageSchema = z.object({
    id: z.number(),
    filePath: z.string().nullable(),
    isMain: z.boolean().nullable(),
});

// 리뷰 스키마
export const reviewSchema = z.object({
    id: z.number(),
    clubId: z.number().nullable(),
    userId: z.number().nullable(),
    rating: z.number().nullable(),
    content: z.string().nullable(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    user: reviewUserSchema.optional().nullable(),
    keywords: z.array(reviewKeywordSchema).optional().nullable(),
    images: z.array(reviewImageSchema).optional().nullable(),
});

// 리뷰 생성 스키마
export const createReviewSchema = z.object({
    rating: z
        .number()
        .min(0, '평점은 최소 0점이어야 합니다')
        .max(5, '평점은 최대 5점이어야 합니다')
        .openapi({
            description: '공연 평점 (0-5)',
            example: 4.5,
        }),
    content: z.string().max(500, '리뷰 내용은 최대 500자까지 입력 가능합니다').optional().openapi({
        description: '리뷰 내용',
        example: '정말 멋진 공연이었습니다!',
    }),
    keywords: z
        .array(z.number().int().positive())
        .optional()
        .openapi({
            description: '키워드 ID 배열',
            example: [1, 2, 3],
        }),
});

// 리뷰 수정 스키마
export const updateReviewSchema = z.object({
    rating: z
        .number()
        .min(0, '평점은 최소 0점이어야 합니다')
        .max(5, '평점은 최대 5점이어야 합니다')
        .optional()
        .openapi({
            description: '공연 평점 (0-5)',
            example: 4.5,
        }),
    content: z.string().max(500, '리뷰 내용은 최대 500자까지 입력 가능합니다').optional().openapi({
        description: '리뷰 내용',
        example: '정말 멋진 공연이었습니다!',
    }),
    keywords: z
        .array(z.number().int().positive())
        .optional()
        .openapi({
            description: '키워드 ID 배열',
            example: [1, 2, 3],
        }),
});

// 리뷰 목록 조회 쿼리 파라미터 스키마
export const getReviewsSchema = z.object({
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

// 리뷰 목록 응답 스키마
export const reviewListResponseSchema = z.object({
    items: z.array(reviewSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

// 응답 스키마
export const reviewDetailRes = successResponseSchema(reviewSchema);
export const reviewListRes = paginatedResponseSchema(reviewSchema);

// JSON Schema
export const createReviewJson = generateSchema(createReviewSchema);
export const updateReviewJson = generateSchema(updateReviewSchema);
export const getReviewsJson = generateSchema(getReviewsSchema);
export const reviewDetailResJson = generateSchema(reviewDetailRes);
export const reviewListResJson = generateSchema(reviewListRes);

// 타입 추출
export type ReviewType = z.infer<typeof reviewSchema>;
export type CreateReviewType = z.infer<typeof createReviewSchema>;
export type UpdateReviewType = z.infer<typeof updateReviewSchema>;
export type GetReviewsType = z.infer<typeof getReviewsSchema>;
export type ReviewDetailResponseType = z.infer<typeof reviewDetailRes>;
export type ReviewListResponseType = z.infer<typeof reviewListResponseSchema>;
