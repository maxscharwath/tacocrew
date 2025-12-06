---
description: Think through and create an implementation plan before coding
---

**IMPORTANT**: Before writing any code, create a detailed implementation plan.

## Instructions

1. **Understand the Request**
   - Clarify any ambiguous requirements
   - Ask questions if anything is unclear
   - Identify which project(s) will be modified

2. **Read Relevant Files**
   - Use tab-completion to find and read existing code
   - Understand current patterns and architecture
   - Identify files that need to be modified

3. **Create a Plan**
   Use the TodoWrite tool to create a structured plan with:
   - Clear, actionable steps
   - Specific files to modify or create
   - Dependencies between steps
   - Testing strategy

4. **Think Through Edge Cases**
   Consider:
   - Error handling
   - Type safety
   - Performance implications
   - Breaking changes

5. **Present the Plan**
   Show the plan to the user and ask:
   - Does this approach make sense?
   - Are there any concerns?
   - Should we proceed with implementation?

## Example Plan Format

```markdown
# Implementation Plan: [Feature Name]

## Files to Modify
- apps/api/src/services/user/create-user.service.ts
- apps/web/src/routes/users.create.tsx
- packages/ui-kit/src/button.tsx

## Steps
1. [pending] Create UserService with @injectable decorator
2. [pending] Add branded UserId type
3. [pending] Implement Zod validation schema
4. [pending] Create frontend form component using ui-kit
5. [pending] Write tests
6. [pending] Review with /review-code

## Edge Cases to Handle
- Duplicate user detection
- Invalid email format
- Network errors

## Testing Strategy
- Unit tests for UserService
- Integration test for user creation flow
- Frontend form validation tests
```

## After Planning

Once the plan is approved:
1. Work through each step sequentially
2. Update todo statuses as you progress
3. Ask for feedback if you encounter blockers
4. Run `/review-code` before committing

**Remember**: A good plan prevents rework and ensures quality implementation!
