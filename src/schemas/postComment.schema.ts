import { z, generateSchema } from '@/common/zod.js';
import { paginatedResponseSchema, successResponseSchema } from '@/schemas/common.schema.js';

const commentAuthorSchema = z.object({
    id: z.number(),
    nickname: z.string().nullable(),
    profilePath: z.string().nullable(),
});

// 삭제된 댓글(묘비): isDeleted=true, content는 빈 문자열, author는 null로 마스킹된다.
// 프론트는 isDeleted=true면 "삭제된 댓글입니다"로 렌더링.
const commentBaseSchema = z.object({
    id: z.number(),
    parentId: z.number().nullable(),
    content: z.string(),
    createdAt: z.string().nullable(),
    updatedAt: z.string().nullable(),
    author: commentAuthorSchema.nullable(),
    isMine: z.boolean(),
    isDeleted: z.boolean(),
});

// 대댓글은 중첩 대신 flat 배열(parentId 포함)로 내려준다.
// n-depth로 확장돼도 응답 구조 변경 없이 프론트가 parentId로 트리를 구성한다.
export const commentItemSchema = commentBaseSchema.extend({
    replies: z.array(commentBaseSchema),
});

export const createCommentSchema = z.object({
    content: z.string().min(1).max(1000).openapi({
        description: '댓글 내용 (최대 1000자)',
        example: '공연 정말 좋았어요!',
    }),
    parentId: z.number().int().positive().optional().openapi({
        description: '대댓글인 경우 부모 댓글 ID',
        example: 1,
    }),
});

export const updateCommentSchema = z.object({
    content: z.string().min(1).max(1000).openapi({
        description: '댓글 내용 (최대 1000자)',
        example: '공연 정말 좋았어요!',
    }),
});

// 댓글 목록은 등록순 고정, 페이지네이션은 최상위 댓글 기준
export const getCommentsSchema = z.object({
    offset: z
        .preprocess((val) => {
            if (typeof val === 'string') return parseInt(val, 10);
            return val;
        }, z.number().min(0).default(0))
        .openapi({ description: '페이징 오프셋 (최상위 댓글 기준)', example: 0 }),
    limit: z
        .preprocess((val) => {
            if (typeof val === 'string') return parseInt(val, 10);
            return val;
        }, z.number().min(1).max(100).default(20))
        .openapi({ description: '페이징 제한', example: 20 }),
});

// 대댓글 작성 시 태그할 수 있는 사용자 (작성자 + 댓글/대댓글 작성자, 중복 제거)
export const mentionableUserSchema = z.object({
    id: z.number(),
    nickname: z.string().nullable(),
    profilePath: z.string().nullable(),
    isAuthor: z.boolean().openapi({ description: '게시글 작성자 여부' }),
});

// 응답
export const commentListRes = paginatedResponseSchema(commentItemSchema);
export const commentCreatedRes = successResponseSchema(z.object({ id: z.number() }));
export const mentionableUsersRes = successResponseSchema(z.array(mentionableUserSchema));

// JSON Schema
export const createCommentJson = generateSchema(createCommentSchema);
export const updateCommentJson = generateSchema(updateCommentSchema);
export const getCommentsJson = generateSchema(getCommentsSchema);
export const commentListResJson = generateSchema(commentListRes);
export const commentCreatedResJson = generateSchema(commentCreatedRes);
export const mentionableUsersResJson = generateSchema(mentionableUsersRes);

// 타입
export type CreateCommentType = z.infer<typeof createCommentSchema>;
export type UpdateCommentType = z.infer<typeof updateCommentSchema>;
export type GetCommentsType = z.infer<typeof getCommentsSchema>;
export type CommentBaseType = z.infer<typeof commentBaseSchema>;
export type CommentItemType = z.infer<typeof commentItemSchema>;
export type MentionableUserType = z.infer<typeof mentionableUserSchema>;
