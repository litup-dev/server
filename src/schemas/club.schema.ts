import { z, generateSchema } from '@/common/zod.js';
import { successResponseSchema, paginatedResponseSchema } from '@/schemas/common.schema.js';
import { ClubSearchArea, ClubSortBy } from '@/types/search.types.js';

// 사용자 정보 스키마
const clubUserSchema = z.object({
    id: z.number(),
    nickname: z.string().nullable(),
    profilePath: z.string().nullable(),
});

// 이미지 스키마
const clubImageSchema = z.object({
    id: z.number(),
    filePath: z.string().nullable(),
    isMain: z.boolean().nullable(),
});

// 키워드 스키마
const clubKeywordSchema = z.object({
    id: z.number(),
    name: z.string().nullable(),
    iconPath: z.string().nullable(),
});

// 예정 공연 스키마
const upcomingPerformSchema = z.object({
    id: z.number(),
    title: z.string().nullable(),
    performDate: z.string().nullable(),
});

// 클럽 스키마
export const clubSchema = z.object({
    id: z.number(),
    name: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    description: z.string().nullable(),
    capacity: z.number().nullable(),
    openTime: z.string().nullable(),
    closeTime: z.string().nullable(),
    avgRating: z.number().nullable(),
    reviewCnt: z.number().nullable(),
    favoriteCount: z.number().nullable(),
    createdAt: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    owner: clubUserSchema.optional().nullable(),
    mainImage: clubImageSchema.optional().nullable(),
    images: z.array(clubImageSchema).optional().nullable(),
    keywords: z.array(clubKeywordSchema).optional().nullable(),
    upcomingPerforms: z.array(upcomingPerformSchema).optional().nullable(),
});

// 클럽 정보 간소화 스키마
export const clubSimpleSchema = clubSchema.pick({
    id: true,
    name: true,
    mainImage: true,
});

export const clubSearchSchema = clubSchema.pick({
    id: true,
    name: true,
    address: true,
    mainImage: true,
    latitude: true,
    longitude: true,
    avgRating: true,
    reviewCnt: true,
    favoriteCount: true,
});

// 클럽 목록 조회 쿼리 파라미터 스키마
export const getClubsSchema = z.object({
    searchKey: z.string().nullable().optional().openapi({
        description: '클럽명 키워드',
        example: '제비다방',
    }),
    area: z.nativeEnum(ClubSearchArea).nullable().optional().openapi({
        description: '지역',
        example: 'seoul',
    }),
    latitude: z
        .preprocess((val) => {
            if (typeof val === 'string') return parseFloat(val);
            return val;
        }, z.number().nullable().optional())
        .openapi({
            description: '위도',
            example: 37.5665,
        }),
    longitude: z
        .preprocess((val) => {
            if (typeof val === 'string') return parseFloat(val);
            return val;
        }, z.number().nullable().optional())
        .openapi({
            description: '경도',
            example: 126.978,
        }),
    keywords: z
        .preprocess((val) => {
            if (typeof val === 'string') {
                return val
                    .split(',')
                    .map((id) => parseInt(id.trim()))
                    .filter((id) => !isNaN(id));
            }
            return val;
        }, z.array(z.number()))
        .optional()
        .nullable()
        .openapi({
            description: '키워드 ID 배열 (콤마로 구분)',
            example: [1, 2, 3],
        }),
    sort: z.nativeEnum(ClubSortBy).optional().openapi({
        description: '정렬 기준',
        example: '-reviewCount',
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
        }, z.number().min(1).max(100).default(20))
        .openapi({
            description: '페이징 제한',
            example: 20,
        }),
});

// 클럽 목록 응답 스키마
export const clubListResponseSchema = z.object({
    items: z.array(clubSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

export const clubListSimpleResponseSchema = z.object({
    items: z.array(clubSimpleSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

export const clubSearchResponseSchema = z.object({
    items: z.array(clubSearchSchema),
    total: z.number(),
    offset: z.number(),
    limit: z.number(),
});

// 응답 스키마
export const clubDetailRes = successResponseSchema(clubSchema);
export const clubListRes = paginatedResponseSchema(clubSchema);
export const clubListSimpleRes = paginatedResponseSchema(clubSimpleSchema);
export const clubSearchRes = paginatedResponseSchema(clubSearchSchema);
export const toggleFavoriteRes = successResponseSchema(z.boolean());

// JSON Schema
export const getClubsJson = generateSchema(getClubsSchema);
export const clubDetailResJson = generateSchema(clubDetailRes);
export const clubListResJson = generateSchema(clubListRes);
export const clubSearchResJson = generateSchema(clubSearchRes);
export const clubListSimpleResJson = generateSchema(clubListSimpleRes);
export const toggleFavoriteResJson = generateSchema(toggleFavoriteRes);

// 타입 추출
export type ClubType = z.infer<typeof clubSchema>;
export type ClubSearchType = z.infer<typeof clubSearchSchema>;
export type GetClubsType = z.infer<typeof getClubsSchema>;
export type ClubDetailResponseType = z.infer<typeof clubDetailRes>;
export type ClubListResponseType = z.infer<typeof clubListResponseSchema>;
export type ClubListSimpleResponseType = z.infer<typeof clubListSimpleResponseSchema>;
export type ClubSearchResponseType = z.infer<typeof clubSearchResponseSchema>;
