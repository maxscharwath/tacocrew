# Badge & Rewards System Specification

## Overview

A gamification system that rewards users with badges for various achievements. Designed with excellent developer experience (DX) in mind - adding new badges should be declarative, type-safe, and require minimal boilerplate.

## Goals

1. **Engaging**: Make ordering tacos more fun with collectible achievements
2. **Discoverable**: Users can see available badges and progress toward them
3. **Extensible**: Easy to add new badges without touching core logic
4. **Type-safe**: Full TypeScript support with autocomplete for badge definitions
5. **Performant**: Badges evaluated efficiently, not on every request

---

## Badge Structure

### Badge Definition

```typescript
interface BadgeDefinition {
  /** Unique identifier (kebab-case) */
  id: BadgeId;

  /** Display name */
  name: string;

  /** Localization key for name */
  nameKey: `badges.${string}.name`;

  /** Description of how to earn */
  descriptionKey: `badges.${string}.description`;

  /** Emoji or icon identifier */
  icon: string;

  /** Visual style/rarity */
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

  /** Category for grouping */
  category: BadgeCategory;

  /** Trigger condition */
  trigger: BadgeTrigger;

  /** Optional: only available during certain period */
  availability?: {
    from?: Date;
    until?: Date;
  };

  /** Optional: hidden until earned */
  secret?: boolean;
}
```

### Badge Instance (User's Earned Badge)

```typescript
interface UserBadge {
  /** Badge definition ID */
  badgeId: BadgeId;

  /** User who earned it */
  userId: UserId;

  /** When it was earned */
  earnedAt: Date;

  /** Context of how it was earned */
  context?: {
    orderId?: string;
    groupOrderId?: string;
    value?: number; // e.g., the count that triggered it
  };
}
```

---

## Trigger Types

### 1. Count-Based Triggers

Awarded when a counter reaches a threshold.

```typescript
interface CountTrigger {
  type: 'count';

  /** What to count */
  metric:
    // Ordering
    | 'tacosOrdered'
    | 'mysteryTacosOrdered'
    | 'ordersPlaced'
    | 'totalSpentCentimes'
    // Leadership
    | 'groupOrdersCreated'
    | 'groupOrdersLed'
    // Social
    | 'organizationsJoined'
    | 'organizationsCreated'
    | 'membersInvited'
    | 'timesPaidForOthers'
    | 'timesGotReimbursed'
    // Exploration (computed from JSON arrays)
    | 'uniqueMeatsTried'
    | 'uniqueSaucesTried'
    | 'uniqueGarnituresTried';

  /** Threshold to reach */
  threshold: number;

  /** Comparison operator (default: gte) */
  operator?: 'eq' | 'gte' | 'lte';
}
```

**Examples:**
- 🌮 **Taco Rookie** - Order your first taco (`tacosOrdered >= 1`)
- 🌮🌮 **Taco Enthusiast** - Order 10 tacos (`tacosOrdered >= 10`)
- 🌮🌮🌮 **Taco Veteran** - Order 50 tacos (`tacosOrdered >= 50`)
- 👑 **Taco Legend** - Order 100 tacos (`tacosOrdered >= 100`)
- 🎲 **Mystery Explorer** - Order 1 mystery taco (`mysteryTacosOrdered >= 1`)
- 🎲🎲 **Mystery Master** - Order 10 mystery tacos (`mysteryTacosOrdered >= 10`)
- 💰 **Big Spender** - Spend 500 CHF total (`totalSpent >= 50000`)

### 2. Action-Based Triggers

Awarded when a specific action is performed.

```typescript
interface ActionTrigger {
  type: 'action';

  /** Action that triggers the badge */
  action:
    | 'firstOrder'
    | 'firstMysteryTaco'
    | 'firstGroupOrderCreated'
    | 'firstGroupOrderLed'
    | 'joinedOrganization'
    | 'createdOrganization'
    | 'invitedMember'
    | 'paidForSomeoneElse'
    | 'gotReimbursed';
}
```

