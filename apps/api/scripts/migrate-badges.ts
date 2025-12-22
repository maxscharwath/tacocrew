#!/usr/bin/env bun
/**
 * Badge Migration Script
 *
 * Backfills UserStats and awards badges for existing users based on historical data.
 * Run with: bun run scripts/migrate-badges.ts
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, $Enums } from '../src/generated/client';
import { BADGES } from '../src/config/badges.config';
import { getMetricValue } from '../src/config/metrics.config';

const { OrganizationRole } = $Enums;

// Initialize Prisma with adapter (Prisma 7 requirement)
const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

interface TacoItem {
  id?: string;
  size?: string;
  meats?: string[];
  sauces?: string[];
  garnitures?: string[];
  quantity?: number;
  isMystery?: boolean;
}

interface OrderItems {
  tacos?: TacoItem[];
  extras?: unknown[];
  drinks?: unknown[];
  desserts?: unknown[];
}

/**
 * Extract stats from a user's order items
 */
function extractStatsFromItems(items: OrderItems): {
  tacosCount: number;
  mysteryCount: number;
  totalPrice: number;
  meats: Set<string>;
  sauces: Set<string>;
  garnitures: Set<string>;
} {
  const meats = new Set<string>();
  const sauces = new Set<string>();
  const garnitures = new Set<string>();
  let tacosCount = 0;
  let mysteryCount = 0;
  let totalPrice = 0;

  if (items.tacos && Array.isArray(items.tacos)) {
    for (const taco of items.tacos) {
      const qty = taco.quantity ?? 1;
      tacosCount += qty;

      // Calculate price (price is in centimes)
      if (typeof taco.price === 'number') {
        totalPrice += taco.price * qty;
      }

      // Check if mystery taco (either flagged or has random/mystery in meats)
      if (taco.isMystery) {
        mysteryCount += qty;
      }

      // Collect unique ingredient IDs (handle both string IDs and objects with id field)
      if (Array.isArray(taco.meats)) {
        for (const meat of taco.meats) {
          if (!meat) continue;
          // Extract ID from object or use string directly
          const meatId = typeof meat === 'string' ? meat : (meat && typeof meat === 'object' && 'id' in meat ? meat.id : null);
          if (meatId) meats.add(meatId);
        }
      }
      if (Array.isArray(taco.sauces)) {
        for (const sauce of taco.sauces) {
          if (!sauce) continue;
          // Extract ID from object or use string directly
          const sauceId = typeof sauce === 'string' ? sauce : (sauce && typeof sauce === 'object' && 'id' in sauce ? sauce.id : null);
          if (sauceId) sauces.add(sauceId);
        }
      }
      if (Array.isArray(taco.garnitures)) {
        for (const garniture of taco.garnitures) {
          if (!garniture) continue;
          // Extract ID from object or use string directly
          const garnitureId = typeof garniture === 'string' ? garniture : (garniture && typeof garniture === 'object' && 'id' in garniture ? garniture.id : null);
          if (garnitureId) garnitures.add(garnitureId);
        }
      }
    }
  }

  // Add prices from extras, drinks, desserts
  if (items.extras && Array.isArray(items.extras)) {
    for (const extra of items.extras) {
      if (extra && typeof extra === 'object' && 'price' in extra && 'quantity' in extra) {
        const price = typeof extra.price === 'number' ? extra.price : 0;
        const qty = typeof extra.quantity === 'number' ? extra.quantity : 1;
        totalPrice += price * qty;
      }
    }
  }
  if (items.drinks && Array.isArray(items.drinks)) {
    for (const drink of items.drinks) {
      if (drink && typeof drink === 'object' && 'price' in drink && 'quantity' in drink) {
        const price = typeof drink.price === 'number' ? drink.price : 0;
        const qty = typeof drink.quantity === 'number' ? drink.quantity : 1;
        totalPrice += price * qty;
      }
    }
  }
  if (items.desserts && Array.isArray(items.desserts)) {
    for (const dessert of items.desserts) {
      if (dessert && typeof dessert === 'object' && 'price' in dessert && 'quantity' in dessert) {
        const price = typeof dessert.price === 'number' ? dessert.price : 0;
        const qty = typeof dessert.quantity === 'number' ? dessert.quantity : 1;
        totalPrice += price * qty;
      }
    }
  }

  return { tacosCount, mysteryCount, totalPrice, meats, sauces, garnitures };
}

/**
 * Calculate ISO week number from a date
 */
function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getFullYear() };
}

/**
 * Calculate streak from order dates
 */
