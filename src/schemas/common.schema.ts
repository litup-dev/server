import { z, generateSchema } from '@/common/zod.js';

export const idParamSchema = z.object({
    entityId: z
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

// 페이지네이션 공통 스키마
export const defaultPaginationSchema = z.object({
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

// 요청 성공 응답 스키마
export const operationSuccessResponseSchema = z
    .object({
        success: z.boolean().default(true),
        operation: z.string(), // 'created', 'updated', 'deleted'
        message: z.string().optional(),
    })
    .openapi({ description: '작업 성공 응답' });

// 성공 응답 스키마
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

// 응답 스키마
export const operationSuccessRes = successResponseSchema(operationSuccessResponseSchema);

// JSON 스키마
export const successResponseJson = generateSchema(operationSuccessRes);
export const errorResponseJson = generateSchema(errorResponseSchema);
export const booleanSuccessResponseJson = generateSchema(successResponseSchema(z.boolean()));
export const idParamJson = generateSchema(idParamSchema);
export const defaultPaginationJson = generateSchema(defaultPaginationSchema);

// 타입 추출
export type OperationSuccessType = z.infer<typeof operationSuccessResponseSchema>;
export type IdParamType = z.infer<typeof idParamSchema>;
export type DefaultPaginationType = z.infer<typeof defaultPaginationSchema>;