**Examples:**
- 🎉 **Welcome** - Place your first order
- 🎲 **Feeling Lucky** - Order your first mystery taco
- 👥 **Team Player** - Join an organization
- 🤝 **Generous** - Pay for someone else's order

### 3. Role-Based Triggers

Awarded based on user's role or status.

```typescript
interface RoleTrigger {
  type: 'role';

  /** Role that grants the badge */
  role:
    | 'groupOrderLeader'
    | 'organizationAdmin'
    | 'organizationOwner';

  /** Optional: minimum times in this role */
  minCount?: number;
}
```

**Examples:**
- 👑 **Leader** - Lead your first group order
- 🏢 **Administrator** - Become an organization admin
- 👔 **Founder** - Create an organization

### 4. Date-Based Triggers

Awarded for ordering on special dates.

```typescript
interface DateTrigger {
  type: 'date';

  /** Date condition */
  condition:
    | { type: 'dayOfWeek'; day: 0 | 1 | 2 | 3 | 4 | 5 | 6 } // 0 = Sunday
    | { type: 'specificDate'; month: number; day: number }   // e.g., Dec 25th
    | { type: 'dayAndWeekday'; day: number; weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6 } // e.g., 13th & Friday
    | { type: 'anniversary'; field: 'accountCreated' }
    | { type: 'range'; from: string; until: string };        // ISO dates
}
```

**Examples:**
- 🍀 **Lucky 13** - Order on Friday the 13th (`dayAndWeekday: { day: 13, weekday: 5 }`)
- 🎄 **Holiday Spirit** - Order on Dec 25th (`specificDate: { month: 12, day: 25 }`)
- 🎂 **Anniversary** - Order on your account anniversary
- 🚀 **Early Adopter** - Order during launch week

### 5. Time-Based Triggers

Awarded for ordering at specific times.

```typescript
interface TimeTrigger {
  type: 'time';

  /** Time condition (hours in 24h format, local time) */
  condition:
    | { type: 'after'; hour: number }                    // e.g., after 22:00
    | { type: 'before'; hour: number }                   // e.g., before 6:00
    | { type: 'between'; fromHour: number; toHour: number }; // e.g., 0:00-5:00
}
```

**Examples:**
- 🌙 **Night Owl** - Order between midnight and 5am (`between: { fromHour: 0, toHour: 5 }`)
- 🌅 **Early Bird** - Order before 8am (`before: { hour: 8 }`)
- 🦇 **After Dark** - Order after 10pm (`after: { hour: 22 }`)

### 6. Streak-Based Triggers

Awarded for consecutive activity.

```typescript
interface StreakTrigger {
  type: 'streak';

  /** What constitutes the streak */
  activity: 'orderedInWeek' | 'orderedInMonth' | 'ledGroupOrder';

  /** Consecutive periods required */
  count: number;
}
```

**Examples:**
- 🔥 **On Fire** - Order 3 weeks in a row
- ⚡ **Unstoppable** - Order 10 weeks in a row
- 📅 **Regular** - Order every month for 6 months

### 7. Combo-Based Triggers

Awarded for specific combinations.

```typescript
interface ComboTrigger {
  type: 'combo';

  /** All conditions must be met */
  conditions: BadgeTrigger[];
}
```

**Examples:**
- 🌈 **Flavor Explorer** - Try all available sauces
- 🥩 **Meat Lover** - Try all available meats
- 🏆 **Completionist** - Earn all bronze badges

---

## Badge Categories

```typescript
type BadgeCategory =
  | 'ordering'      // Related to placing orders
  | 'mystery'       // Related to mystery tacos
  | 'social'        // Related to groups & organizations
  | 'leadership'    // Related to leading orders
  | 'exploration'   // Related to trying new things
  | 'loyalty'       // Related to consistent activity
  | 'special';      // Limited time or secret badges
```

---

## Developer Experience (DX)

### Defining Badges

