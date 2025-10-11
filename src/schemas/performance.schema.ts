import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// 공연 조회
export const getPerformanceByDateRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '기간 조회 포맷 YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '기간 조회 포맷 YYYY-MM-DD'),
    isFree: z.preprocess((val) => {
        if (typeof val === 'string') {
            const v = val.toLowerCase();
            if (v === 'true') return true;
            if (v === 'false') return false;
        }
        return val;
    }, z.boolean().optional()),
    area: z.string().optional(),
    offset: z.preprocess((val) => {
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().min(0).default(0)),
    limit: z.preprocess((val) => {
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().min(1).max(1000).default(1000)),
});

export type GetPerformanceByDateRangeSchema = z.infer<typeof getPerformanceByDateRangeSchema>;

// 공연 참석
export const attendPerformanceSchema = z.object({
    performId: z.preprocess((val) => {
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().int().positive()),
});

export type AttendPerformanceSchema = z.infer<typeof attendPerformanceSchema>;
export const attendParamsJsonSchema = zodToJsonSchema(attendPerformanceSchema, { target: 'jsonSchema7' });
