import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export function zodToOpenApiSchema(
  zodSchema: z.ZodTypeAny,
  example: unknown,
  forParams = false
): any {
  const json = zodToJsonSchema(zodSchema, { target: 'jsonSchema7' }) as any;

  if (!json || typeof json !== 'object') {
    return {
      type: 'object',
      properties: {},
      example,
    };
  }

  // If the converter emitted a $ref/definitions structure, try to inline top-level schema
  // (zod-to-json-schema often returns { $ref: '#/definitions/xxx', definitions: { ... } })
  if (json.$ref && json.definitions) {
    const ref = String(json.$ref).replace(/^#\/definitions\//, '');
    const def = json.definitions?.[ref];
    if (def) {
      // merge target def into jsonBase
      const merged = { ...def, example };
      // copy definitions for completeness
      if (json.definitions) merged.definitions = json.definitions;
      return _adjustForParamsAndRequired(merged, example, forParams);
    }
  }

  // otherwise attach example and adjust in place
  json.example = example;
  return _adjustForParamsAndRequired(json, example, forParams);
}

function _adjustForParamsAndRequired(json: any, example: unknown, forParams: boolean) {
  // Ensure required is an array (Ajv expects array)
  if (json.required && !Array.isArray(json.required)) {
    json.required = Array.isArray(json.required) ? json.required : [];
  }

  if (forParams && json.type === 'object' && json.properties) {
    for (const [k, propSchema] of Object.entries<any>(json.properties)) {
      // If detected numeric schema, allow numeric OR string digits
      if (propSchema && (propSchema.type === 'integer' || propSchema.type === 'number')) {
        const propExample = example && typeof example === 'object' ? (example as any)[k] : undefined;
        json.properties[k] = {
          anyOf: [
            { ...(propSchema.type ? { type: propSchema.type } : {}), ...(propSchema || {}) },
            { type: 'string', pattern: '^[0-9]+$', example: propExample !== undefined ? String(propExample) : undefined },
          ],
        };
      }
    }
  }

  // ensure required is array
  if (!json.required) json.required = Array.isArray(json.required) ? json.required : [];

  return json;
}