Badges are defined declaratively in a single file:

```typescript
// apps/api/src/config/badges.config.ts

import { defineBadge, defineBadges } from '@/services/badge/badge.utils';

export const BADGES = defineBadges([
  // Ordering badges
  defineBadge({
    id: 'taco-rookie',
    nameKey: 'badges.tacoRookie.name',
    descriptionKey: 'badges.tacoRookie.description',
    icon: '🌮',
    tier: 'bronze',
    category: 'ordering',
    trigger: { type: 'count', metric: 'tacosOrdered', threshold: 1 },
  }),

  defineBadge({
    id: 'taco-enthusiast',
    nameKey: 'badges.tacoEnthusiast.name',
    descriptionKey: 'badges.tacoEnthusiast.description',
    icon: '🌮',
    tier: 'silver',
    category: 'ordering',
    trigger: { type: 'count', metric: 'tacosOrdered', threshold: 10 },
  }),

  defineBadge({
    id: 'mystery-explorer',
    nameKey: 'badges.mysteryExplorer.name',
    descriptionKey: 'badges.mysteryExplorer.description',
    icon: '🎲',
    tier: 'bronze',
    category: 'mystery',
    trigger: { type: 'count', metric: 'mysteryTacosOrdered', threshold: 1 },
  }),

  // Secret badge
  defineBadge({
    id: 'lucky-13',
    nameKey: 'badges.lucky13.name',
    descriptionKey: 'badges.lucky13.description',
    icon: '🍀',
    tier: 'gold',
    category: 'special',
    secret: true,
    trigger: {
      type: 'date',
      condition: { type: 'dayAndWeekday', day: 13, weekday: 5 } // Friday (5) the 13th
    },
  }),

  // Time-based badge
  defineBadge({
    id: 'night-owl',
    nameKey: 'badges.nightOwl.name',
    descriptionKey: 'badges.nightOwl.description',
    icon: '🌙',
    tier: 'bronze',
    category: 'special',
    secret: true,
    trigger: {
      type: 'time',
      condition: { type: 'between', fromHour: 0, toHour: 5 }
    },
  }),

  // Limited time badge
  defineBadge({
    id: 'early-adopter',
    nameKey: 'badges.earlyAdopter.name',
    descriptionKey: 'badges.earlyAdopter.description',
    icon: '🚀',
    tier: 'legendary',
    category: 'special',
    trigger: { type: 'action', action: 'firstOrder' },
    availability: {
      until: new Date('2025-03-01'), // Only available during beta
    },
  }),
]);

// Type-safe badge ID
export type BadgeId = typeof BADGES[number]['id'];
```

### Helper Function

```typescript
// Type-safe badge definition helper
function defineBadge<T extends BadgeDefinition>(badge: T): T {
  return badge;
}

function defineBadges<T extends readonly BadgeDefinition[]>(badges: T): T {
  return badges;
}
```

### Adding a New Badge

To add a new badge, simply add an entry to the `BADGES` array:

```typescript
defineBadge({
  id: 'new-badge-id',
  nameKey: 'badges.newBadge.name',
  descriptionKey: 'badges.newBadge.description',
  icon: '🆕',
  tier: 'bronze',
  category: 'ordering',
  trigger: { type: 'count', metric: 'tacosOrdered', threshold: 5 },
}),
```

That's it! No other code changes needed. The system will:
1. Automatically register the badge
2. Start tracking progress for all users
3. Award it when conditions are met
4. Display it in the UI

---

## Database Schema

### Tables

