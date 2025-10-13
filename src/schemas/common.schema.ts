import {z, generateSchema} from '@/common/zod';

export const idParamSchema = z.object({
    performId: z.preprocess((val) => {
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().int().positive())
    .openapi({ 
        type: 'number',
        description: '공연 ID', 
        example: 1
    })
});

export type idParamSchema = z.infer<typeof idParamSchema>;
export const idParamJsonSchema = generateSchema(idParamSchema);