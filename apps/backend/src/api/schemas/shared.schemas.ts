import { z } from '@hono/zod-openapi';

export const IsoDateStringSchema = z.iso.datetime();

export const IsoDateSchema = IsoDateStringSchema.transform((value) => new Date(value));

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const jsonContent = <T extends z.ZodTypeAny>(schema: T) => ({
  'application/json': { schema },
});
