/**
 * Default no-op logger
 * @module gigatacos-client/utils/logger
 */

import type { Logger } from '../types';

/**
 * No-op logger implementation
 * Used when no logger is provided
 */
export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

