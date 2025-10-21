import { z, generateSchema } from '@/common/zod.js';
import { successResponseSchema, paginatedResponseSchema } from '@/schemas/common.schema.js';

// 아티스트 스키마
const artistSchema = z.object({
    name: z.string(),
});

// SNS 링크 스키마
const snsLinkSchema = z.object({
    instagram: z.string().optional(),
    youtube: z.string().optional(),
});

// 이미지 스키마
const imageSchema = z.object({
    id: z.number(),
    filePath: z.string().nullable(),
    isMain: z.boolean().nullable(),
});

// 공연 응답 스키마
export const performanceSchema = z.object({
    id: z.number(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    performDate: z.string().nullable(),
    price: z.number().nullable(),
    isCanceled: z.boolean().nullable(),
    artists: z.array(artistSchema).nullable(),
    snsLinks: z.array(snsLinkSchema).nullable(),
    createdAt: z.string().nullable(),
    club: z.object({
        id: z.number(),
        name: z.string().nullable(),
        address: z.string().nullable(),
    }),
    images: z.array(imageSchema).optional().nullable(),
});

// 공연 페이지 응답 스키마
export const performanceListResponseSchema = z.object({
    items: z.array(performanceSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

// 공연 관람기록 조회용 스키마
export const performanceRecordsSchema = z.object({
    id: z.number(),
    title: z.string().nullable(),
    performDate: z.string().nullable(),
    artists: z.array(artistSchema).nullable(),
    createdAt: z.string().nullable(),
    club: z.object({
        name: z.string().nullable(),
    }),
    images: z.array(imageSchema).optional().nullable(),
});

// 공연 관람기록 페이지 응답 스키마
export const performanceRecordsListResponseSchema = z.object({
    items: z.array(performanceRecordsSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

// 공연 목록 조회 쿼리 파라미터 스키마
export const getPerformanceByDateRangeSchema = z.object({
    startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, '기간 조회 포맷 YYYY-MM-DD')
        .openapi({
            type: 'string',
            description: '조회 시작 날짜, 포맷 YYYY-MM-DD',
            example: '2025-01-01',
        }),
    endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, '기간 조회 포맷 YYYY-MM-DD')
        .openapi({
            type: 'string',
            description: '조회 종료 날짜, 포맷 YYYY-MM-DD',
            example: '2025-12-31',
        }),
    isFree: z
        .preprocess((val) => {
            if (typeof val === 'string') {
                const v = val.toLowerCase();
                if (v === 'true') return true;
                if (v === 'false') return false;
            }
            return val;
        }, z.boolean().optional())
        .openapi({
            description: '무료 공연 여부 필터',
            enum: [true, false],
            example: false,
        }),
    area: z
        .string()
        .optional()
        .openapi({
            description: '지역 필터',
            enum: ['홍대', '서울', '부산'],
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
        }, z.number().min(1).max(1000).default(1000))
        .openapi({
            description: '페이징 제한',
            example: 1000,
        }),
});

// 응답 스키마
export const performDetailRes = successResponseSchema(performanceSchema);
export const performListRes = paginatedResponseSchema(performanceSchema);
export const performRecordsRes = paginatedResponseSchema(performanceRecordsSchema);
export const attendRes = successResponseSchema(z.boolean());

// JSON Schema
export const getPerformanceByDateRangeJson = generateSchema(getPerformanceByDateRangeSchema);
export const performanceListResJson = generateSchema(performListRes);
export const performDetailResJson = generateSchema(performDetailRes);
export const performanceRecordsResJson = generateSchema(performRecordsRes);

// 타입 추출
export type PerformanceType = z.infer<typeof performanceSchema>;
export type PerformanceListType = z.infer<typeof performListRes>;
export type GetPerformanceByDateRangeType = z.infer<typeof getPerformanceByDateRangeSchema>;
export type PerformanceListResponseType = z.infer<typeof performanceListResponseSchema>;
export type PerformanceRecordsType = z.infer<typeof performanceRecordsListResponseSchema>;
