# TacoCrew

A modern taco ordering application built with React, Hono, and Prisma.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Run all apps in development
bun dev

# Run specific app
bun dev:api   # Backend only
bun dev:web   # Frontend only

# Build all projects
bun build

# Run tests
bun test
```

## 📁 Project Structure

This is a **monorepo** managed with bun workspaces and Turbo:

```
tacobot/
├── apps/
│   ├── api/          # Backend API (Hono + Prisma + TypeScript)
│   ├── web/          # Frontend (React + Vite + React Router v7)
│   └── storybook/    # Component documentation
├── packages/
│   ├── ui-kit/             # Shared React component library
│   └── gigatacos-client/   # External API client
└── .claude/          # Claude Code configuration
```

## 🤖 Development with Claude Code

This project is optimized for AI-assisted development using [Claude Code](https://claude.ai/download).

### Getting Started with Claude Code

1. **Install Claude Code**: Download from [claude.ai/download](https://claude.ai/download)
2. **Open project**: `cd tacobot && claude`
3. **Start coding**: Claude automatically loads `CLAUDE.md` with project context

### Workflow

We follow a structured **Explore → Plan → Code → Review** workflow:

#### 1. Explore Phase
Before coding, explore and understand:

```bash
# Ask Claude to read and explain
"Read these files and explain the authentication flow"

# Use tab-completion for file paths
"Read apps/api/src/<TAB>"
```

#### 2. Plan Phase
Create a plan before implementing:

```bash
/plan
```

This will:
- Analyze requirements
- Identify files to modify
- Create structured todo list
- Consider edge cases
- Get your approval before coding

#### 3. Code Phase
Implement following our coding guidelines:

```bash
"Implement the plan we discussed"
```

Claude will:
- Read relevant guidelines automatically
- Follow project conventions
- Write type-safe code
- Add tests

#### 4. Review Phase
Always review before committing:

```bash
/review-code
```

This checks:
- ✅ Guidelines compliance (no `any`, no `as`, proper patterns)
- ✅ TypeScript compilation (`tsc --noEmit`)
- ✅ Linting and formatting (`biome check`)
- ✅ Tests passing
- ✅ No dead code
- ✅ DRY principle applied

### Custom Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `/plan` | Create implementation plan | `/plan` |
| `/review-code` | Pre-commit code review | `/review-code` |
| `/check` | Quick quality checks | `/check` |
| `/fix-issue` | Fix GitHub issue end-to-end | `/fix-issue 123` |
| `/release` | Create new release | `/release` |
| `/clear` | Clear context between tasks | `/clear` |

### Best Practices

**Be Specific**: Detailed requests work better
```bash
# ❌ Vague
"add tests"

# ✅ Specific
"write test for user logout edge case when token is expired, avoid mocks"
```

**Use Visual Feedback**: Paste screenshots for design work
- macOS: `Cmd+Ctrl+Shift+4` → `Ctrl+V` to paste

**Clear Context Frequently**: Use `/clear` between unrelated tasks
```bash
# After completing a feature
/clear

# Start fresh on next task
"Let's implement user authentication"
```

**Follow the Workflow**:
```bash
/plan              # 1. Plan first
# implement...     # 2. Code
/review-code       # 3. Review
git commit         # 4. Commit
/clear             # 5. Clear for next task
```

## 📚 Coding Guidelines

We maintain strict coding standards documented in:

- **`GUIDELINES.md`** - Universal rules (all projects)
- **`apps/api/GUIDELINES.md`** - Backend patterns
- **`apps/web/GUIDELINES.md`** - Frontend patterns
- **`packages/ui-kit/GUIDELINES.md`** - Component library
- **`packages/gigatacos-client/GUIDELINES.md`** - API client

### Critical Rules

#### Universal (All Code)
- ❌ **NEVER use `any` types** - Use proper types or `unknown` + type guards
- ❌ **NEVER use `as` assertions** - Use Zod parsing or type guards
- ❌ **NO Claude/Anthropic mentions in commits** - Keep commits professional
- ✅ All props must be `readonly`
- ✅ Apply DRY principle

#### Backend (apps/api/)
- ✅ Use `@injectable()` decorator on services/repositories
- ✅ Use `inject()` helper for dependencies
- ✅ Use branded IDs (UserId, TacoId, OrderId)
- ✅ Validate with Zod schemas
- ✅ Follow clean architecture: routes → services → repositories

#### Frontend (apps/web/)
- ✅ **ALWAYS use ui-kit components** - Never create custom buttons/cards/inputs
- ✅ Import from `@/components/ui`
- ✅ Use Tailwind CSS only (no CSS modules)
- ✅ Extract complex state to custom hooks

#### UI-Kit (packages/ui-kit/)
- ✅ **JSDoc + Storybook required** for every component
- ✅ Use CVA for variants
- ✅ Use Radix UI for complex components

## 🔧 Common Tasks

### Adding a New Feature

```bash
# 1. Create a plan
/plan

# 2. Implement
# (Claude follows the plan)

# 3. Review
/review-code

# 4. Commit
git add .
git commit -m "feat: add user profile settings"

# 5. Clear context
/clear
```

### Fixing a Bug

```bash
# Quick fix from GitHub issue
/fix-issue 123

# Manual process
/plan
# implement fix
/review-code
git commit -m "fix: resolve race condition in order submission"
```

### Quick Quality Check

```bash
# During development
/check

# Runs in parallel:
# - TypeScript compilation
# - Biome linting
# - Tests
```

## 🚢 Release Process

```bash
# Automated release
/release

# This will:
# 1. Calculate next version (CalVer: 0.YYMM.patch)
# 2. Update all package.json files
# 3. Commit and push changes
# 4. Create git tag
# 5. Generate release notes
# 6. Create GitHub release
```

See [RELEASE.md](./RELEASE.md) for detailed release documentation.

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific project tests
bun --filter @tacobot/api test
bun --filter @tacobot/web test

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

## 🎨 Code Quality

```bash
# Check everything
bun biome check .

# Auto-fix issues
bun biome check --write .

# TypeScript check
bun tsc --noEmit

# Format code
bun biome format --write .
```

## 📦 Technology Stack

### Backend (apps/api)
- **Framework**: Hono (fast web framework)
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **DI**: TSyringe
- **Auth**: Better Auth
- **Testing**: Vitest

### Frontend (apps/web)
- **Framework**: React 19
- **Router**: React Router v7
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **Testing**: Vitest

### Shared
- **Package Manager**: bun
- **Monorepo**: Turbo
- **Language**: TypeScript (strict mode)
- **Linting**: Biome
- **Versioning**: CalVer (0.YYMM.patch)

## 📖 Documentation

- **General Guidelines**: [GUIDELINES.md](./GUIDELINES.md)
- **Release Process**: [RELEASE.md](./RELEASE.md)
- **Claude Code Context**: [CLAUDE.md](./CLAUDE.md) (auto-loaded)
- **Backend API Docs**: [apps/api/GUIDELINES.md](./apps/api/GUIDELINES.md)
- **Frontend Docs**: [apps/web/GUIDELINES.md](./apps/web/GUIDELINES.md)
- **Component Library**: [packages/ui-kit/GUIDELINES.md](./packages/ui-kit/GUIDELINES.md)

## 🤝 Contributing

1. Read [GUIDELINES.md](./GUIDELINES.md) for coding standards
2. Use `/plan` before implementing features
3. Follow the Explore → Plan → Code → Review workflow
4. Run `/review-code` before committing
5. Keep commits clean (no AI tool mentions)
6. Use `/clear` between unrelated tasks
