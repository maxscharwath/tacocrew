import { Prisma } from '@prisma/client';
import { CursorPaginationMeta } from 'prisma-extension-pagination';

/**
 * Paginated result container inspired by Spring Boot's Page<T>.
 * Extends Array<T> to inherit all array methods automatically.
 * Provides cursor-based pagination with fluent API for transformations.
 *
 * @typeParam T The type of items in the page.
 *
 * @example
 * ```ts
 * const users = await withPagination(...);
 * const dtos = users.map(user => ({ id: user.id, name: user.name }));
 *
 * // Iterate directly over items
 * for (const user of users) {
 *   console.log(user.name);
 * }
 *
 * // Use any array method: filter, find, some, every, etc.
 * const active = users.filter(u => u.active);
 * ```
 */
export class Page<T> extends Array<T> {
  constructor(
    items: T[],
    readonly firstCursor: string | null,
    readonly lastCursor: string | null,
    readonly nextCursor: string | null,
    readonly previousCursor: string | null,
    readonly hasNextPage: boolean,
    readonly hasPreviousPage: boolean
  ) {
    super();
    // Ensure items is an array and push items
    if (Array.isArray(items)) {
      this.push(...items);
    }
    // Set prototype explicitly for proper inheritance
    Object.setPrototypeOf(this, Page.prototype);
  }

  /**
   * Overrides Array.map() to preserve pagination metadata.
   * Equivalent to Spring Boot's Page.map() method.
   *
   * @typeParam U The target item type.
   * @param mapper Function to transform each item.
   * @returns A new Page with transformed items.
   *
   * @example
   * ```ts
   * const users: Page<User> = await userRepo.findAll(options);
   * const userDtos: Page<UserDTO> = users.map(user => toUserDTO(user));
   * ```
   */
  override map<U>(mapper: (value: T, index: number, array: T[]) => U): Page<U> {
    return new Page(
      super.map(mapper),
      this.firstCursor,
      this.lastCursor,
      this.nextCursor,
      this.previousCursor,
      this.hasNextPage,
      this.hasPreviousPage
    );
  }

  /**
   * Overrides Array.filter() to preserve pagination metadata.
   *
   * @param predicate Function to test each item.
   * @returns A new Page with filtered items.
   */
  override filter(predicate: (value: T, index: number, array: T[]) => boolean): Page<T> {
    return new Page(
      super.filter(predicate),
      this.firstCursor,
      this.lastCursor,
      this.nextCursor,
      this.previousCursor,
      this.hasNextPage,
      this.hasPreviousPage
    );
  }

  /**
   * Creates an empty page with no items or cursors.
   * Equivalent to Spring Boot's Page.empty() method.
   *
   * @typeParam T The item type.
   * @returns An empty Page instance.
   *
   * @example
   * ```ts
   * return Page.empty<User>();
   * ```
   */
  static empty<T>(): Page<T> {
    return new Page<T>([], null, null, null, null, false, false);
  }

  /**
   * Gets the number of items in the current page.
   * Alias for Array.length for Spring Boot compatibility.
   */
  get size(): number {
    return this.length;
  }

  /**
   * Checks if the page is empty.
   */
  get isEmpty(): boolean {
    return this.length === 0;
  }

  /**
   * Gets the items as a readonly array.
   * Provided for backwards compatibility.
   */
  get items(): readonly T[] {
    return this;
  }

  /**
   * Converts the Page to a plain object for JSON serialization.
   * Useful for API responses.
   */
  toJSON() {
    return {
      items: Array.from(this),
      firstCursor: this.firstCursor,
      lastCursor: this.lastCursor,
      nextCursor: this.nextCursor,
      previousCursor: this.previousCursor,
      hasNextPage: this.hasNextPage,
      hasPreviousPage: this.hasPreviousPage,
    };
  }
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  before?: string;
}

export interface PaginationMeta {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface CursorPaginationOptions {
  limit: number;
  before?: string;
  after?: string;
}

/**
 * Normalizes a requested page size.
 *
 * @returns An integer clamped to 1..100 (default: 20).
 * @param value
 */
export function normalizeLimit(value = 20): number {
  if (!Number.isFinite(value)) return 20;
  return Math.min(Math.max(Math.trunc(value), 1), 100);
}

/**
 * Maps API pagination inputs to prisma-extension-pagination cursor options.
 *
 * @param options Cursor pagination input.
 * @returns Options for `paginate(...).withCursor(...)`.
 */
export function createCursorOptions(options?: PaginationOptions): CursorPaginationOptions {
  const limit = normalizeLimit(options?.limit);
  const after = options?.cursor;
  const before = options?.before;

  return {
    limit,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
  };
}

/**
 * Parses query-like pagination params into normalized options.
 *
 * @param query Raw query params.
 * @returns Normalized pagination options.
 */
export function parsePaginationParams(query: {
  limit?: string | number;
  cursor?: string;
  before?: string;
}): PaginationOptions {
  const limit =
    typeof query.limit === 'string'
      ? normalizeLimit(Number.parseInt(query.limit, 10))
      : normalizeLimit(query.limit);

  return {
    limit,
    cursor: query.cursor || undefined,
    before: query.before || undefined,
  };
}

/**
 * Creates a Page instance from cursor pagination results.
 *
 * @typeParam T Item type.
 * @param items Items for the current page.
 * @param meta Cursor metadata.
 * @returns A `Page<T>` instance suitable for API responses.
 */
export function createPage<T>(items: T[], meta: PaginationMeta): Page<T> {
  return new Page(
    items,
    meta.startCursor,
    meta.endCursor,
    meta.hasNextPage ? meta.endCursor : null,
    meta.hasPreviousPage ? meta.startCursor : null,
    meta.hasNextPage,
    meta.hasPreviousPage
  );
}
export type PageItem<P> = P extends Page<infer T> ? T : never;
export type PageOf<T> = Page<T>;

type PaginateFn = <T, A>(
  this: T,
  args?: Prisma.Exact<A, Omit<Prisma.Args<T, 'findMany'>, 'cursor' | 'take' | 'skip'>>
) => {
  withCursor: (
    options: CursorPaginationOptions | (CursorPaginationOptions & { limit: number }) | undefined
  ) => Promise<[Prisma.Result<T, A, 'findMany'>, CursorPaginationMeta]>;
};

type WithPaginate = { paginate: PaginateFn };

export async function withPagination<D extends WithPaginate, A>(
  delegate: D,
  args: Prisma.Exact<A, Omit<Prisma.Args<D, 'findMany'>, 'cursor' | 'take' | 'skip'>>,
  options: PaginationOptions | undefined
): Promise<Page<Prisma.Result<D, A, 'findMany'>[number]>> {
  const [items, meta] = await delegate
    .paginate(args)
    .withCursor(createCursorOptions(options) as CursorPaginationOptions | undefined);

  return createPage(items, meta) as Page<Prisma.Result<D, A, 'findMany'>[number]>;
}
