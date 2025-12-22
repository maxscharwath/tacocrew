# Implementation Plan: Badge & Rewards System

## Overview

Implement a gamification system that rewards users with badges for achievements. Based on the specification in `docs/BADGE_SYSTEM_SPEC.md`.

---

## Files to Create/Modify

### Backend - New Files

| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | Add UserBadge & UserStats models |
| `apps/api/src/schemas/badge.schema.ts` | Zod schemas + BadgeId branded type |
| `apps/api/src/config/badges.config.ts` | Badge definitions (declarative) |
| `apps/api/src/infrastructure/repositories/badge.repository.ts` | UserBadge CRUD |
| `apps/api/src/infrastructure/repositories/user-stats.repository.ts` | UserStats CRUD |
| `apps/api/src/services/badge/badge.service.ts` | Get badges, check progress |
| `apps/api/src/services/badge/badge-evaluation.service.ts` | Evaluate & award badges |
| `apps/api/src/services/badge/stats-tracking.service.ts` | Update user stats |
| `apps/api/src/services/badge/trigger-evaluators/*.ts` | Trigger type evaluators |
| `apps/api/src/api/routes/badge.routes.ts` | Badge API endpoints |

### Backend - Modify Files

| File | Change |
|------|--------|
| `apps/api/src/services/user-order/create-user-order.service.ts` | Hook: update stats after order |
| `apps/api/src/services/group-order/submit-group-order.service.ts` | Hook: evaluate badges after submit |
| `apps/api/src/services/organization/organization.service.ts` | Hook: track org joins/creates |
| `apps/api/src/index.ts` | Register badge routes |

### Frontend - New Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/api/badges.ts` | Badge API client |
| `apps/web/src/routes/profile.badges.tsx` | Badge collection page |
| `apps/web/src/components/badges/BadgeIcon.tsx` | Single badge display |
| `apps/web/src/components/badges/BadgeGrid.tsx` | Badge grid layout |
| `apps/web/src/components/badges/BadgeProgress.tsx` | Progress indicator |
| `apps/web/src/components/badges/BadgeUnlockedToast.tsx` | Achievement toast |
| `apps/web/src/hooks/useBadges.ts` | Badge data hook |

### Frontend - Modify Files

| File | Change |
|------|--------|
| `apps/web/src/routes/profile.tsx` | Add badges section |
| `apps/web/src/locales/en.json` | Badge translations |
| `apps/web/src/locales/fr.json` | Badge translations |

---

## Implementation Steps

### Phase 1: Database & Core Types

#### Step 1.1: Add Prisma Schema
- [ ] Add `UserBadge` model to `schema.prisma`
- [ ] Add `UserStats` model to `schema.prisma`
- [ ] Add relation to `User` model
- [ ] Run `bun prisma migrate dev`

```prisma
model UserBadge {
  id        String   @id @default(uuid())
  userId    String
  badgeId   String
  earnedAt  DateTime @default(now())
  context   Json?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
  @@index([userId])
  @@index([badgeId])
  @@map("user_badges")
}

model UserStats {
  id                    String   @id @default(uuid())
  userId                String   @unique

  // Ordering
  tacosOrdered          Int      @default(0)
  mysteryTacosOrdered   Int      @default(0)
  ordersPlaced          Int      @default(0)
  totalSpentCentimes    Int      @default(0)

  // Leadership
  groupOrdersCreated    Int      @default(0)
  groupOrdersLed        Int      @default(0)

  // Social
  organizationsJoined   Int      @default(0)
  organizationsCreated  Int      @default(0)
  membersInvited        Int      @default(0)
  timesPaidForOthers    Int      @default(0)
  timesGotReimbursed    Int      @default(0)

  // Exploration (JSON arrays)
  meatsTried            Json     @default("[]")
  saucesTried           Json     @default("[]")
  garnituresTried       Json     @default("[]")

  // Streaks
  currentOrderStreak    Int      @default(0)
  longestOrderStreak    Int      @default(0)
  lastOrderWeek         Int?
  lastOrderYear         Int?

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_stats")
}
```

