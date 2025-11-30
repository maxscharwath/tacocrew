/**
 * Prisma Cursor-based Pagination Helper
 *
 * A type-safe, reusable pagination utility for Prisma models.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated response structure
 */
export interface Page<T> {
  items: T[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Options for cursor-based pagination
 */
export interface PaginationOptions {
  /** Number of items per page (default: 20, max: 100) */
  limit?: number;
  /** Cursor ID for the next page */
  cursor?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes the limit to be within bounds (1-100)
 */
export function normalizeLimit(limit?: number): number {
  return Math.min(Math.max(limit ?? 20, 1), 100);
}

/**
 * Creates cursor args for Prisma findMany
 */
export function cursorArgs(cursor?: string): { cursor?: { id: string }; skip?: number } {
  if (!cursor) return {};
  return {
    cursor: { id: cursor },
    skip: 1, // Skip the cursor item itself
  };
}

/**
 * Processes pagination results from a query
 *
 * @param items - Items fetched (should be limit + 1)
 * @param limit - The actual limit requested
 * @returns Page metadata
 */
export function processPageResults<T extends { id: string }>(
  items: T[],
  limit: number
): { pageItems: T[]; hasMore: boolean; nextCursor: string | null } {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, -1) : items;
  const lastItem = pageItems[pageItems.length - 1];
  const nextCursor = hasMore && lastItem ? lastItem.id : null;

  return { pageItems, hasMore, nextCursor };
}

/**
 * Creates a Page object from items and total count
 */
export function createPage<T extends { id: string }>(
  items: T[],
  total: number,
  limit: number
): Page<T> {
  const { pageItems, hasMore, nextCursor } = processPageResults(items, limit);
  return {
    items: pageItems,
    total,
    nextCursor,
    hasMore,
  };
}

/**
 * Parses pagination parameters from a request query
 */
export function parsePaginationParams(query: {
  limit?: string | number;
  cursor?: string;
}): PaginationOptions {
  const limit =
    typeof query.limit === 'string'
      ? normalizeLimit(parseInt(query.limit, 10))
      : normalizeLimit(query.limit);

  return {
    limit,
    cursor: query.cursor || undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Type Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract the item type from a Page
 */
export type PageItem<P> = P extends Page<infer T> ? T : never;

/**
 * Create a Page type for a specific model
 */
export type PageOf<T> = Page<T>;