```prisma
// User's earned badges
model UserBadge {
  id        String   @id @default(uuid())

  userId    String
  user      User     @relation(fields: [userId], references: [id])

  badgeId   String   // References badge definition ID

  earnedAt  DateTime @default(now())

  // Context of how it was earned
  context   Json?    // { orderId?, groupOrderId?, value? }

  @@unique([userId, badgeId])
  @@index([userId])
  @@index([badgeId])
}

// User statistics for badge evaluation
model UserStats {
  id                    String   @id @default(uuid())

  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])

  // Ordering counters
  tacosOrdered          Int      @default(0)
  mysteryTacosOrdered   Int      @default(0)
  ordersPlaced          Int      @default(0)
  totalSpentCentimes    Int      @default(0)

  // Leadership counters
  groupOrdersCreated    Int      @default(0)
  groupOrdersLed        Int      @default(0)

  // Social counters
  organizationsJoined   Int      @default(0)
  organizationsCreated  Int      @default(0)
  membersInvited        Int      @default(0)
  timesPaidForOthers    Int      @default(0)
  timesGotReimbursed    Int      @default(0)

  // Unique items tried (stored as JSON arrays of IDs)
  meatsTried            Json     @default("[]")
  saucesTried           Json     @default("[]")
  garnituresTried       Json     @default("[]")

  // Streak tracking
  currentOrderStreak    Int      @default(0)
  longestOrderStreak    Int      @default(0)
  lastOrderWeek         Int?     // ISO week number
  lastOrderYear         Int?

  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([userId])
}
```

---

## API Design

### Endpoints

```
GET  /api/v1/badges                    # List all badge definitions
GET  /api/v1/badges/:id                # Get badge definition
GET  /api/v1/users/me/badges           # Get user's earned badges
GET  /api/v1/users/me/badges/progress  # Get progress toward unearned badges
GET  /api/v1/users/:id/badges          # Get another user's public badges
```

### Response Examples

**GET /api/v1/badges**
```json
{
  "badges": [
    {
      "id": "taco-rookie",
      "name": "Taco Rookie",
      "description": "Order your first taco",
      "icon": "🌮",
      "tier": "bronze",
      "category": "ordering"
    },
    {
      "id": "mystery-explorer",
      "name": "Mystery Explorer",
      "description": "Order your first Taco Mystère",
      "icon": "🎲",
      "tier": "bronze",
      "category": "mystery"
    }
  ]
}
```

**GET /api/v1/users/me/badges**
```json
{
  "badges": [
    {
      "badgeId": "taco-rookie",
      "earnedAt": "2025-01-15T12:00:00Z",
      "badge": {
        "id": "taco-rookie",
        "name": "Taco Rookie",
        "icon": "🌮",
        "tier": "bronze"
      }
    }
  ],
  "stats": {
    "total": 3,
    "byTier": { "bronze": 2, "silver": 1 },
    "byCategory": { "ordering": 2, "mystery": 1 }
  }
}
```

**GET /api/v1/users/me/badges/progress**
```json
{
  "progress": [
    {
      "badgeId": "taco-enthusiast",
      "badge": {
        "id": "taco-enthusiast",
        "name": "Taco Enthusiast",
        "icon": "🌮",
        "tier": "silver"
      },
      "progress": {
        "current": 7,
        "target": 10,
        "percentage": 70
      }
    },
    {
      "badgeId": "mystery-master",
      "badge": {
        "id": "mystery-master",
        "name": "Mystery Master",
        "icon": "🎲",
        "tier": "gold"
      },
      "progress": {
        "current": 2,
        "target": 10,
        "percentage": 20
      }
    }
  ]
}
```

---

## Badge Evaluation

### When to Evaluate

Badges are evaluated at specific trigger points, not continuously:

| Event | Badges to Check |
|-------|-----------------|
| Order created | Count-based (orders, tacos), Action (firstOrder), Date-based |
| Mystery taco ordered | Mystery-related badges |
| Group order created | Leadership badges |
| Group order submitted | Leader badges, streak badges |
| User joins organization | Social badges |
| Weekly cron job | Streak badges (expired streaks) |

### Evaluation Service