#### Step 1.2: Create Badge Schema
- [ ] Create `apps/api/src/schemas/badge.schema.ts`
- [ ] Define `BadgeId` branded type
- [ ] Define trigger type schemas
- [ ] Define `BadgeDefinition` schema

#### Step 1.3: Create Badge Configuration
- [ ] Create `apps/api/src/config/badges.config.ts`
- [ ] Define `defineBadge()` helper
- [ ] Define initial badge set (ordering, mystery, social, etc.)

---

### Phase 2: Repositories

#### Step 2.1: Badge Repository
- [ ] Create `apps/api/src/infrastructure/repositories/badge.repository.ts`
- [ ] Implement `create()`, `findByUserId()`, `getEarnedBadgeIds()`, `exists()`

#### Step 2.2: UserStats Repository
- [ ] Create `apps/api/src/infrastructure/repositories/user-stats.repository.ts`
- [ ] Implement `getOrCreate()`, `increment()`, `addToArray()`, `updateStreak()`

---

### Phase 3: Services

#### Step 3.1: Stats Tracking Service
- [ ] Create `apps/api/src/services/badge/stats-tracking.service.ts`
- [ ] Methods: `trackOrderCreated()`, `trackTacoOrdered()`, `trackGroupOrderLed()`, etc.
- [ ] Each method increments relevant counters

#### Step 3.2: Trigger Evaluators
- [ ] Create `apps/api/src/services/badge/trigger-evaluators/count.evaluator.ts`
- [ ] Create `apps/api/src/services/badge/trigger-evaluators/action.evaluator.ts`
- [ ] Create `apps/api/src/services/badge/trigger-evaluators/date.evaluator.ts`
- [ ] Create `apps/api/src/services/badge/trigger-evaluators/time.evaluator.ts`
- [ ] Create `apps/api/src/services/badge/trigger-evaluators/streak.evaluator.ts`
- [ ] Create `apps/api/src/services/badge/trigger-evaluators/combo.evaluator.ts`
- [ ] Create `apps/api/src/services/badge/trigger-evaluators/index.ts` (factory)

#### Step 3.3: Badge Evaluation Service
- [ ] Create `apps/api/src/services/badge/badge-evaluation.service.ts`
- [ ] Implement `evaluateAfterEvent(userId, event)` - main entry point
- [ ] Filter badges by event type
- [ ] Check each trigger using evaluators
- [ ] Award new badges
- [ ] Return newly earned badges (for toast notifications)

#### Step 3.4: Badge Service
- [ ] Create `apps/api/src/services/badge/badge.service.ts`
- [ ] Implement `getAllBadges()` - returns badge definitions
- [ ] Implement `getUserBadges(userId)` - returns earned badges
- [ ] Implement `getBadgeProgress(userId)` - returns progress toward unearned badges

---

### Phase 4: Event Hooks

#### Step 4.1: Order Creation Hook
- [ ] Modify `apps/api/src/services/user-order/create-user-order.service.ts`
- [ ] After order created: call `statsTrackingService.trackOrderCreated()`
- [ ] Count tacos, mystery tacos, ingredients
- [ ] Update stats

#### Step 4.2: Group Order Submit Hook
- [ ] Modify `apps/api/src/services/group-order/submit-group-order.service.ts`
- [ ] After submit: evaluate badges for leader
- [ ] Track `groupOrdersLed` stat

#### Step 4.3: Organization Hooks
- [ ] Modify `apps/api/src/services/organization/organization.service.ts`
- [ ] Track org joins, creates, invites

#### Step 4.4: Payment Hooks
- [ ] Hook into reimbursement flow for "paid for others" badges

---

### Phase 5: API Routes

#### Step 5.1: Badge Routes
- [ ] Create `apps/api/src/api/routes/badge.routes.ts`
- [ ] `GET /api/v1/badges` - List all badge definitions
- [ ] `GET /api/v1/badges/:id` - Get single badge
- [ ] `GET /api/v1/users/me/badges` - Get user's earned badges
- [ ] `GET /api/v1/users/me/badges/progress` - Get progress
- [ ] `GET /api/v1/users/:id/badges` - Get other user's public badges

