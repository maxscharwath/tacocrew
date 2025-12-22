#!/usr/bin/env bun
/**
 * Cleanup Duplicate Stats Script
 *
 * Removes duplicate entries from meatsTried, saucesTried, and garnituresTried arrays
 * Run with: bun run scripts/cleanup-duplicate-stats.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/client';

// Initialize Prisma with adapter (Prisma 7 requirement)
const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

/**
 * Deduplicate array of objects by id field
 */
function deduplicateById<T extends { id: string }>(items: unknown[]): T[] {
  if (!Array.isArray(items)) return [];
  
  const seen = new Set<string>();
  const unique: T[] = [];
  
  for (const item of items) {
    // Handle both string IDs and object with id field
    if (typeof item === 'string') {
      if (!seen.has(item)) {
        seen.add(item);
        unique.push(item as unknown as T);
      }
    } else if (item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        unique.push(item as T);
      }
    }
  }
  
  return unique;
}

async function cleanupDuplicates() {
  console.log('🧹 Starting cleanup of duplicate stats...\n');

  const allStats = await prisma.userStats.findMany({
    select: {
      id: true,
      userId: true,
      meatsTried: true,
      saucesTried: true,
      garnituresTried: true,
    },
  });

  console.log(`📊 Found ${allStats.length} user stats to check\n`);

  let totalFixed = 0;
  let usersFixed = 0;

  for (const stats of allStats) {
    let needsUpdate = false;
    const updates: {
      meatsTried?: unknown[];
      saucesTried?: unknown[];
      garnituresTried?: unknown[];
    } = {};

    // Check and deduplicate meatsTried
    if (stats.meatsTried) {
      const original = Array.isArray(stats.meatsTried) ? stats.meatsTried : [];
      const deduplicated = deduplicateById(original);
      if (deduplicated.length !== original.length) {
        updates.meatsTried = deduplicated;
        needsUpdate = true;
        console.log(`  👤 User ${stats.userId}: meatsTried had ${original.length} items, now ${deduplicated.length} (removed ${original.length - deduplicated.length} duplicates)`);
      }
    }

    // Check and deduplicate saucesTried
    if (stats.saucesTried) {
      const original = Array.isArray(stats.saucesTried) ? stats.saucesTried : [];
      const deduplicated = deduplicateById(original);
      if (deduplicated.length !== original.length) {
        updates.saucesTried = deduplicated;
        needsUpdate = true;
        console.log(`  👤 User ${stats.userId}: saucesTried had ${original.length} items, now ${deduplicated.length} (removed ${original.length - deduplicated.length} duplicates)`);
      }
    }

    // Check and deduplicate garnituresTried
    if (stats.garnituresTried) {
      const original = Array.isArray(stats.garnituresTried) ? stats.garnituresTried : [];
      const deduplicated = deduplicateById(original);
      if (deduplicated.length !== original.length) {
        updates.garnituresTried = deduplicated;
        needsUpdate = true;
        console.log(`  👤 User ${stats.userId}: garnituresTried had ${original.length} items, now ${deduplicated.length} (removed ${original.length - deduplicated.length} duplicates)`);
      }
    }

    if (needsUpdate) {
      await prisma.userStats.update({
        where: { id: stats.id },
        data: updates,
      });
      usersFixed++;
      totalFixed +=
        (Array.isArray(stats.meatsTried) ? stats.meatsTried.length : 0) -
          (updates.meatsTried?.length ?? (Array.isArray(stats.meatsTried) ? stats.meatsTried.length : 0)) +
        (Array.isArray(stats.saucesTried) ? stats.saucesTried.length : 0) -
          (updates.saucesTried?.length ?? (Array.isArray(stats.saucesTried) ? stats.saucesTried.length : 0)) +
        (Array.isArray(stats.garnituresTried) ? stats.garnituresTried.length : 0) -
          (updates.garnituresTried?.length ?? (Array.isArray(stats.garnituresTried) ? stats.garnituresTried.length : 0));
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('✨ Cleanup complete!');
  console.log(`   👥 ${usersFixed} users fixed`);
  console.log(`   🗑️  ${totalFixed} duplicate entries removed`);
  console.log('═'.repeat(50) + '\n');
}

// Run cleanup
cleanupDuplicates()
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

