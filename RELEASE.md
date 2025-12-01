# Release Process

This document describes the versioning system and release process for TacoCrew.

## Versioning Scheme

We use a **CalVer** (Calendar Versioning) scheme:

```
0.YYMM.patch
```

| Part | Description | Example |
|------|-------------|---------|
| `0` | Beta prefix (will become `1` at stable release) | `0` |
| `YY` | Two-digit year | `25` for 2025 |
| `MM` | Two-digit month | `12` for December |
| `patch` | Patch number within the month | `0`, `1`, `2`... |

### Examples

- `0.2511.0` → First release in November 2025
- `0.2511.1` → Patch release in November 2025
- `0.2512.0` → First release in December 2025
- `1.2601.0` → First stable release in January 2026

## Creating a Release

### Prerequisites

- [GitHub CLI](https://cli.github.com/) installed and authenticated
- Write access to the repository

### Steps

#### 1. Update Version Numbers

Update the version in all `package.json` files:

```bash
# Root and all packages
./package.json
./apps/api/package.json
./apps/web/package.json
./apps/storybook/package.json
./packages/ui-kit/package.json
./packages/gigatacos-client/package.json
```

#### 2. Commit Changes

```bash
git add -A
git commit -m "chore: bump version to 0.YYMM.X"
git push origin main
```

#### 3. Create Git Tag

```bash
# Create annotated tag
git tag -a v0.YYMM.X -m "Release description"

# Push tag to GitHub
git push origin v0.YYMM.X
```

#### 4. Create GitHub Release

Using GitHub CLI:

```bash
gh release create v0.YYMM.X \
  --title "v0.YYMM.X - Release Title" \
  --notes "## 🌮 Release Title

*Month Day, Year*

Brief description of the release.

### ✨ Features

- **Feature Name** - Description

### 🐛 Bug Fixes

- Fixed something

### 🔧 Improvements

- Improved something"
```

Or create via GitHub web interface:
1. Go to **Releases** → **Draft a new release**
2. Select the tag you created
3. Write release notes
4. Click **Publish release**

## Release Notes Format

We use a consistent format for release notes:

```markdown
## 🌮 Release Title

*Month Day, Year*

Brief description.

### ✨ Features
- **Feature** - Description

### 🐛 Bug Fixes
- Fixed issue

### 🔧 Improvements
- Improved thing

### ⚡ Performance
- Performance improvement

### 📱 Mobile
- Mobile improvement

### 🛡️ Code Quality
- Code quality improvement
```

## Automated Release Notes

GitHub can auto-generate release notes based on PR labels. Configuration is in `.github/release.yml`.

### Supported Labels

| Label | Category |
|-------|----------|
| `feature`, `enhancement` | 🚀 New Features |
| `bug`, `fix`, `bugfix` | 🐛 Bug Fixes |
| `ui`, `ux`, `design` | 🎨 UI/UX Improvements |
| `performance`, `optimization` | ⚡ Performance |
| `documentation`, `docs` | 📚 Documentation |
| `chore`, `maintenance`, `refactor` | 🔧 Maintenance |
| `dependencies` | 📦 Dependencies |
| `security` | 🔐 Security |
| `test`, `testing` | 🧪 Tests |
| `i18n`, `translation` | 🌐 Internationalization |

### Excluded from Release Notes

- PRs with label `skip-changelog`, `duplicate`, `invalid`
- PRs from `dependabot` or `dependabot[bot]`

## Quick Release Checklist

- [ ] All tests passing
- [ ] Version bumped in all `package.json` files
- [ ] Changes committed and pushed
- [ ] Git tag created and pushed
- [ ] GitHub release created with notes
- [ ] Verify deployment succeeded

