import { z, generateSchema } from '@/common/zod.js';
import { paginatedResponseSchema, successResponseSchema } from '@/schemas/common.schema.js';
import { commonCreatedAtSortBy } from '@/types/search.types.js';

export const BoardCode = {
    FREE: 'FREE',
    PERFORM_REVIEW: 'PERFORM_REVIEW',
} as const;

export const PostLikeType = {
    LIKE: 'LIKE',
    DISLIKE: 'DISLIKE',
} as const;

export const MAX_POST_IMAGES = 10;
export const MAX_LIST_THUMBNAILS = 4;

const postAuthorSchema = z.object({
    id: z.number(),
    nickname: z.string().nullable(),
    profilePath: z.string().nullable(),
});

const postImageSchema = z.object({
    id: z.number(),
    filePath: z.string(),
});

const postCategorySchema = z.object({
    code: z.string(),
    name: z.string(),
});

export const postDetailSchema = z.object({
    id: z.number(),
    boardCode: z.string(),
    category: postCategorySchema.nullable(),
    title: z.string(),
    content: z.string(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    author: postAuthorSchema,
    images: z.array(postImageSchema),
    likeCount: z.number(),
    dislikeCount: z.number(),
    commentCount: z.number(),
    isMine: z.boolean(),
    myLikeType: z.enum([PostLikeType.LIKE, PostLikeType.DISLIKE]).nullable(),
    isDraft: z.boolean(),
});

export const createPostSchema = z.object({
    boardCode: z.string().default(BoardCode.FREE).openapi({
        description: '게시판 코드',
        example: 'FREE',
    }),
    categoryCode: z.string().optional().openapi({
        description: '카테고리 코드 (자유 게시판만 사용, 미지정 시 GENERAL)',
        example: 'GENERAL',
    }),
    title: z.string().min(1).max(50).openapi({
        description: '제목 (최대 50자)',
        example: '같이 공연 보러 가실 분 구합니다',
    }),
    content: z.string().min(1).max(50000).openapi({
        description: '본문 (마크다운)',
        example: '## 소개\n같이 가실 분...',
    }),
    imageIds: z
        .array(z.number().int().positive())
        .max(MAX_POST_IMAGES)
        .default([])
        .openapi({
            description: `본문에 사용된 이미지 ID 목록 (최대 ${MAX_POST_IMAGES}개)`,
            example: [1, 2],
        }),
});

// 수정은 최종 상태 전체 전송. imageIds에서 빠진 기존 이미지는 스토리지에서도 삭제된다.
export const updatePostSchema = z.object({
    categoryCode: z.string().optional().openapi({
        description: '카테고리 코드 (자유 게시판만 사용, 미지정 시 GENERAL)',
        example: 'GENERAL',
    }),
    title: z.string().min(1).max(50).openapi({
        description: '제목 (최대 50자)',
        example: '같이 공연 보러 가실 분 구합니다',
    }),
    content: z.string().min(1).max(50000).openapi({
        description: '본문 (마크다운)',
        example: '## 소개\n같이 가실 분...',
    }),
    imageIds: z
        .array(z.number().int().positive())
        .max(MAX_POST_IMAGES)
        .openapi({
            description: `수정 후 본문에 남는 이미지 ID 전체 목록 (최대 ${MAX_POST_IMAGES}개)`,
            example: [1, 2],
        }),
});

export const postListItemSchema = z.object({
    id: z.number(),
    boardCode: z.string(),
    category: postCategorySchema.nullable(),
    title: z.string(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    author: postAuthorSchema,
    likeCount: z.number(),
    dislikeCount: z.number(),
    commentCount: z.number(),
    thumbnails: z
        .array(postImageSchema)
        .max(MAX_LIST_THUMBNAILS)
        .openapi({
            description: `목록에 노출할 이미지 (최대 ${MAX_LIST_THUMBNAILS}장, 등록순)`,
        }),
    imageCount: z.number().openapi({
        description: '게시글에 첨부된 전체 이미지 개수',
        example: 10,
    }),
});

// 임시저장 생성. title/content는 완결성 검사 없이 부분 상태 그대로 저장.
export const createDraftSchema = z.object({
    boardCode: z.string().default(BoardCode.FREE).openapi({
        description: '게시판 코드',
        example: 'FREE',
    }),
    categoryCode: z.string().optional().openapi({
        description: '카테고리 코드 (자유 게시판만 사용, 미지정 시 GENERAL)',
        example: 'GENERAL',
    }),
    title: z.string().max(50).default('').openapi({
        description: '제목 (최대 50자, 미입력 가능)',
        example: '작성 중인 글',
    }),
    content: z.string().max(50000).default('').openapi({
        description: '본문 (최대 50000자, 미입력 가능)',
        example: '## 소개\n작성 중...',
    }),
    imageIds: z
        .array(z.number().int().positive())
        .max(MAX_POST_IMAGES)
        .default([])
        .openapi({
            description: `본문에 사용된 이미지 ID 목록 (최대 ${MAX_POST_IMAGES}개)`,
            example: [1, 2],
        }),
});

// 임시저장 수정(자동저장). 최종 상태 전체 전송 방식은 updatePostSchema와 동일.
export const updateDraftSchema = z.object({
    categoryCode: z.string().optional().openapi({
        description: '카테고리 코드 (자유 게시판만 사용, 미지정 시 GENERAL)',
        example: 'GENERAL',
    }),
    title: z.string().max(50).default('').openapi({
        description: '제목 (최대 50자, 미입력 가능)',
        example: '작성 중인 글',
    }),
    content: z.string().max(50000).default('').openapi({
        description: '본문 (최대 50000자, 미입력 가능)',
        example: '## 소개\n작성 중...',
    }),
    imageIds: z
        .array(z.number().int().positive())
        .max(MAX_POST_IMAGES)
        .default([])
        .openapi({
            description: `수정 후 본문에 남는 이미지 ID 전체 목록 (최대 ${MAX_POST_IMAGES}개)`,
            example: [1, 2],
        }),
});

export const draftListItemSchema = z.object({
    id: z.number(),
    boardCode: z.string(),
    category: postCategorySchema.nullable(),
    title: z.string(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    thumbnails: z.array(postImageSchema).max(MAX_LIST_THUMBNAILS),
    imageCount: z.number(),
});

// 목록 조회 쿼리
export const getPostsSchema = z.object({
    board: z.string().default(BoardCode.FREE).openapi({
        description: '게시판 코드',
        example: 'FREE',
    }),
    category: z.string().optional().openapi({
        description: '카테고리 코드 필터 (자유 게시판용)',
        example: 'GENERAL',
    }),
    keyword: z.string().optional().openapi({
        description: '제목/내용 검색어',
        example: '공연',
    }),
    sort: z.nativeEnum(commonCreatedAtSortBy).default(commonCreatedAtSortBy.RECENT).openapi({
        description: '정렬 기준 (-createdAt: 최신순, +createdAt: 오래된순)',
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

// 임시저장 목록 조회 쿼리
export const getDraftsSchema = z.object({
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
        }, z.number().min(1).max(100).default(20))
        .openapi({ description: '페이징 제한', example: 20 }),
});

// 좋아요/싫어요 토글 요청
export const postLikeBodySchema = z.object({
    likeType: z.enum([PostLikeType.LIKE, PostLikeType.DISLIKE]).openapi({
        description: '좋아요/싫어요 타입. 같은 타입 재요청 시 취소, 다른 타입이면 변경',
        example: 'LIKE',
    }),
});

export const postLikeStateSchema = z.object({
    myLikeType: z.enum([PostLikeType.LIKE, PostLikeType.DISLIKE]).nullable(),
    likeCount: z.number(),
    dislikeCount: z.number(),
});

// 응답
export const postDetailRes = successResponseSchema(postDetailSchema);
export const postCreatedRes = successResponseSchema(z.object({ id: z.number() }));
export const postListRes = paginatedResponseSchema(postListItemSchema);
export const postImageUploadRes = successResponseSchema(postImageSchema);
export const postLikeRes = successResponseSchema(postLikeStateSchema);
export const draftCreatedRes = successResponseSchema(z.object({ id: z.number() }));
export const draftPublishedRes = successResponseSchema(z.object({ id: z.number() }));
export const draftListRes = paginatedResponseSchema(draftListItemSchema);

// JSON Schema
export const createPostJson = generateSchema(createPostSchema);
export const updatePostJson = generateSchema(updatePostSchema);
export const getPostsJson = generateSchema(getPostsSchema);
export const postDetailResJson = generateSchema(postDetailRes);
export const postCreatedResJson = generateSchema(postCreatedRes);
export const postListResJson = generateSchema(postListRes);
export const postImageUploadResJson = generateSchema(postImageUploadRes);
export const postLikeBodyJson = generateSchema(postLikeBodySchema);
export const postLikeResJson = generateSchema(postLikeRes);
export const createDraftJson = generateSchema(createDraftSchema);
export const updateDraftJson = generateSchema(updateDraftSchema);
export const getDraftsJson = generateSchema(getDraftsSchema);
export const draftCreatedResJson = generateSchema(draftCreatedRes);
export const draftPublishedResJson = generateSchema(draftPublishedRes);
export const draftListResJson = generateSchema(draftListRes);

// 타입
export type CreatePostType = z.infer<typeof createPostSchema>;
export type UpdatePostType = z.infer<typeof updatePostSchema>;
export type GetPostsType = z.infer<typeof getPostsSchema>;
export type PostLikeBodyType = z.infer<typeof postLikeBodySchema>;
export type PostLikeStateType = z.infer<typeof postLikeStateSchema>;
export type PostDetailType = z.infer<typeof postDetailSchema>;
export type PostListItemType = z.infer<typeof postListItemSchema>;
export type PostLikeTypeValue = (typeof PostLikeType)[keyof typeof PostLikeType];
export type CreateDraftType = z.infer<typeof createDraftSchema>;
export type UpdateDraftType = z.infer<typeof updateDraftSchema>;
export type GetDraftsType = z.infer<typeof getDraftsSchema>;
export type DraftListItemType = z.infer<typeof draftListItemSchema>;
