/**
 * Badge Trigger Configuration - Backend Only
 * @module config/badges
 *
 * This config only defines HOW badges are earned (triggers).
 * Display data (name, description, image, tier, category) is in FE config.
 *
 * To add a new badge:
 * 1. Add entry here with id and trigger
 * 2. Add display data to FE config (apps/web/src/config/badges.config.ts)
 * 3. Add PNG image to FE assets (apps/web/src/assets/badges/{id}.png)
 * 4. Add translation keys to locales
 */

import type { BadgeDefinition } from '@/schemas/badge.schema';

export const BADGES: readonly BadgeDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Ordering Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'taco-rookie',
    trigger: { type: 'count', metric: 'tacosOrdered', threshold: 1 },
  },
  {
    id: 'taco-fan',
    trigger: { type: 'count', metric: 'tacosOrdered', threshold: 10 },
  },
  {
    id: 'taco-legend',
    trigger: { type: 'count', metric: 'tacosOrdered', threshold: 50 },
  },
  {
    id: 'king-of-tacos',
    trigger: { type: 'count', metric: 'tacosOrdered', threshold: 100 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Mystery Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'feeling-lucky',
    trigger: { type: 'count', metric: 'mysteryTacosOrdered', threshold: 1 },
  },
  {
    id: 'mystery-fan',
    trigger: { type: 'count', metric: 'mysteryTacosOrdered', threshold: 5 },
  },
  {
    id: 'mystery-master',
    trigger: { type: 'count', metric: 'mysteryTacosOrdered', threshold: 10 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leadership Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'first-command',
    trigger: { type: 'count', metric: 'groupOrdersLed', threshold: 1 },
  },
  {
    id: 'squad-leader',
    trigger: { type: 'count', metric: 'groupOrdersLed', threshold: 5 },
  },
  {
    id: 'commander',
    trigger: { type: 'count', metric: 'groupOrdersLed', threshold: 20 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Social Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'team-player',
    trigger: { type: 'count', metric: 'organizationsJoined', threshold: 1 },
  },
  {
    id: 'generous',
    trigger: { type: 'count', metric: 'timesPaidForOthers', threshold: 1 },
  },
  {
    id: 'founder',
    // Awarded to all users who registered on or before the specified date
    trigger: {
      type: 'date',
      condition: { type: 'registeredBefore', date: '2025-11-14' }, // TODO: Update with the actual cutoff date
    },
  },
  {
    id: 'inviter',
    trigger: { type: 'count', metric: 'membersInvited', threshold: 3 },
  },
  {
    id: 'big-spender',
    trigger: { type: 'count', metric: 'totalSpentCentimes', threshold: 5000 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Exploration Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'meat-explorer',
    trigger: { type: 'count', metric: 'uniqueMeatsTried', threshold: 5 },
  },
  {
    id: 'sauce-sommelier',
    trigger: { type: 'count', metric: 'uniqueSaucesTried', threshold: 5 },
  },
  {
    id: 'flavor-master',
    trigger: {
      type: 'combo',
      conditions: [
        { type: 'count', metric: 'uniqueMeatsTried', threshold: 5 },
        { type: 'count', metric: 'uniqueSaucesTried', threshold: 5 },
      ],
    },
  },
  {
    id: 'garniture-guru',
    trigger: { type: 'count', metric: 'uniqueGarnituresTried', threshold: 5 },
  },
  {
    id: 'variety-seeker',
    trigger: {
      type: 'combo',
      conditions: [
        { type: 'count', metric: 'uniqueMeatsTried', threshold: 5 },
        { type: 'count', metric: 'uniqueSaucesTried', threshold: 5 },
        { type: 'count', metric: 'uniqueGarnituresTried', threshold: 5 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Loyalty Badges (Streaks)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'on-fire',
    trigger: { type: 'streak', activity: 'orderedInWeek', count: 3 },
  },
  {
    id: 'unstoppable',
    trigger: { type: 'streak', activity: 'orderedInWeek', count: 8 },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Special Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'early-adopter',
    // Awarded to all users who registered on or before the specified date
    trigger: {
      type: 'date',
      condition: { type: 'registeredBefore', date: '2025-11-14' },
    },
  },
  {
    id: 'lucky-13',
    secret: true,
    trigger: {
      type: 'date',
      condition: { type: 'dayAndWeekday', day: 13, weekday: 5 },
    },
  },
  {
    id: 'anniversary',
    trigger: {
      type: 'date',
      condition: { type: 'anniversary', field: 'accountCreated' },
    },
  },
  {
    id: 'night-owl',
    secret: true,
    trigger: {
      type: 'time',
      condition: { type: 'between', fromHour: 0, toHour: 5 },
    },
  },
  {
    id: 'early-bird',
    secret: true,
    trigger: {
      type: 'time',
      condition: { type: 'before', hour: 8 },
    },
  },
  {
    id: 'lunch-rush',
    secret: true,
    trigger: {
      type: 'time',
      condition: { type: 'between', fromHour: 11, toHour: 14 },
    },
  },
  {
    id: 'dinner-time',
    secret: true,
    trigger: {
      type: 'time',
      condition: { type: 'between', fromHour: 18, toHour: 20 },
    },
  },
  {
    id: 'weekend-warrior',
    secret: true,
    trigger: {
      type: 'date',
      condition: { type: 'dayOfWeek', day: 6 }, // Saturday
    },
  },
  {
    id: 'taco-friday',
    secret: true,
    trigger: {
      type: 'date',
      condition: { type: 'dayOfWeek', day: 5 }, // Friday
    },
  },
];
