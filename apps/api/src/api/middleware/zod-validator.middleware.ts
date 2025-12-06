/**
 * Zod validation middleware for Hono
 * @module hono/middleware/zod-validator
 */

import { MiddlewareHandler } from 'hono';
import { z } from 'zod';
import { ValidationError } from '@/shared/utils/errors.utils';

/**
 * Validates request body using Zod schema
 * Throws ValidationError if validation fails
 */
export function zodValidator<T extends z.ZodTypeAny>(
  schema: T
): MiddlewareHandler<{
  Variables: {
    body: z.infer<T>;
  };
}> {
  return async (c, next) => {
    const body = await c.req.json().catch(() => ({}));

    const result = schema.safeParse(body);

    if (!result.success) {
      const { formErrors, fieldErrors } = z.flattenError(result.error);
      const details: Record<string, unknown> = {
        formErrors,
        fieldErrors,
      };

      throw new ValidationError(details);
    }

    // Store validated body in context variables
    c.set('body', result.data);

    await next();
  };
}
