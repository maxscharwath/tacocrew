/**
 * Test setup file
 * Runs before all tests
 */

import 'reflect-metadata';
import { afterAll, beforeAll } from 'vitest';

beforeAll(() => {
  // Suppress console logs during tests
  global.console = {
    ...console,
    log: () => {
      // Suppress logs during tests
    },
    warn: () => {
      // Suppress warnings during tests
    },
    error: () => {
      // Suppress errors during tests
    },
    debug: () => {
      // Suppress debug during tests
    },
  };
});

afterAll(() => {
  // Cleanup after all tests
});
