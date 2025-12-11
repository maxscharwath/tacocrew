---
description: Quick code quality check - runs TypeScript, Biome, and tests
---

Run quick code quality checks without committing.

## What This Does

Runs all code quality checks in parallel:
1. TypeScript compilation check
2. Biome linting and formatting
3. Test suite

## Checks to Run

```bash
# Run these in parallel for speed
bun tsc --noEmit &      # TypeScript check
bun biome check . &     # Linting + formatting
bun test &              # Run tests
wait
```

## Report Results

After checks complete, provide a summary:

```markdown
# Code Quality Report

## ✅ Passed
- [x] TypeScript compilation
- [x] Biome checks
- [x] Tests (45 passed)

## ❌ Failed
None - all checks passed!
```

Or if there are failures:

```markdown
# Code Quality Report

## ✅ Passed
- [x] Tests (45 passed)

## ❌ Failed

### TypeScript Errors (3)
apps/api/src/services/user.service.ts:45:12
  Error: Type 'string' is not assignable to type 'UserId'

apps/web/src/components/Button.tsx:23:5
  Error: Property 'onClick' does not exist on type 'ButtonProps'

### Biome Issues (5)
- 2 formatting issues (auto-fixable)
- 3 unused imports

## 🔧 Suggested Fixes

1. TypeScript errors:
   - Use UserId.parse() to create branded UserId
   - Add onClick to ButtonProps type

2. Biome issues:
   - Run: bun biome check --write .
```

## Options

If user wants to auto-fix issues:
```bash
# Fix biome issues automatically
bun biome check --write .

# Re-run checks
bun tsc --noEmit && bun biome check . && bun test
```

## When to Use

Use `/check` when:
- You've made changes and want quick feedback
- Before committing (though `/review-code` is more comprehensive)
- During development to catch issues early
- After refactoring to ensure nothing broke

## Difference from /review-code

`/check` - Quick quality checks only
`/review-code` - Comprehensive review including:
  - Quality checks
  - Code review against guidelines
  - Complexity analysis
  - Dead code detection
  - Security checks

Use `/check` for quick feedback during development.
Use `/review-code` before committing.
