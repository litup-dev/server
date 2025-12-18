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

// 클럽 스키마
const clubSchema = z.object({
    id: z.number(),
    name: z.string().nullable(),
    address: z.string().nullable(),
});

// 공연 응답 스키마
export const performanceDefaultSchema = z.object({
    id: z.number(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    performDate: z.string().nullable(),
    bookingPrice: z.number().nullable(),
    onsitePrice: z.number().nullable(),
    bookingUrl: z.string().nullable(),
    isCanceled: z.boolean().nullable(),
    artists: z.array(artistSchema).nullable(),
    snsLinks: z.array(snsLinkSchema).nullable(),
    createdAt: z.string().nullable(),
    club: clubSchema,
    images: z.array(imageSchema).optional().nullable(),
});

export const performCalendarSchema = performanceDefaultSchema.pick({
    id: true,
    title: true,
    performDate: true,
    artists: true,
    images: true,
});

export const performMonthlyByClubSchema = performanceDefaultSchema.pick({
    id: true,
    title: true,
    performDate: true,
    bookingPrice: true,
    onsitePrice: true,
    isCanceled: true,
    description: true,
});

export const performMonthlyListByClubSchema = z.record(
    z.string(),
    z.array(performMonthlyByClubSchema)
);
// 공연 페이지 응답 스키마
export const performanceListResponseSchema = z.object({
    items: z.array(performanceDefaultSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

// 공연 관람기록 조회용 스키마
export const performanceRecordsSchema = performanceDefaultSchema
    .pick({
        id: true,
        title: true,
        performDate: true,
        artists: true,
        createdAt: true,
        images: true,
    })
    .extend({
        club: clubSchema.pick({
            name: true,
        }),
    });

export const getClubPerformancesByMonthSchema = z.object({
    entityId: z.number().int().positive().openapi({
        type: 'number',
        description: '클럽 ID',
        example: 1,
    }),
    month: z
        .string()
        .regex(/^\d{4}-\d{2}$/, '월 조회 포맷 YYYY-MM')
        .openapi({
            type: 'string',
            description: '조회 월, 포맷 YYYY-MM',
            example: '2025-11',
        }),
});

export const getPerformancesCalendarSchema = z.object({
    month: z
        .string()
        .regex(/^\d{4}-\d{2}$/, '월 조회 포맷 YYYY-MM')
        .openapi({
            type: 'string',
            description: '조회 월, 포맷 YYYY-MM',
            example: '2025-11',
        }),
});

export const performanceCalendarItemSchema = z.object({
    id: z.number(),
    clubName: z.string().nullable(),
    performances: z.array(performCalendarSchema),
});

export const performanceCalendarListResponseSchema = z.record(
    z.string(),
    z.array(performanceCalendarItemSchema)
);

// 공연 관람기록 페이지 응답 스키마
export const performanceRecordsListResponseSchema = z.object({
    items: z.array(performanceRecordsSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

// 공연 목록 조회 쿼리 파라미터 스키마
export const getPerformancesByDateRangeSchema = z.object({
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
            enum: ['hongdae', 'seoul', 'busan'],
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
            example: 20,
        }),
});

// 전체 공연 검색 스키마
export const searchPerformancesSchema = z.object({
    keyword: z.string().optional().openapi({
        description: '공연 검색어',
        example: '이영훈',
    }),
    timeFilter: z.enum(['upcoming', 'past']).optional().openapi({
        description: '시간 필터',
        example: 'upcoming',
    }),
    area: z
        .string()
        .optional()
        .openapi({
            description: '지역 필터',
            enum: ['hongdae', 'seoul', 'busan', 'other'],
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
            example: 20,
        }),
});

// 응답 스키마
export const performDetailRes = successResponseSchema(performanceDefaultSchema);
export const performListRes = paginatedResponseSchema(performanceDefaultSchema);
export const performRecordsRes = paginatedResponseSchema(performanceRecordsSchema);
export const performMonthlyByClubRes = successResponseSchema(performMonthlyListByClubSchema);
export const attendRes = successResponseSchema(z.boolean());

// JSON Schema
export const getPerformancesByDateRangeJson = generateSchema(getPerformancesByDateRangeSchema);
export const getPerformancesByMonthJson = generateSchema(getPerformancesCalendarSchema);
export const searchPerformancesJson = generateSchema(searchPerformancesSchema);
export const performanceListResJson = generateSchema(performListRes);
export const performDetailResJson = generateSchema(performDetailRes);
export const performanceRecordsResJson = generateSchema(performRecordsRes);
export const performanceMonthByClubListResJson = generateSchema(performMonthlyByClubRes);

// 타입 추출
export type PerformanceType = z.infer<typeof performanceDefaultSchema>;
export type GetPerformanceByDateRangeType = z.infer<typeof getPerformancesByDateRangeSchema>;
export type GetPerformanceCalendarType = z.infer<typeof getPerformancesCalendarSchema>;
export type getClubPerformancesByMonthType = z.infer<typeof getClubPerformancesByMonthSchema>;
export type SearchPerformancesType = z.infer<typeof searchPerformancesSchema>;
export type PerformanceListResponseType = z.infer<typeof performanceListResponseSchema>;
export type PerformanceCalendarListType = z.infer<typeof performanceCalendarListResponseSchema>;
export type PerformanceRecordsType = z.infer<typeof performanceRecordsListResponseSchema>;
export type PerformanceMonthlyByClubType = z.infer<typeof performMonthlyListByClubSchema>;
