import { z, generateSchema } from '@/common/zod.js';
import { successResponseSchema } from '@/schemas/common.schema.js';

export const BoardCode = {
    FREE: 'FREE',
    PERFORM_REVIEW: 'PERFORM_REVIEW',
} as const;

export const PostLikeType = {
    LIKE: 'LIKE',
    DISLIKE: 'DISLIKE',
} as const;

export const MAX_POST_IMAGES = 10;

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

// 응답
export const postDetailRes = successResponseSchema(postDetailSchema);
export const postCreatedRes = successResponseSchema(z.object({ id: z.number() }));

// JSON Schema
export const createPostJson = generateSchema(createPostSchema);
export const updatePostJson = generateSchema(updatePostSchema);
export const postDetailResJson = generateSchema(postDetailRes);
export const postCreatedResJson = generateSchema(postCreatedRes);

// 타입
export type CreatePostType = z.infer<typeof createPostSchema>;
export type UpdatePostType = z.infer<typeof updatePostSchema>;
export type PostDetailType = z.infer<typeof postDetailSchema>;
export type PostLikeTypeValue = (typeof PostLikeType)[keyof typeof PostLikeType];