function calculateStreaks(orderDates: Date[]): {
  currentStreak: number;
  longestStreak: number;
  lastWeek: number | null;
  lastYear: number | null;
} {
  if (orderDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWeek: null, lastYear: null };
  }

  // Sort dates descending
  const sorted = [...orderDates].sort((a, b) => b.getTime() - a.getTime());

  // Get unique weeks
  const weeks = new Map<string, { week: number; year: number }>();
  for (const date of sorted) {
    const { week, year } = getISOWeek(date);
    const key = `${year}-${week}`;
    if (!weeks.has(key)) {
      weeks.set(key, { week, year });
    }
  }

  const uniqueWeeks = Array.from(weeks.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.week - a.week;
  });

  if (uniqueWeeks.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastWeek: null, lastYear: null };
  }

  // Safe access - we've verified length > 0
  const firstWeek = uniqueWeeks[0]!;
  const lastWeek = firstWeek.week;
  const lastYear = firstWeek.year;

  // Calculate current streak (consecutive weeks from most recent)
  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  const now = new Date();
  const { week: currentWeek, year: currentYear } = getISOWeek(now);

  // Check if most recent order is within current or last week
  const isRecent =
    (firstWeek.year === currentYear && firstWeek.week >= currentWeek - 1) ||
    (firstWeek.year === currentYear - 1 && currentWeek === 1 && firstWeek.week >= 52);

  if (!isRecent) {
    currentStreak = 0;
  }

  for (let i = 1; i < uniqueWeeks.length; i++) {
    const prev = uniqueWeeks[i - 1]!;
    const curr = uniqueWeeks[i]!;

    // Check if consecutive week
    const isConsecutive =
      (prev.year === curr.year && prev.week === curr.week + 1) ||
      (prev.year === curr.year + 1 && prev.week === 1 && curr.week >= 52);

    if (isConsecutive) {
      tempStreak++;
      if (isRecent && i < currentStreak + 1) {
        currentStreak = tempStreak;
      }
    } else {
      tempStreak = 1;
    }

    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { currentStreak, longestStreak, lastWeek, lastYear };
}

type BadgeTrigger = (typeof BADGES)[number]['trigger'];

/**
 * Check if a user qualifies for a badge based on their stats
 * Simplified: uses centralized getMetricValue from metrics.config.ts
 * @param userCreatedAt - Only required for date triggers with registeredBefore condition
 */
function checkBadgeEligibility(
  stats: Parameters<typeof getMetricValue>[1],
  trigger: BadgeTrigger,
  userCreatedAt?: Date
): boolean {
  if (trigger.type === 'count') {
    // Use centralized metric lookup - no switch statement needed!
    const value = getMetricValue(trigger.metric, stats);
    return value >= trigger.threshold;
  }

  if (trigger.type === 'streak') {
    if (trigger.activity === 'orderedInWeek') {
      return getMetricValue('longestOrderStreak', stats) >= trigger.count;
    }
    return false;
  }

  if (trigger.type === 'combo') {
    return trigger.conditions.every((condition) => checkBadgeEligibility(stats, condition, userCreatedAt));
  }

  if (trigger.type === 'date') {
    // Handle registeredBefore condition - can be evaluated during migration
    if (trigger.condition.type === 'registeredBefore') {
      if (!userCreatedAt) {
        return false; // Cannot evaluate without user creation date
      }
      // Parse the cutoff date and set to end of day (23:59:59.999) to include the full day
      const cutoffDateStr = trigger.condition.date;
      const cutoffDate = new Date(cutoffDateStr);
      // Set to end of day to include users who registered on that date
      cutoffDate.setHours(23, 59, 59, 999);
      return userCreatedAt <= cutoffDate;
    }
    // Other date conditions need real-time checking
    return false;
  }

  if (trigger.type === 'action') {
    // Handle action-based badges that can be evaluated from stats
    // Actions like "firstOrder" can be checked by looking at the metric
    if (trigger.action === 'firstOrder') {
      // firstOrder requires ordersPlaced to be exactly 1
      const ordersPlaced = getMetricValue('ordersPlaced', stats);
      return ordersPlaced === 1;
    }
    if (trigger.action === 'firstMysteryTaco') {
      const mysteryTacos = getMetricValue('mysteryTacosOrdered', stats);
      return mysteryTacos === 1;
    }
    if (trigger.action === 'firstGroupOrderCreated') {
      const groupOrdersCreated = getMetricValue('groupOrdersCreated', stats);
      return groupOrdersCreated === 1;
    }
    if (trigger.action === 'firstGroupOrderLed') {
      const groupOrdersLed = getMetricValue('groupOrdersLed', stats);
      return groupOrdersLed === 1;
    }
    if (trigger.action === 'joinedOrganization') {
      const orgsJoined = getMetricValue('organizationsJoined', stats);
      return orgsJoined >= 1;
    }
    if (trigger.action === 'createdOrganization') {
      const orgsCreated = getMetricValue('organizationsCreated', stats);
      return orgsCreated >= 1;
    }
    if (trigger.action === 'invitedMember') {
      const membersInvited = getMetricValue('membersInvited', stats);
      return membersInvited >= 1;
    }
    if (trigger.action === 'paidForSomeoneElse') {
      const timesPaid = getMetricValue('timesPaidForOthers', stats);
      return timesPaid >= 1;
    }
    if (trigger.action === 'gotReimbursed') {
      const timesReimbursed = getMetricValue('timesGotReimbursed', stats);
      return timesReimbursed >= 1;
    }
    // Other actions need real-time checking
    return false;
  }

  // Skip time triggers - these need real-time checking
  return false;
}

