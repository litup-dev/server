import { z, generateSchema } from '@/common/zod.js';
import {
    successResponseSchema,
    paginatedResponseSchema,
    idParamSchema,
    defaultPaginationSchema,
} from '@/schemas/common.schema.js';

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
    price: z.number().nullable(),
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
    createdAt: z.string().nullable(),
    owner: clubUserSchema.optional().nullable(),
    mainImage: clubImageSchema.optional().nullable(),
    images: z.array(clubImageSchema).optional().nullable(),
    keywords: z.array(clubKeywordSchema).optional().nullable(),
    upcomingPerforms: z.array(upcomingPerformSchema).optional().nullable(),
});

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

// 클럽 생성 스키마
export const createClubSchema = z.object({
    name: z
        .string()
        .min(1, '이름은 최소 1자 이상이어야 합니다')
        .max(20, '이름은 최대 20자까지 입력 가능합니다')
        .openapi({
            description: '클럽 이름',
            example: '클럽 벨벳',
        }),
    phone: z.string().max(15, '전화번호는 최대 15자까지 입력 가능합니다').optional().openapi({
        description: '클럽 전화번호',
        example: '02-1234-5678',
    }),
    address: z.string().max(50, '주소는 최대 50자까지 입력 가능합니다').optional().openapi({
        description: '클럽 주소',
        example: '서울시 마포구 홍대입구',
    }),
    description: z.string().optional().openapi({
        description: '클럽 설명',
        example: '홍대의 대표 클럽',
    }),
    capacity: z.number().int().min(1, '수용 인원은 최소 1명 이상이어야 합니다').optional().openapi({
        description: '수용 인원',
        example: 500,
    }),
    openTime: z
        .string()
        .regex(timeRegex, 'openTime은 HH:mm:ss 형식이어야 합니다')
        .optional()
        .nullable()
        .openapi({
            description: '클럽 오픈 시간 (HH:mm:ss)',
            example: '21:00:00',
        }),
    closeTime: z
        .string()
        .regex(timeRegex, 'closeTime은 HH:mm:ss 형식이어야 합니다')
        .optional()
        .nullable()
        .openapi({
            description: '클럽 종료 시간 (HH:mm:ss)',
            example: '05:00:00',
        }),
});

// 클럽 수정 스키마
export const updateClubSchema = z.object({
    name: z
        .string()
        .min(1, '이름은 최소 1자 이상이어야 합니다')
        .max(20, '이름은 최대 20자까지 입력 가능합니다')
        .optional()
        .openapi({
            description: '클럽 이름',
            example: '클럽 벨벳',
        }),
    phone: z.string().max(15, '전화번호는 최대 15자까지 입력 가능합니다').optional().openapi({
        description: '클럽 전화번호',
        example: '02-1234-5678',
    }),
    address: z.string().max(50, '주소는 최대 50자까지 입력 가능합니다').optional().openapi({
        description: '클럽 주소',
        example: '서울시 마포구 홍대입구',
    }),
    description: z.string().optional().openapi({
        description: '클럽 설명',
        example: '홍대의 대표 클럽',
    }),
    capacity: z.number().int().min(1, '수용 인원은 최소 1명 이상이어야 합니다').optional().openapi({
        description: '수용 인원',
        example: 500,
    }),
    openTime: z
        .string()
        .regex(timeRegex, 'openTime은 HH:mm:ss 형식이어야 합니다')
        .optional()
        .nullable()
        .openapi({
            description: '클럽 오픈 시간 (HH:mm:ss)',
            example: '21:00:00',
        }),
    closeTime: z
        .string()
        .regex(timeRegex, 'closeTime은 HH:mm:ss 형식이어야 합니다')
        .optional()
        .nullable()
        .openapi({
            description: '클럽 종료 시간 (HH:mm:ss)',
            example: '05:00:00',
        }),
});

// 클럽 목록 조회 쿼리 파라미터 스키마
export const getClubsSchema = z.object({
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

// 응답 스키마
export const clubDetailRes = successResponseSchema(clubSchema);
export const clubListRes = paginatedResponseSchema(clubSchema);
export const toggleFavoriteRes = successResponseSchema(z.boolean());

// JSON Schema
export const createClubJson = generateSchema(createClubSchema);
export const updateClubJson = generateSchema(updateClubSchema);
export const getClubsJson = generateSchema(getClubsSchema);
export const clubDetailResJson = generateSchema(clubDetailRes);
export const clubListResJson = generateSchema(clubListRes);
export const toggleFavoriteResJson = generateSchema(toggleFavoriteRes);

// 타입 추출
export type ClubType = z.infer<typeof clubSchema>;
export type CreateClubType = z.infer<typeof createClubSchema>;
export type UpdateClubType = z.infer<typeof updateClubSchema>;
export type GetClubsType = z.infer<typeof getClubsSchema>;
export type ClubDetailResponseType = z.infer<typeof clubDetailRes>;
export type ClubListResponseType = z.infer<typeof clubListResponseSchema>;
