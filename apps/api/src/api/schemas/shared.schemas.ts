import { z } from '@hono/zod-openapi';
import { Currency } from '@/shared/types/types';

export const IsoDateStringSchema = z.iso.datetime();

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

export const IsoDateSchema = IsoDateStringSchema.transform((value: string) => new Date(value));

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
  cursor: z.string().optional().describe('Cursor for the next page'),
});

export type CursorPaginationQuery = z.infer<typeof CursorPaginationQuerySchema>;

/**
 * Creates a paginated response schema for a given item schema
 */
export function createPageSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().describe('Total number of items matching the query'),
    nextCursor: z.string().nullable().describe('Cursor for the next page, null if no more pages'),
    hasMore: z.boolean().describe('Whether there are more items to load'),
  });
}

/**
 * Type helper for paginated responses
 */
export type Page<T> = {
  items: T[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
};
