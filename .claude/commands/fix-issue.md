---
description: Fix a GitHub issue by number - analyzes, plans, implements, and creates PR
---

Fix GitHub issue: $ARGUMENTS

## Workflow

### 1. Fetch Issue Details
```bash
gh issue view $ARGUMENTS
```

Read the issue description, labels, and comments to understand:
- What's the bug/feature request?
- Steps to reproduce (if bug)
- Expected vs actual behavior
- Any suggested solutions

### 2. Explore Codebase
- Use grep/glob to find relevant files
- Read existing code to understand context
- Identify the root cause (for bugs)
- Understand existing patterns

### 3. Create Implementation Plan
Use `/plan` or create a plan with TodoWrite:
- List files to modify
- Break down steps
- Consider edge cases
- Plan testing strategy

### 4. Implement Solution
Follow the plan and guidelines:
- Read relevant GUIDELINES.md file for the project
- Follow coding standards
- Add tests
- Keep changes focused and minimal

### 5. Verify Solution
- Run tests: `bun test`
- Type check: `bun tsc --noEmit`
- Lint: `bun biome check .`
- Manual testing if needed

### 6. Review Code
Run `/review-code` to ensure:
- Guidelines compliance
- No regressions
- Code quality
- All checks pass

### 7. Create PR
```bash
# Commit changes
git add .
git commit -m "fix: [description]

Fixes #$ARGUMENTS"

# Push and create PR
git push origin HEAD
gh pr create --fill
```

Link the PR to the issue by including "Fixes #$ARGUMENTS" in commit message.

### 8. Summary
Provide:
- Summary of changes made
- Link to created PR
- Any notes for reviewers

## Example Usage

```bash
/fix-issue 123
```

This will:
1. Fetch issue #123 details
2. Analyze and create a plan
3. Implement the fix
4. Run all checks
5. Create a PR that closes the issue

## Tips

- Ask clarifying questions if issue is unclear
- Keep changes minimal and focused
- Add tests to prevent regression
- Update documentation if needed
- Reference the issue number in commits
