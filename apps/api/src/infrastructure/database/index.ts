/**
 * Database utilities and services
 * @module infrastructure/database
 */

export {
  createPage,
  cursorArgs,
  normalizeLimit,
  type Page,
  type PageItem,
  type PageOf,
  type PaginationOptions,
  parsePaginationParams,
  processPageResults,
} from '@/infrastructure/database/pagination';
export { PrismaService } from '@/infrastructure/database/prisma.service';
