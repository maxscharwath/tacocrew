#!/usr/bin/env bun
import { readFileSync } from 'node:fs';

/**
 * Build script for API package
 * Bundles the API for production deployment with external dependencies
 */

// Read logo at build time so it can be inlined into the bundle via `define`.
// This avoids runtime filesystem access which fails on Vercel serverless.
const logoPngBase64 = readFileSync(
  './src/templates/assets/logo.png',
).toString('base64');

const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  sourcemap: 'external',
  loader: {
    '.html': 'text',
  },
  define: {
    LOGO_PNG_BASE64: JSON.stringify(logoPngBase64),
  },
  external: [
    // Framework dependencies
    'hono',
    '@hono/*',

    // Native dependencies
    'sharp',
    '@prisma/*',
    'prisma',
    'prisma-extension-pagination',
    'pg',

    // Auth
    'better-auth',
    '@better-auth/*',
  ],
});

if (!result.success) {
  console.error('Build failed');
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log('✓ Build completed successfully');
