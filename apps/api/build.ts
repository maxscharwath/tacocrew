#!/usr/bin/env bun
/**
 * Build script for API package
 * Bundles the API for production deployment with external dependencies
 */

const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  sourcemap: 'external',
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
