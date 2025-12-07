# TacoCrew Coding Guidelines - Smart Loading

## 🎯 Strategy: Read ONLY What You Need

**Save tokens by being selective!** Don't read all guidelines - only read what's relevant to your current task.

### Step 1: Identify Your Project

Look at the file path to determine which project you're working in:

```
apps/api/**              → Backend API
apps/web/**              → Frontend Web
packages/ui-kit/**       → UI Component Library
packages/gigatacos-client/** → API Client
```

### Step 2: Read Guidelines Selectively

**ALWAYS read** (small, essential):
- ✅ `GUIDELINES.md` - Universal rules for all projects

**THEN read project-specific** (only if working in that project):
- Backend? → `apps/api/GUIDELINES.md`
- Frontend? → `apps/web/GUIDELINES.md`
- UI-Kit? → `packages/ui-kit/GUIDELINES.md`
- API Client? → `packages/gigatacos-client/GUIDELINES.md`

### Step 3: Apply Rules

**Universal Rules** (always):
- ❌ NO `any` types
- ❌ NO `as` assertions (except `as const`)
- ✅ `readonly` props
- ✅ DRY principle

**Project-Specific Rules** (only when working in that project):

| Project | Key Rules |
|---------|-----------|
| **Backend** | `@injectable()` + `inject()`, branded IDs (UserId, TacoId), Zod validation |
| **Frontend** | ui-kit components from `@/components/ui`, Tailwind only, hooks for state |
| **UI-Kit** | CVA variants, Radix UI primitives, design tokens |
| **API Client** | Type-safe parsers, custom errors, cookie jar |

---

## 📋 Quick Examples

### Example 1: Backend Work
```typescript
// Working on: apps/api/src/services/user.service.ts
// Read: GUIDELINES.md + apps/api/GUIDELINES.md
// Skip: apps/web/GUIDELINES.md, packages/*/GUIDELINES.md
```

### Example 2: Frontend Work
```typescript
// Working on: apps/web/src/components/OrderCard.tsx
// Read: GUIDELINES.md + apps/web/GUIDELINES.md
// Skip: apps/api/GUIDELINES.md, packages/*/GUIDELINES.md
```

### Example 3: Full-Stack Work
```typescript
// Working on: apps/api/src/routes/orders.ts + apps/web/src/routes/orders.tsx
// Read: GUIDELINES.md + apps/api/GUIDELINES.md + apps/web/GUIDELINES.md
// Skip: packages/*/GUIDELINES.md
```

---

## ✅ Pre-Commit Checklist (Quick)

- [ ] No `any` or `as` (except `as const`)
- [ ] Type safety maintained
- [ ] Project guidelines followed
- [ ] `bun tsc --noEmit` passes
- [ ] `bun biome check` passes
- [ ] No dead code
- [ ] DRY applied

**Tip:** Use `/review-code` command for automated checking!
