---
description: Review code changes against guidelines before committing
---

Perform a comprehensive code review of staged changes before committing. This review ensures code quality, guideline compliance, and code health.

## Review Process

### 1. **Identify Changed Files**

Run `git status` and `git diff --cached --name-only` to see staged files.

If no files are staged, inform the user and suggest:
```bash
git add .
```

### 2. **Read Relevant Guidelines**

Based on the changed files, read the appropriate guideline files:

- If files in `apps/api/`: Read `apps/api/GUIDELINES.md`
- If files in `apps/web/`: Read `apps/web/GUIDELINES.md`
- If files in `packages/ui-kit/`: Read `packages/ui-kit/GUIDELINES.md`
- If files in `packages/gigatacos-client/`: Read `packages/gigatacos-client/GUIDELINES.md`
- Always read `GUIDELINES.md` for universal rules

### 3. **Run Static Checks**

Execute these checks in parallel and report results:

```bash
# TypeScript compilation check
bun tsc --noEmit

# Biome linting and formatting
bun biome check .

# Run tests
bun test
```

If any checks fail:
- Report the errors clearly
- Suggest fixes
- Ask if the user wants you to fix them

### 4. **Review Code Changes**

For each changed file, analyze:

#### A. **Guideline Compliance**

**Universal Rules** (check ALL files):
- ❌ No `any` types used
- ❌ No `as` type assertions (except `as const`)
- ✅ Props marked as `readonly`
- ✅ Proper TypeScript types

**Backend API** (apps/api/):
- ✅ Services use `@injectable()` decorator
- ✅ Dependencies injected via `inject()`
- ✅ Entity IDs use branded types (UserId, TacoId, etc.)
- ✅ Request/response validated with Zod
- ✅ Custom error classes used
- ✅ Clean architecture respected (routes → services → repositories)

**Frontend Web** (apps/web/):
- ✅ UI-kit components used (no custom buttons, cards, inputs)
- ✅ Imports from `@/components/ui`
- ✅ Tailwind CSS only (no CSS modules)
- ✅ Complex state extracted to hooks
- ✅ `cx()` utility used for class merging

**UI-Kit** (packages/ui-kit/):
- ✅ CVA used for variants
- ✅ Radix UI for complex components
- ✅ Design tokens used
- ✅ Refs forwarded for form components

#### B. **Code Quality**

**Complexity**:
- ❌ Flag overly complex functions (>20 lines, >3 levels of nesting)
- ✅ Suggest simplification (extract functions, use early returns)

**DRY Principle**:
- ❌ Flag duplicate code
- ✅ Suggest extracting to shared functions/hooks/components

**Dead Code**:
- ❌ Flag unused imports
- ❌ Flag unused variables/functions
- ❌ Flag commented-out code
- ✅ Suggest removal

**Naming**:
- ✅ Variables/functions have descriptive names
- ✅ Naming follows conventions (camelCase, PascalCase)

**Error Handling**:
- ✅ Errors properly handled
- ✅ No silent failures
- ✅ Appropriate error types used

#### C. **Performance**

- ❌ Flag unnecessary re-renders (missing useMemo/useCallback)
- ❌ Flag expensive operations in render
- ✅ Suggest optimizations

#### D. **Security**

- ❌ Flag potential XSS vulnerabilities
- ❌ Flag SQL injection risks (should use Prisma parameterized queries)
- ❌ Flag exposed secrets
- ✅ Input validation present

### 5. **Generate Review Report**

Create a structured report:

```markdown
# Code Review Report

## ✅ Passed Checks
- [x] TypeScript compilation
- [x] Biome checks
- [x] Tests passing

## ⚠️ Issues Found

### Critical Issues (Must Fix)
1. **File**: `apps/api/src/services/order.service.ts`
   - **Issue**: Using `any` type on line 45
   - **Rule**: No `any` types allowed (GUIDELINES.md)
   - **Fix**: Use proper type or `unknown` with type guard

### Warnings (Should Fix)
1. **File**: `apps/web/src/components/CustomButton.tsx`
   - **Issue**: Custom button component created
   - **Rule**: Always use ui-kit Button (apps/web/GUIDELINES.md)
   - **Fix**: Replace with `import { Button } from '@/components/ui'`

### Suggestions (Consider)
1. **File**: `apps/api/src/services/user.service.ts`
   - **Issue**: Function `processUserData` is 35 lines long
   - **Suggestion**: Extract sub-functions for better readability

## 📊 Code Quality Metrics
- Files changed: 5
- Lines added: 120
- Lines removed: 45
- Guideline violations: 2 critical, 1 warning
- Dead code found: 3 unused imports

## 🎯 Recommendations

1. Fix critical issues before committing
2. Consider addressing warnings for better code quality
3. Run `bun biome check --write` to auto-fix formatting

## Next Steps

Would you like me to:
1. Fix the identified issues automatically?
2. Explain any of the issues in detail?
3. Proceed with commit after you fix manually?
```

### 6. **Offer to Fix Issues**

After presenting the report, ask the user:

```
I found [X] issues in your code. Would you like me to:
1. Fix all issues automatically
2. Fix only critical issues
3. Explain the issues so you can fix them manually
4. Skip and commit anyway (not recommended)
```

If user chooses option 1 or 2:
- Fix the issues
- Run checks again to verify
- Show diff of changes
- Ask for confirmation before committing

### 7. **Final Confirmation**

If all checks pass or issues are fixed:

```
✅ All checks passed! Your code is ready to commit.

Would you like me to:
1. Create a commit with these changes
2. Show you the git diff first
3. Exit without committing
```

## Important Notes

- **Be thorough but not pedantic** - Focus on real issues, not nitpicks
- **Explain the why** - Don't just say something is wrong, explain why it violates guidelines
- **Offer solutions** - Always suggest concrete fixes
- **Respect user choice** - If they want to commit anyway, warn but allow it
- **Check context** - Some rules may have exceptions, consider the context

## Examples of Issues to Flag

### Critical (Must Fix)
```typescript
// ❌ Using any
function process(data: any) { }

// ❌ Using as assertion
const id = value as string;

// ❌ Missing DI in backend
class UserService {
  private repo = new UserRepository(); // Should use inject()
}

// ❌ Custom button in frontend
function MyButton() {
  return <button className="...">Click</button>; // Should use ui-kit
}
```

### Warnings (Should Fix)
```typescript
// ⚠️ Complex function
function processOrder(order) {
  // 40 lines of nested if statements
}

// ⚠️ Duplicate code
function formatUserName(user) {
  return user.firstName + ' ' + user.lastName;
}
function formatAdminName(admin) {
  return admin.firstName + ' ' + admin.lastName; // Duplicate!
}

// ⚠️ Dead code
import { unused } from 'lib'; // Never used
```

### Suggestions (Nice to Have)
```typescript
// 💡 Could use early return
function validate(data) {
  if (data) {
    if (data.name) {
      if (data.email) {
        return true;
      }
    }
  }
  return false;
}

// Better:
function validate(data) {
  if (!data?.name || !data?.email) return false;
  return true;
}
```

## Success Criteria

✅ No TypeScript errors
✅ Biome checks pass
✅ Tests pass
✅ No `any` or `as` types
✅ Guidelines followed
✅ No dead code
✅ DRY principle applied
✅ Complexity under control