async function migrateUserBadges() {
  console.log('🚀 Starting badge migration...\n');

  const users = await prisma.user.findMany({
    select: { id: true, name: true, createdAt: true },
  });

  console.log(`📊 Found ${users.length} users to process\n`);

  let totalStats = 0;
  let totalBadges = 0;

  for (const user of users) {
    console.log(`\n👤 Processing user: ${user.name} (${user.id})`);

    // Get user's orders
    const userOrders = await prisma.userOrder.findMany({
      where: { userId: user.id },
      select: { items: true, createdAt: true },
    });

    // Get user's individual orders (from Order table)
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    // Get group orders led (submitted or completed)
    // Note: This counts orders where the user was the leader and submitted/completed them
    const groupOrdersLed = await prisma.groupOrder.count({
      where: {
        leaderId: user.id,
        status: { in: ['submitted', 'completed'] },
      },
    });

    // Get organizations
    const organizations = await prisma.userOrganization.findMany({
      where: { userId: user.id },
      select: { role: true },
    });

    // Get times paid for others
    const timesPaidForOthers = await prisma.userOrder.count({
      where: {
        paidByUserId: user.id,
        userId: { not: user.id },
      },
    });

    // Get times got reimbursed
    const timesGotReimbursed = await prisma.userOrder.count({
      where: {
        userId: user.id,
        reimbursed: true,
      },
    });

    // Aggregate stats from user orders
    const allMeats = new Set<string>();
    const allSauces = new Set<string>();
    const allGarnitures = new Set<string>();
    let totalTacos = 0;
    let totalMystery = 0;
    let totalSpentCentimes = 0;
    const orderDates: Date[] = [];

    for (const order of userOrders) {
      const items = order.items as OrderItems;
      const stats = extractStatsFromItems(items);

      totalTacos += stats.tacosCount;
      totalMystery += stats.mysteryCount;
      totalSpentCentimes += stats.totalPrice;

      for (const meat of stats.meats) allMeats.add(meat);
      for (const sauce of stats.sauces) allSauces.add(sauce);
      for (const garniture of stats.garnitures) allGarnitures.add(garniture);

      orderDates.push(order.createdAt);
    }

    // Calculate streaks
    const streaks = calculateStreaks(orderDates);

    // Get group orders created (different from led - these are created but not necessarily submitted)
    const groupOrdersCreated = await prisma.groupOrder.count({
      where: { leaderId: user.id },
    });

    // Get members invited (if there's a way to track this)
    // Note: This would require an invitations table or tracking mechanism
    // For now, we'll set it to 0 if not trackable
    const membersInvited = 0;

    // Create or update UserStats
    const statsData = {
      tacosOrdered: totalTacos,
      mysteryTacosOrdered: totalMystery,
      ordersPlaced: orders.length,
      totalSpentCentimes,
      groupOrdersCreated,
      groupOrdersLed,
      organizationsJoined: organizations.length,
      organizationsCreated: organizations.filter((o) => o.role === OrganizationRole.ADMIN).length,
      membersInvited,
      timesPaidForOthers,
      timesGotReimbursed,
      meatsTried: Array.from(allMeats),
      saucesTried: Array.from(allSauces),
      garnituresTried: Array.from(allGarnitures),
      currentOrderStreak: streaks.currentStreak,
      longestOrderStreak: streaks.longestStreak,
      lastOrderWeek: streaks.lastWeek,
      lastOrderYear: streaks.lastYear,
    };

    await prisma.userStats.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...statsData },
      update: statsData,
    });

    totalStats++;
    console.log(
      `  ✅ Stats: ${totalTacos} tacos, ${totalMystery} mystery, ${orders.length} orders, ${totalSpentCentimes} centimes, ${groupOrdersLed} group orders, ${organizations.length} orgs`
    );

    // Get existing badges
    const existingBadges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      select: { badgeId: true },
    });
    const existingBadgeIds = new Set(existingBadges.map((b) => b.badgeId));

    // Check and award badges
    let userBadgesAwarded = 0;
    const userCreatedAt = user.createdAt ?? new Date();

    console.log(`  📅 User registered: ${userCreatedAt.toISOString().split('T')[0]}`);

    for (const badge of BADGES) {
      // Skip if already earned
      if (existingBadgeIds.has(badge.id)) {
        console.log(`  ✅ Already earned: ${badge.id}`);
        continue;
      }

      // Check badge availability
      // For badges that can be backfilled, check if badge was available when user could have earned it
      // For action-based badges, we skip them anyway, so availability doesn't matter here
      if (badge.availability) {
        const { from, until } = badge.availability;
        // Badge is expired if user registered AFTER the until date (for backfillable badges)
        // This is a conservative check - user could have earned it before expiration
        if (until && userCreatedAt > until) {
          console.log(`  ⏭️  Skipped (expired): ${badge.id} - user registered ${userCreatedAt.toISOString().split('T')[0]}, badge expired on ${until.toISOString().split('T')[0]}`);
          continue;
        }
        // Badge is not yet available if user registered BEFORE the from date
        if (from && userCreatedAt < from) {
          console.log(`  ⏭️  Skipped (not yet available): ${badge.id} - user registered ${userCreatedAt.toISOString().split('T')[0]}, badge available from ${from.toISOString().split('T')[0]}`);
          continue;
        }
      }

      // Handle action-based badges that can be evaluated from stats
      // Some actions (like firstOrder) can be checked by looking at metrics
      // We'll evaluate them below, so don't skip here

      if (badge.trigger.type === 'time') {
        console.log(`  ⏭️  Skipped (time-based, requires real-time event): ${badge.id}`);
        continue;
      }

      // Skip date badges that aren't registeredBefore (they need real-time checking)
      if (badge.trigger.type === 'date' && badge.trigger.condition.type !== 'registeredBefore') {
        console.log(`  ⏭️  Skipped (date-based, requires real-time event): ${badge.id} (condition: ${badge.trigger.condition.type})`);
        continue;
      }

      // Check eligibility - only pass userCreatedAt if badge needs it (date badges with registeredBefore)
      const needsUserCreatedAt =
        badge.trigger.type === 'date' && badge.trigger.condition.type === 'registeredBefore';
      const isEligible = checkBadgeEligibility(
        statsData as Parameters<typeof getMetricValue>[1],
        badge.trigger,
        needsUserCreatedAt ? userCreatedAt : undefined
      );

      if (isEligible) {
        await prisma.userBadge.create({
          data: {
            userId: user.id,
            badgeId: badge.id,
            earnedAt: new Date(),
          },
        });
        userBadgesAwarded++;
        totalBadges++;
        console.log(`  🏆 Awarded: ${badge.id}`);
      } else {
        // Explain why the badge wasn't awarded
        let reason = '';
        if (badge.trigger.type === 'count') {
          const value = getMetricValue(badge.trigger.metric, statsData as Parameters<typeof getMetricValue>[1]);
          reason = `needs ${badge.trigger.threshold}, has ${value}`;
        } else if (badge.trigger.type === 'date' && badge.trigger.condition.type === 'registeredBefore') {
          const cutoffDateStr = badge.trigger.condition.date;
          const cutoffDate = new Date(cutoffDateStr);
          cutoffDate.setHours(23, 59, 59, 999); // End of day for comparison
          const userDateStr = userCreatedAt.toISOString().split('T')[0];
          const cutoffDateStrFormatted = cutoffDate.toISOString().split('T')[0];
          const qualifies = userCreatedAt <= cutoffDate;
          reason = `registered ${userDateStr}, cutoff is ${cutoffDateStrFormatted} (${qualifies ? 'SHOULD QUALIFY - check date comparison logic!' : 'registered too late'})`;
        } else if (badge.trigger.type === 'action') {
          if (badge.trigger.action === 'firstOrder') {
            const ordersPlaced = getMetricValue('ordersPlaced', statsData as Parameters<typeof getMetricValue>[1]);
            reason = `needs first order (ordersPlaced === 1), has ${ordersPlaced}`;
          } else {
            reason = `action ${badge.trigger.action} condition not met`;
          }
        } else if (badge.trigger.type === 'streak') {
          const value = getMetricValue('longestOrderStreak', statsData as Parameters<typeof getMetricValue>[1]);
          reason = `needs streak of ${badge.trigger.count}, has ${value}`;
        } else if (badge.trigger.type === 'combo') {
          reason = `combo condition not met (${badge.trigger.conditions.length} conditions)`;
        } else {
          reason = 'condition not met';
        }
        console.log(`  ❌ Not eligible: ${badge.id} - ${reason}`);
      }
    }

    if (userBadgesAwarded === 0) {
      console.log('  📭 No new badges earned');
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('✨ Migration complete!');
  console.log(`   📊 ${totalStats} user stats created/updated`);
  console.log(`   🏆 ${totalBadges} badges awarded`);
  console.log('═'.repeat(50) + '\n');
}

// Run migration
migrateUserBadges()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
