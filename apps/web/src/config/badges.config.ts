/**
 * Badge Definitions - Frontend Configuration
 *
 * This is the single source of truth for badge definitions in the frontend.
 * Images are loaded via Vite and converted to WebP automatically.
 *
 * To add a new badge:
 * 1. Add PNG image to src/assets/badges/{badge-id}.png
 * 2. Add entry here
 * 3. Add translation keys to locales
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

export type BadgeCategory =
  | 'ordering'
  | 'mystery'
  | 'social'
  | 'leadership'
  | 'exploration'
  | 'loyalty'
  | 'special';

/**
 * Function to format a progress value for display
 */
export type BadgeValueFormatter = (value: number) => string;

export interface BadgeDefinition {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly image: string;
  readonly tier: BadgeTier;
  readonly category: BadgeCategory;
  readonly secret?: boolean;
  readonly threshold?: number;
  /** Optional formatter for progress values (e.g., to convert centimes to CHF) */
  readonly valueFormatter?: BadgeValueFormatter;
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Loading
// ─────────────────────────────────────────────────────────────────────────────

// Import all badge images via Vite glob - converts to WebP
const badgeImages = import.meta.glob<{ default: string }>('@/assets/badges/*.png', {
  query: { format: 'webp', w: 525 },
  eager: true,
});

function getBadgeImage(id: string): string {
  const key = `/src/assets/badges/${id}.png`;
  return badgeImages[key]?.default ?? '';
}

/**
 * All badge definitions
 */
export const BADGES: readonly BadgeDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Ordering Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'taco-rookie',
    nameKey: 'badges.tacoRookie.name',
    descriptionKey: 'badges.tacoRookie.description',
    image: getBadgeImage('taco-rookie'),
    tier: 'bronze',
    category: 'ordering',
    threshold: 1,
  },
  {
    id: 'taco-fan',
    nameKey: 'badges.tacoFan.name',
    descriptionKey: 'badges.tacoFan.description',
    image: getBadgeImage('taco-fan'),
    tier: 'silver',
    category: 'ordering',
    threshold: 10,
  },
  {
    id: 'taco-legend',
    nameKey: 'badges.tacoVeteran.name',
    descriptionKey: 'badges.tacoVeteran.description',
    image: getBadgeImage('taco-legend'),
    tier: 'gold',
    category: 'ordering',
    threshold: 50,
  },
  {
    id: 'king-of-tacos',
    nameKey: 'badges.tacoLegend.name',
    descriptionKey: 'badges.tacoLegend.description',
    image: getBadgeImage('king-of-tacos'),
    tier: 'platinum',
    category: 'ordering',
    threshold: 100,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Mystery Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'feeling-lucky',
    nameKey: 'badges.feelingLucky.name',
    descriptionKey: 'badges.feelingLucky.description',
    image: getBadgeImage('feeling-lucky'),
    tier: 'bronze',
    category: 'mystery',
    threshold: 1,
  },
  {
    id: 'mystery-fan',
    nameKey: 'badges.mysteryFan.name',
    descriptionKey: 'badges.mysteryFan.description',
    image: getBadgeImage('mystery-fan'),
    tier: 'silver',
    category: 'mystery',
    threshold: 5,
  },
  {
    id: 'mystery-master',
    nameKey: 'badges.mysteryMaster.name',
    descriptionKey: 'badges.mysteryMaster.description',
    image: getBadgeImage('mystery-master'),
    tier: 'gold',
    category: 'mystery',
    threshold: 10,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Leadership Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'first-command',
    nameKey: 'badges.firstCommand.name',
    descriptionKey: 'badges.firstCommand.description',
    image: getBadgeImage('first-command'),
    tier: 'bronze',
    category: 'leadership',
    threshold: 1,
  },
  {
    id: 'squad-leader',
    nameKey: 'badges.squadLeader.name',
    descriptionKey: 'badges.squadLeader.description',
    image: getBadgeImage('squad-leader'),
    tier: 'silver',
    category: 'leadership',
    threshold: 5,
  },
  {
    id: 'commander',
    nameKey: 'badges.commander.name',
    descriptionKey: 'badges.commander.description',
    image: getBadgeImage('commander'),
    tier: 'gold',
    category: 'leadership',
    threshold: 20,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Social Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'team-player',
    nameKey: 'badges.teamPlayer.name',
    descriptionKey: 'badges.teamPlayer.description',
    image: getBadgeImage('team-player'),
    tier: 'bronze',
    category: 'social',
    threshold: 1,
  },
  {
    id: 'generous',
    nameKey: 'badges.generous.name',
    descriptionKey: 'badges.generous.description',
    image: getBadgeImage('generous'),
    tier: 'silver',
    category: 'social',
    threshold: 1,
  },
  {
    id: 'founder',
    nameKey: 'badges.founder.name',
    descriptionKey: 'badges.founder.description',
    image: getBadgeImage('founder'),
    tier: 'gold',
    category: 'social',
    threshold: 1,
  },
  {
    id: 'inviter',
    nameKey: 'badges.inviter.name',
    descriptionKey: 'badges.inviter.description',
    image: getBadgeImage('inviter'),
    tier: 'silver',
    category: 'social',
    threshold: 3,
  },
  {
    id: 'big-spender',
    nameKey: 'badges.bigSpender.name',
    descriptionKey: 'badges.bigSpender.description',
    image: getBadgeImage('big-spender'),
    tier: 'gold',
    category: 'social',
    threshold: 5000,
    // Convert centimes to CHF for display
    valueFormatter: (value: number) => {
      const chfValue = value / 100;
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'CHF',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(chfValue);
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Exploration Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'meat-explorer',
    nameKey: 'badges.meatExplorer.name',
    descriptionKey: 'badges.meatExplorer.description',
    image: getBadgeImage('meat-explorer'),
    tier: 'silver',
    category: 'exploration',
    threshold: 5,
  },
  {
    id: 'sauce-sommelier',
    nameKey: 'badges.sauceSommelier.name',
    descriptionKey: 'badges.sauceSommelier.description',
    image: getBadgeImage('sauce-sommelier'),
    tier: 'silver',
    category: 'exploration',
    threshold: 5,
  },
  {
    id: 'flavor-master',
    nameKey: 'badges.flavorMaster.name',
    descriptionKey: 'badges.flavorMaster.description',
    image: getBadgeImage('flavor-master'),
    tier: 'gold',
    category: 'exploration',
  },
  {
    id: 'garniture-guru',
    nameKey: 'badges.garnitureGuru.name',
    descriptionKey: 'badges.garnitureGuru.description',
    image: getBadgeImage('garniture-guru'),
    tier: 'silver',
    category: 'exploration',
    threshold: 5,
  },
  {
    id: 'variety-seeker',
    nameKey: 'badges.varietySeeker.name',
    descriptionKey: 'badges.varietySeeker.description',
    image: getBadgeImage('variety-seeker'),
    tier: 'platinum',
    category: 'exploration',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Loyalty Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'on-fire',
    nameKey: 'badges.onFire.name',
    descriptionKey: 'badges.onFire.description',
    image: getBadgeImage('on-fire'),
    tier: 'bronze',
    category: 'loyalty',
    threshold: 3,
  },
  {
    id: 'unstoppable',
    nameKey: 'badges.unstoppable.name',
    descriptionKey: 'badges.unstoppable.description',
    image: getBadgeImage('unstoppable'),
    tier: 'silver',
    category: 'loyalty',
    threshold: 8,
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Special Badges
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'early-adopter',
    nameKey: 'badges.earlyAdopter.name',
    descriptionKey: 'badges.earlyAdopter.description',
    image: getBadgeImage('early-adopter'),
    tier: 'legendary',
    category: 'special',
  },
  {
    id: 'lucky-13',
    nameKey: 'badges.lucky13.name',
    descriptionKey: 'badges.lucky13.description',
    image: getBadgeImage('lucky-13'),
    tier: 'gold',
    category: 'special',
    secret: true,
  },
  {
    id: 'anniversary',
    nameKey: 'badges.anniversary.name',
    descriptionKey: 'badges.anniversary.description',
    image: getBadgeImage('anniversary'),
    tier: 'silver',
    category: 'special',
  },
  {
    id: 'night-owl',
    nameKey: 'badges.nightOwl.name',
    descriptionKey: 'badges.nightOwl.description',
    image: getBadgeImage('night-owl'),
    tier: 'bronze',
    category: 'special',
    secret: true,
  },
  {
    id: 'early-bird',
    nameKey: 'badges.earlyBird.name',
    descriptionKey: 'badges.earlyBird.description',
    image: getBadgeImage('early-bird'),
    tier: 'bronze',
    category: 'special',
    secret: true,
  },
  {
    id: 'lunch-rush',
    nameKey: 'badges.lunchRush.name',
    descriptionKey: 'badges.lunchRush.description',
    image: getBadgeImage('lunch-rush'),
    tier: 'bronze',
    category: 'special',
    secret: true,
  },
  {
    id: 'dinner-time',
    nameKey: 'badges.dinnerTime.name',
    descriptionKey: 'badges.dinnerTime.description',
    image: getBadgeImage('dinner-time'),
    tier: 'bronze',
    category: 'special',
    secret: true,
  },
  {
    id: 'weekend-warrior',
    nameKey: 'badges.weekendWarrior.name',
    descriptionKey: 'badges.weekendWarrior.description',
    image: getBadgeImage('weekend-warrior'),
    tier: 'silver',
    category: 'special',
    secret: true,
  },
  {
    id: 'taco-friday',
    nameKey: 'badges.tacoFriday.name',
    descriptionKey: 'badges.tacoFriday.description',
    image: getBadgeImage('taco-friday'),
    tier: 'gold',
    category: 'special',
    secret: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/** Object for O(1) lookup by ID */
const badgesById: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGES.map((b) => [b.id, b])
);

/** Get badge by ID */
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return badgesById[id];
}

/** Get all badges */
export function getAllBadges(): readonly BadgeDefinition[] {
  return BADGES;
}

/** Get visible badges (non-secret or earned) */
export function getVisibleBadges(earnedIds?: ReadonlySet<string>): BadgeDefinition[] {
  return BADGES.filter((b) => !b.secret || earnedIds?.has(b.id));
}
