import { z, generateSchema } from '@/common/zod.js';

const createReportSchema = z.object({
    typeId: z.number().openapi({
        type: 'number',
        description: '신고 유형 ID',
        example: 1,
    }),
    categoryId: z.number().openapi({
        type: 'number',
        description: '신고 카테고리 ID',
        example: 2,
    }),
    entityId: z.number().openapi({
        type: 'number',
        description: '신고 대상 엔티티 ID',
        example: 1001,
    }),
    content: z.string().min(10).max(1000).optional().openapi({
        type: 'string',
        description: '신고 내용',
        example: 'This is inappropriate content.',
    }),
});

// Json 스키마
export const createReportJson = generateSchema(createReportSchema);

// 타입 추출
export type CreateReportType = z.infer<typeof createReportSchema>;