```typescript
@injectable()
export class BadgeEvaluationService {

  /** Evaluate all applicable badges after an event */
  async evaluateAfterEvent(
    userId: UserId,
    event: BadgeEvent
  ): Promise<UserBadge[]> {
    const user = await this.userService.getUserById(userId);
    const stats = await this.statsService.getOrCreateStats(userId);
    const earnedBadgeIds = await this.badgeRepository.getEarnedBadgeIds(userId);

    const newBadges: UserBadge[] = [];

    for (const badge of this.getApplicableBadges(event)) {
      if (earnedBadgeIds.has(badge.id)) continue;
      if (!this.isAvailable(badge)) continue;

      if (this.checkTrigger(badge.trigger, stats, event)) {
        const userBadge = await this.awardBadge(userId, badge, event);
        newBadges.push(userBadge);
      }
    }

    return newBadges;
  }

  /** Check if trigger condition is met */
  private checkTrigger(
    trigger: BadgeTrigger,
    stats: UserStats,
    event: BadgeEvent
  ): boolean {
    switch (trigger.type) {
      case 'count':
        return this.checkCountTrigger(trigger, stats);
      case 'action':
        return this.checkActionTrigger(trigger, event);
      case 'date':
        return this.checkDateTrigger(trigger, event);
      case 'streak':
        return this.checkStreakTrigger(trigger, stats);
      case 'time':
        return this.checkTimeTrigger(trigger, event);
      case 'combo':
        return trigger.conditions.every(c => this.checkTrigger(c, stats, event));
    }
  }
}
```

---

## Mystery Taco Integration

The badge system integrates with the Taco Mystère feature to track mystery taco orders.

### Stats Updates

When a mystery taco is ordered, the `StatsTrackingService` increments:
- `tacosOrdered` (counts toward regular taco badges too)
- `mysteryTacosOrdered` (counts toward mystery-specific badges)

### Badge Events

```typescript
// When user adds a mystery taco to their order
type MysteryTacoOrderedEvent = {
  type: 'mysteryTacoOrdered';
  userId: UserId;
  orderId: OrderId;
  tacoSize: TacoSize;
  timestamp: Date;
};
```

### Related Badges

| Badge | Trigger | Notes |
|-------|---------|-------|
| 🎲 Feeling Lucky | First mystery taco | `mysteryTacosOrdered >= 1` |
| 🎲 Mystery Fan | 5 mystery tacos | `mysteryTacosOrdered >= 5` |
| 🎲 Mystery Master | 10 mystery tacos | `mysteryTacosOrdered >= 10` |
| 🎲 Chaos Embracer | 25 mystery tacos | `mysteryTacosOrdered >= 25` |

### Implementation Notes

1. **Order Creation Hook**: When an order contains a mystery taco (`isMystery: true`), call `badgeEvaluationService.evaluateAfterEvent(userId, { type: 'mysteryTacoOrdered', ... })`

2. **Stats Sync**: The `mysteryTacosOrdered` counter must be incremented **before** badge evaluation runs, so the count-based triggers work correctly.

3. **Double Counting**: A mystery taco counts as both a regular taco AND a mystery taco, so users progress toward both badge tracks simultaneously.

---

## Frontend Display

### Badge Components

```typescript
// Badge display component
<Badge
  badge={badge}
  size="sm" | "md" | "lg"
  showTooltip
/>

// Badge grid for profile
<BadgeGrid
  badges={userBadges}
  emptySlots={8} // Show empty slots for unearned badges
/>

// Progress indicator
<BadgeProgress
  badge={badge}
  progress={progress}
/>

// Achievement notification (toast)
<BadgeUnlockedToast
  badge={newBadge}
  onDismiss={...}
/>
```

### Profile Page Section

```
┌─────────────────────────────────────────────────┐
│  🏆 Badges (7/24)                               │
├─────────────────────────────────────────────────┤
│  🌮  🌮  🎲  👥  👑  🔥  🍀                      │
│  ○   ○   ○   ○   ○   ○   ○   ○                  │
│                                                 │
│  [View All Badges]                              │
└─────────────────────────────────────────────────┘
```

### Badge Detail Modal

