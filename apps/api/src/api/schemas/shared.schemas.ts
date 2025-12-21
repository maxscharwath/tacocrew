import { z } from '@hono/zod-openapi';
import { Currency } from '@/shared/types/types';

/**
 * Schema for currency codes (ISO 4217)
 */
export const CurrencySchema = z.string().min(3).max(3).describe('ISO 4217 currency code');

/**
 * Schema for monetary amounts with currency
 */
export const AmountSchema = z.object({
  value: z.number().describe('The monetary value'),
  currency: CurrencySchema.default(Currency.CHF).describe('ISO 4217 currency code'),
});

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export const jsonContent = <T extends z.ZodTypeAny>(schema: T) => ({
  'application/json': { schema },
});

// ─────────────────────────────────────────────────────────────────────────────
// Cursor-based Pagination Schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Query parameters for cursor-based pagination
 */
export const CursorPaginationQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(Math.max(Number.parseInt(v, 10), 1), 100) : 20))
    .describe('Number of items per page (1-100, default: 20)'),
  cursor: z.string().optional().describe('Cursor for the next page (after cursor)'),
  before: z.string().optional().describe('Cursor for the previous page (before cursor)'),
});

export type CursorPaginationQuery = z.infer<typeof CursorPaginationQuerySchema>;

/**
 * Creates a paginated response schema for cursor-based pagination.
 * Note: Cursor pagination doesn't include total counts as they're expensive
 * to compute and not necessary for navigation.
 */
export function createPageSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    firstCursor: z.string().nullable().describe('Cursor for the first item in the current page'),
    lastCursor: z.string().nullable().describe('Cursor for the last item in the current page'),
    nextCursor: z.string().nullable().describe('Cursor for the next page, null if no more pages'),
    previousCursor: z
      .string()
      .nullable()
      .describe('Cursor for the previous page, null if on first page'),
    hasNextPage: z.boolean().describe('Whether there are more items after the current page'),
    hasPreviousPage: z.boolean().describe('Whether there are items before the current page'),
  });
}
