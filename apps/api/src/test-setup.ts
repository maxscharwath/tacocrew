/**
 * Test setup - loads test environment variables before any other imports
 * This must be imported first in test files that need config
 */

import dotenv from 'dotenv';
import { resolve } from 'node:path';

// Load test.env file if it exists, otherwise use .env
const testEnvPath = resolve(process.cwd(), 'test.env');
const result = dotenv.config({ path: testEnvPath, override: true });
if (result.error) {
  // Only log if it's not a "file not found" error (ENOENT)
  const errorCode = (result.error as { code?: string }).code;
  if (errorCode !== 'ENOENT') {
    console.warn('Warning: Could not load test.env:', result.error.message);
  }
}
// Fallback to .env if test.env doesn't exist
dotenv.config({ override: false });

// Set NODE_ENV to test if not already set
if (!process.env['NODE_ENV']) {
  process.env['NODE_ENV'] = 'test';
}

// Ensure required test environment variables are set
if (!process.env['BACKEND_BASE_URL']) {
  process.env['BACKEND_BASE_URL'] = 'https://test.example.com';
}
if (!process.env['JWT_SECRET']) {
  process.env['JWT_SECRET'] = 'test-secret-key-min-32-chars-long-for-validation-12345';
}
if (!process.env['JWT_EXPIRES_IN']) {
  process.env['JWT_EXPIRES_IN'] = '1h';
}
if (!process.env['DATABASE_URL']) {
  process.env['DATABASE_URL'] = 'file:./test.db';
}