```
┌─────────────────────────────────────────────────┐
│                     🎲                          │
│              Mystery Master                      │
│                   GOLD                          │
│                                                 │
│   Order 10 Taco Mystère                         │
│                                                 │
│   ████████░░░░░░░░░░  4/10                      │
│                                                 │
│   Category: Mystery                             │
│   Rarity: 12% of users have this badge          │
└─────────────────────────────────────────────────┘
```

---

## Initial Badge Set

### Ordering Badges
| Badge | Tier | Trigger |
|-------|------|---------|
| 🌮 Taco Rookie | Bronze | 1 taco ordered |
| 🌮 Taco Fan | Silver | 10 tacos ordered |
| 🌮 Taco Veteran | Gold | 50 tacos ordered |
| 👑 Taco Legend | Platinum | 100 tacos ordered |
| 💎 Taco God | Legendary | 500 tacos ordered |

### Mystery Badges
| Badge | Tier | Trigger |
|-------|------|---------|
| 🎲 Feeling Lucky | Bronze | First mystery taco |
| 🎲 Mystery Fan | Silver | 5 mystery tacos |
| 🎲 Mystery Master | Gold | 10 mystery tacos |
| 🎲 Chaos Embracer | Platinum | 25 mystery tacos |

### Leadership Badges
| Badge | Tier | Trigger |
|-------|------|---------|
| 👑 First Command | Bronze | Lead first group order |
| 👑 Squad Leader | Silver | Lead 5 group orders |
| 👑 Commander | Gold | Lead 20 group orders |

### Social Badges
| Badge | Tier | Trigger |
|-------|------|---------|
| 👥 Team Player | Bronze | Join an organization |
| 🤝 Generous | Silver | Pay for someone else |
| 🏢 Founder | Gold | Create an organization |

### Exploration Badges
| Badge | Tier | Trigger |
|-------|------|---------|
| 🥩 Meat Explorer | Silver | Try 5 different meats |
| 🌶️ Sauce Sommelier | Silver | Try 5 different sauces |
| 🌈 Flavor Master | Gold | Try all meats AND all sauces |

### Loyalty Badges
| Badge | Tier | Trigger |
|-------|------|---------|
| 🔥 On Fire | Bronze | 3-week order streak |
| ⚡ Unstoppable | Silver | 8-week order streak |
| 💪 Devoted | Gold | 16-week order streak |

### Special Badges
| Badge | Tier | Trigger | Notes |
|-------|------|---------|-------|
| 🚀 Early Adopter | Legendary | `action: firstOrder` + `availability.until` | Limited time |
| 🍀 Lucky 13 | Gold | `date: dayAndWeekday(13, Friday)` | Secret |
| 🎂 Anniversary | Silver | `date: anniversary(accountCreated)` | Yearly |
| 🌙 Night Owl | Bronze | `time: between(0, 5)` | Secret |
| 🌅 Early Bird | Bronze | `time: before(8)` | Secret |

---

## Implementation Phases

### Phase 1: Core Infrastructure
- Database schema (UserBadge, UserStats)
- Badge definition system
- Stats tracking service
- Basic evaluation service

### Phase 2: Badge Logic
- Implement all trigger type evaluators (count, action, role, date, time, streak, combo)
- Event hooks for badge evaluation
- Badge award notifications

### Phase 3: API & Frontend
- Badge API endpoints
- Profile badge display
- Progress tracking UI
- Achievement toasts

### Phase 4: Polish
- Add initial badge set
- Translations
- Testing
- Analytics (badge rarity stats)

---

## Future Enhancements

- **Badge levels**: Same badge with multiple levels (Bronze → Silver → Gold)
- **Seasonal badges**: Monthly/seasonal limited badges
- **Challenge badges**: Time-limited challenges ("Order 5 tacos this week")
- **Social badges**: "Referred a friend", "Most orders in organization"
- **Leaderboards**: Top badge collectors, most rare badges
- **Badge trading**: Trade duplicate badges (if we add duplicates)
