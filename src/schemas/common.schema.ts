import { z, generateSchema } from '@/common/zod';

export const idParamSchema = z.object({
    performId: z
        .preprocess((val) => {
            if (typeof val === 'string') return parseInt(val, 10);
            return val;
        }, z.number().int().positive())
        .openapi({
            type: 'number',
            description: '엔티티 ID',
            example: 1,
        }),
});

export type idParamType = z.infer<typeof idParamSchema>;
export const idParamJson = generateSchema(idParamSchema);

// 성공 응답 스키마 함수
export const successResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
    z
        .object({
            data: dataSchema,
            message: z.string().optional(),
        })
        .openapi({ description: '성공 응답' });

// 에러 응답 스키마
export const errorResponseSchema = z
    .object({
        error: z
            .object({
                statusCode: z.number(),
                message: z.string(),
                code: z.string().optional(),
                details: z.any().optional(),
            })
            .openapi({ description: '에러 상세 정보' }),
    })
    .openapi({ description: '에러 응답' });

// 페이지네이션 응답 스키마 함수
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
    z
        .object({
            data: z
                .object({
                    items: z.array(itemSchema),
                    total: z.number(),
                    offset: z.number(),
                    limit: z.number(),
                })
                .openapi({ description: '페이지네이션 데이터' }),
        })
        .openapi({ description: '페이지네이션 응답' });

export const errorResponseJsonSchema = generateSchema(errorResponseSchema);
export const booleanSuccessResponseJsonSchema = generateSchema(successResponseSchema(z.boolean()));
