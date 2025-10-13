import { z } from 'zod';
import { extendZodWithOpenApi, generateSchema } from "@anatine/zod-openapi";

extendZodWithOpenApi(z);

export { z, generateSchema };