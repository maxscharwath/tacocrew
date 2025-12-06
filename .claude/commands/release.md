---
description: Create a new release following the CalVer versioning scheme
---

Create a new release of TacoCrew following these steps:

1. **Determine the new version number** using CalVer scheme (0.YYMM.patch)
   - Check the current version in package.json files
   - Calculate the appropriate next version based on today's date ({{ DATE }})
   - Ask the user to confirm the version number

2. **Update all package.json files** with the new version:
   - ./package.json
   - ./apps/api/package.json
   - ./apps/web/package.json
   - ./apps/storybook/package.json
   - ./packages/ui-kit/package.json
   - ./packages/gigatacos-client/package.json

3. **Commit and push changes**:
   - Stage all changes: `git add -A`
   - Commit with message: `chore: bump version to [VERSION]`
   - Push to main: `git push origin main`

4. **Create and push git tag**:
   - Create annotated tag: `git tag -a v[VERSION] -m "[RELEASE_TITLE]"`
   - Push tag: `git push origin v[VERSION]`

5. **Generate release notes**:
   - Analyze recent commits since the last tag
   - Generate release notes following the format from RELEASE.md:
     - 🌮 Release Title
     - Date
     - Brief description
     - ✨ Features (from commits with feat:)
     - 🐛 Bug Fixes (from commits with fix:)
     - 🔧 Improvements (from commits with chore:, refactor:)
     - Other relevant sections as needed

6. **Create GitHub release**:
   - Use `gh release create` to create the release
   - Include the generated release notes
   - Set the release title as "v[VERSION] - [RELEASE_TITLE]"

7. **Summary**:
   - Confirm the release was created successfully
   - Provide the GitHub release URL

IMPORTANT:
- Always ask for confirmation before executing destructive operations (push, tag creation)
- Ensure all tests are passing before creating a release
- Verify that the version follows the CalVer format: 0.YYMM.patch
- Don't create a release if there are uncommitted changes (other than version bumps)