#### Step 5.2: Register Routes
- [ ] Add badge routes to `apps/api/src/index.ts`

---

### Phase 6: Frontend

#### Step 6.1: API Client
- [ ] Create `apps/web/src/lib/api/badges.ts`
- [ ] Define types: `Badge`, `UserBadge`, `BadgeProgress`
- [ ] Implement API functions

#### Step 6.2: Badge Components
- [ ] Create `BadgeIcon.tsx` - renders badge emoji/icon with tier styling
- [ ] Create `BadgeGrid.tsx` - grid of badges with empty slots
- [ ] Create `BadgeProgress.tsx` - progress bar toward a badge
- [ ] Create `BadgeUnlockedToast.tsx` - celebration toast

#### Step 6.3: Badge Hook
- [ ] Create `useBadges.ts` hook
- [ ] Fetch user badges and progress
- [ ] Handle loading/error states

#### Step 6.4: Profile Page Integration
- [ ] Create `profile.badges.tsx` route (full badge collection)
- [ ] Add badge preview section to `profile.tsx`
- [ ] Show top 8 badges + "View All" link

#### Step 6.5: Achievement Toasts
- [ ] Integrate toast into order creation flow
- [ ] Show when new badges earned

---

### Phase 7: Translations

#### Step 7.1: English Translations
- [ ] Add badge names and descriptions to `en.json`
- [ ] Add UI strings (progress, earned, locked, etc.)

#### Step 7.2: French Translations
- [ ] Add badge names and descriptions to `fr.json`

---

### Phase 8: Testing

#### Step 8.1: Unit Tests
- [ ] Test trigger evaluators (count, date, time, streak)
- [ ] Test badge evaluation service
- [ ] Test stats tracking

#### Step 8.2: Integration Tests
- [ ] Test full flow: order → stats update → badge earned
- [ ] Test API endpoints

---

### Phase 9: Future (Manual)

#### Step 9.1: Backfill Script
- [ ] Create `apps/api/scripts/backfill-badges.ts`
- [ ] Query all users with order history
- [ ] Compute stats from historical orders
- [ ] Award qualifying badges
- [ ] Can be run manually when ready

---

## Edge Cases to Handle

1. **Race conditions**: Multiple orders at once shouldn't double-count stats
2. **Retroactive badges**: When adding new badges, users who already qualify should earn them
3. **Deleted users**: Cascade delete badges and stats
4. **Clock skew**: Time-based badges should use server time
5. **Empty stock**: Mystery taco badges only count when tacos actually ordered
6. **Streak edge cases**: Week boundaries, timezone handling

---

## Testing Strategy

```
Unit Tests:
├── trigger-evaluators/
│   ├── count.evaluator.test.ts
│   ├── date.evaluator.test.ts
│   ├── time.evaluator.test.ts
│   └── streak.evaluator.test.ts
├── badge-evaluation.service.test.ts
└── stats-tracking.service.test.ts

Integration Tests:
├── badge.routes.test.ts
└── badge-flow.test.ts (order → badge earned)
```

---

## Performance Considerations

1. **Batch stats updates**: Update multiple counters in single DB call
2. **Lazy evaluation**: Only check badges relevant to the event
3. **Cache badge definitions**: They're static, no need to fetch each time
4. **Index on userId**: For fast badge lookups
5. **Avoid N+1**: Use includes/joins when fetching badges with user data

---

## Decisions

1. **Badge notifications**: Yes - use existing NotificationService to send push when badges earned
2. **Retroactive awarding**: No migration - create a standalone script (`scripts/backfill-badges.ts`) to run manually later
3. **Public badges**: TBD - can decide during frontend implementation
4. **Badge rarity**: TBD - nice-to-have for later

---

## Dependencies

- Prisma migration for new tables
- No new npm packages needed
- Uses existing notification infrastructure for toasts

