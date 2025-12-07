# TacoCrew Development Guide

> **Auto-loaded by Claude Code** - Concise reference for AI-assisted development

## 🎯 Quick Context

**Project**: TacoCrew - Monorepo taco ordering app
**Versioning**: CalVer (0.YYMM.patch)
**Stack**: React + Hono + Prisma + TypeScript + Tailwind + Bun

```
apps/api/          # Backend (Hono + Prisma + DI)
apps/web/          # Frontend (React + Router + Vite)
packages/ui-kit/   # Component library (Radix UI)
```

## 🚨 Critical Rules (YOU MUST Follow)

### Code Quality
- ❌ NEVER `any` types → use proper types or `unknown` + guards
- ❌ NEVER `as` assertions → use Zod/guards (except `as const`)
- ❌ NEVER Claude mentions in commits → keep professional
- ✅ `readonly` props always
- ✅ DRY principle

### By Project
- **Backend**: `@injectable()` + `inject()` + branded IDs (UserId) + Zod
- **Frontend**: ui-kit ONLY (no custom buttons/cards) + Tailwind + hooks
- **UI-Kit**: JSDoc + Storybook required + CVA + Radix UI

See detailed rules: `GUIDELINES.md` + project-specific `*/GUIDELINES.md`

## 📋 Development Workflow

```
/plan              → Create implementation plan
# implement...     → Code following guidelines
/review-code       → Check quality before commit
git commit         → Clean commits (no AI mentions)
/clear             → Clear context for next task
```

## 💡 Best Practices

**Be Specific**:
- ❌ "add tests"
- ✅ "test user logout when token expired, avoid mocks"

**Use Tab-Completion**: Type path + Tab for file navigation

**Visual Feedback**: Paste screenshots (Cmd+Ctrl+Shift+4 → Ctrl+V)

**Clear Often**: `/clear` between unrelated tasks for better performance

**TDD Flow**: Write tests → fail → implement → pass → `/review-code`

## 🛠️ Essential Commands

```bash
# Development
bun dev                    # All apps
bun dev:api / dev:web      # Specific app

# Quality
bun biome check --write .  # Lint + format
bun tsc --noEmit           # Type check
bun test                   # Tests

# Claude Commands
/plan                       # Plan implementation
/review-code               # Pre-commit review
/check                     # Quick quality check
/fix-issue 123             # Fix GitHub issue
/release                   # Create release
/clear                     # Clear context
```

## 🔍 Guidelines

Read ONLY what you need (token efficiency):
- **Always**: `GUIDELINES.md` (universal)
- **Backend work**: + `apps/api/GUIDELINES.md`
- **Frontend work**: + `apps/web/GUIDELINES.md`
- **UI-Kit work**: + `packages/ui-kit/GUIDELINES.md`

Full docs: See [README.md](./README.md)

## 🚫 Common Mistakes

1. Creating custom UI instead of using ui-kit
2. Forgetting `@injectable()` on services
3. Plain strings for IDs instead of branded types
4. Not reading guidelines first
5. Adding AI attribution to commits

---

**Pro Tips**: Use emphasis keywords ("IMPORTANT", "YOU MUST") in requests. Be explicit. Clear context frequently. Iterate with visual feedback for design work.
