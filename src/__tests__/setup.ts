/**
 * Test setup file
 * Runs before all tests
 */

import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Suppress console logs during tests
  global.console = {
    ...console,
    log: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  };
});

afterAll(() => {
  // Cleanup after all tests
});

