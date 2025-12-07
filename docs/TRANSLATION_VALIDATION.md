# Translation Key Validation

This document describes the translation key validation system for both frontend and backend.

## Overview

The translation validation system ensures that all translation keys used in code exist in all locale files (en, de, fr). It supports both:

1. **Static keys**: Direct translation keys like `t('orders.create.title')`
2. **Dynamic keys**: Keys generated via code like `t(\`orders.create.${key}\`)`

## Tools

### 1. Standalone Script

**Command**: `bun check:translations`

**Location**: `scripts/check-translations.ts`

**Features**:
- Scans all TypeScript/TSX files in frontend and backend
- Detects static translation keys
- Detects dynamic translation patterns (e.g., `t(\`prefix.${variable}\`)`)
- Validates keys exist in all locale files
- Reports missing keys with file locations
- Shows summary of issues

**Output Example**:
```
🔍 Checking translation keys...

📱 Frontend (apps/web):
❌ Found 39 missing static translation key(s):
  Key: orders.create.title
  Missing in: de, fr
  Used in:
    - apps/web/src/routes/orders.create.tsx:42

⚠️  Found 3 dynamic translation pattern(s):
  Pattern: t(`orders.create.${variable}`)
  Prefix: orders.create
  Found 81 possible keys under this prefix
  ⚠️  1 key(s) missing in some locales:
     - orders.create.progress.garnishes.selected

🔧 Backend (apps/api):
✅ All translation keys are present!
```

### 2. Test Files

**Frontend**: `apps/web/src/__tests__/translations.test.ts`
**Backend**: `apps/api/src/__tests__/translations.test.ts`

These tests run as part of the test suite and will fail if:
- Any static translation key is missing
- Any dynamic translation pattern has missing keys

## How It Works

### Static Key Detection

The validator extracts translation keys from patterns like:
- `t('key')` or `t("key")`
- `t(\`key\`)` (simple template literals without interpolation)

### Dynamic Key Detection

The validator detects patterns like:
- `t(\`orders.create.${key}\`)`
- `t(\`common.status.${status}\`)`
- `t(\`stock.sections.${section.key}.label\`)`

For dynamic patterns, it:
1. Extracts the prefix (e.g., `orders.create`)
2. Finds all keys under that prefix in the reference locale (usually `en.json`)
3. Checks if all those keys exist in other locales
4. Reports any missing keys

### Key Validation

For each detected key:
1. Checks if the key exists in all locale files (en, de, fr)
2. Reports which locales are missing the key
3. Shows where the key is used in the codebase

## Usage

### Run Validation

```bash
# Run the standalone script
bun check:translations

# Run as part of test suite
bun test apps/web/src/__tests__/translations.test.ts
bun test apps/api/src/__tests__/translations.test.ts

# Show unused keys (optional)
SHOW_UNUSED=true bun check:translations
```

### Integration

The validation can be integrated into:
- Pre-commit hooks
- CI/CD pipelines
- Development workflow

## Implementation Details

### Bun Native APIs

The validation uses Bun's native APIs for better performance:
- `Bun.Glob` for file globbing
- `Bun.file()` for file reading
- `await file.text()` and `await file.json()` for async operations

### Performance

- Parallel file reading using `Promise.all()`
- Efficient regex matching
- Cached locale file parsing

## Best Practices

1. **Use static keys when possible**: Easier to validate and maintain
2. **Document dynamic patterns**: If you use dynamic keys, ensure all possible values are documented
3. **Run validation regularly**: Add to your development workflow
4. **Fix issues early**: Don't let missing keys accumulate

## Limitations

- Dynamic keys with complex interpolation (e.g., multiple variables) may not be fully detected
- Keys generated at runtime (not in source code) cannot be validated
- Template literal keys with complex expressions are skipped

## Future Improvements

- Support for more complex dynamic patterns
- Automatic key generation suggestions
- Integration with translation management tools
- Performance optimizations for large codebases
