import { z, generateSchema } from '@/common/zod.js';
import { successResponseSchema, paginatedResponseSchema } from '@/schemas/common.schema.js';

export const NoticeSortBy = {
    LATEST: '-createdAt',
    OLDEST: 'createdAt',
    TITLE_DESC: '-title',
    TITLE_ASC: 'title',
} as const;

const noticeAuthorSchema = z.object({
    id: z.number(),
    nickname: z.string().nullable(),
});

export const noticeListItemSchema = z.object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
    isPopup: z.boolean(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    author: noticeAuthorSchema,
});

export const popupNoticeItemSchema = z.object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
    createdAt: z.string().nullable(),
});

// 목록 조회 쿼리
export const getNoticesSchema = z.object({
    keyword: z.string().nullable().optional().openapi({
        description: '제목/내용 검색어',
        example: '공지',
    }),
    sort: z
        .enum([
            NoticeSortBy.LATEST,
            NoticeSortBy.OLDEST,
            NoticeSortBy.TITLE_DESC,
            NoticeSortBy.TITLE_ASC,
        ])
        .default(NoticeSortBy.LATEST)
        .openapi({
            description: '정렬 기준 (-createdAt | createdAt | -title | title)',
            example: '-createdAt',
        }),
    offset: z
        .preprocess((val) => {
            if (typeof val === 'string') return parseInt(val, 10);
            return val;
        }, z.number().min(0).default(0))
        .openapi({ description: '페이징 오프셋', example: 0 }),
    limit: z
        .preprocess((val) => {
            if (typeof val === 'string') return parseInt(val, 10);
            return val;
        }, z.number().min(1).max(100).default(10))
        .openapi({ description: '페이징 제한', example: 10 }),
});

// internal 등록/수정 body
export const upsertNoticeSchema = z.object({
    title: z.string().min(1).max(200).openapi({
        description: '공지 제목',
        example: '서비스 점검 안내',
    }),
    content: z.string().min(1).openapi({
        description: '공지 본문',
        example: '...',
    }),
    isPopup: z.boolean().default(false).openapi({
        description: '메인 진입 시 팝업 노출 여부',
        example: false,
    }),
});

// 응답
export const noticeListRes = paginatedResponseSchema(noticeListItemSchema);
export const noticeDetailRes = successResponseSchema(noticeListItemSchema);
export const popupNoticesRes = successResponseSchema(
    z.object({ items: z.array(popupNoticeItemSchema) }),
);
export const noticeCreatedRes = successResponseSchema(z.object({ id: z.number() }));

// JSON Schema
export const getNoticesJson = generateSchema(getNoticesSchema);
export const upsertNoticeJson = generateSchema(upsertNoticeSchema);
export const noticeListResJson = generateSchema(noticeListRes);
export const noticeDetailResJson = generateSchema(noticeDetailRes);
export const popupNoticesResJson = generateSchema(popupNoticesRes);
export const noticeCreatedResJson = generateSchema(noticeCreatedRes);

// 타입
export type GetNoticesType = z.infer<typeof getNoticesSchema>;
export type UpsertNoticeType = z.infer<typeof upsertNoticeSchema>;
export type NoticeListItemType = z.infer<typeof noticeListItemSchema>;
export type PopupNoticeItemType = z.infer<typeof popupNoticeItemSchema>;
