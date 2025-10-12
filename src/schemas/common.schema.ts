import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { zodToOpenApiSchema } from './swagger.helper';

export const idParamSchema = z.object({
    performId: z.preprocess((val) => {
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().int().positive()),
});

export type idParamSchema = z.infer<typeof idParamSchema>;
export const idParamJsonSchema = zodToOpenApiSchema(idParamSchema, { id: 1 }, true);