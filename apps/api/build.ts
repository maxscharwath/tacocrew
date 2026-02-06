#!/usr/bin/env bun
import { cpSync, mkdirSync } from 'node:fs';

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
  loader: {
    '.html': 'text',
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

// Copy static assets (email logo) to dist so readFileSync works at runtime
mkdirSync('./dist/assets', { recursive: true });
cpSync('./src/templates/assets', './dist/assets', { recursive: true });

console.log('✓ Build completed successfully');
