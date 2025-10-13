import { z } from 'zod';
import { extendZodWithOpenApi, generateSchema } from "@anatine/zod-openapi";
extendZodWithOpenApi(z);

export const getPerformanceByDateRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '기간 조회 포맷 YYYY-MM-DD')
    .openapi({ 
        type: 'string',
        description: '조회 시작 날짜, 포맷 YYYY-MM-DD', 
        example: '2025-01-01' 
    }),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '기간 조회 포맷 YYYY-MM-DD')
    .openapi({ 
        type: 'string',
        description: '조회 종료 날짜, 포맷 YYYY-MM-DD', 
        example: '2025-12-31' 
    }),
    isFree: z.preprocess((val) => {
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
        example: false 
    }),
    area: z.string().optional()
    .openapi({ 
        description: '지역 필터', 
        enum: ['홍대', '서울', '부산']
    }),
    offset: z.preprocess((val) => {
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().min(0).default(0))
    .openapi({ 
        description: '페이징 오프셋', 
        example: 0 
    }),
    limit: z.preprocess((val) => {
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().min(1).max(1000).default(1000))
    .openapi({ 
        description: '페이징 제한', 
        example: 1000 
    }),
});

export type GetPerformanceByDateRangeSchema = z.infer<typeof getPerformanceByDateRangeSchema>;
export const getPerformanceByDateRangeJsonSchema = generateSchema(getPerformanceByDateRangeSchema);