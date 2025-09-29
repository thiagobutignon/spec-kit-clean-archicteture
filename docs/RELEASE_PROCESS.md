# Release Process

This document describes the automated NPM package publishing process for `the-regent-cli`.

## 🚀 Overview

The package publishing is **semi-automated** using GitHub Actions. When you push a version tag, the workflow automatically:

1. ✅ Validates version consistency between tag and `package.json`
2. ✅ Runs tests to ensure quality
3. ✅ Builds templates
4. ✅ Publishes to NPM with provenance
5. ✅ Creates a GitHub Release with release notes

## 📋 Prerequisites

### One-Time Setup

1. **NPM Token**: A maintainer must add `NPM_TOKEN` secret to the GitHub repository:
   - Go to [NPM Access Tokens](https://www.npmjs.com/settings/~/tokens)
   - Create an "Automation" token with "Read and write" permissions
   - Add it as `NPM_TOKEN` in GitHub repository secrets:
     - Repository Settings → Secrets and variables → Actions → New repository secret

2. **GitHub Token**: Already available as `GITHUB_TOKEN` (automatic)

## 🔄 Release Steps

### 1. Update Version

Update the version in `package.json`:

```bash
# For patch release (2.1.1 → 2.1.2)
npm version patch

# For minor release (2.1.1 → 2.2.0)
npm version minor

# For major release (2.1.1 → 3.0.0)
npm version major
```

This command will:
- Update `package.json` version
- Create a git commit with the version change
- Create a git tag (e.g., `v2.1.2`)

### 2. Push Changes and Tag

```bash
# Push the commit
git push origin main

# Push the tag (this triggers the workflow)
git push origin --tags
```

**Alternative**: Push both at once:
```bash
git push origin main --follow-tags
```

### 3. Monitor Workflow

1. Go to [Actions tab](https://github.com/thiagobutignon/spec-kit-clean-archicteture/actions)
2. Watch the "Publish to NPM" workflow execution
3. Verify all steps complete successfully

### 4. Verify Publication

After successful workflow execution:

1. **NPM Package**: https://www.npmjs.com/package/the-regent-cli
2. **GitHub Release**: https://github.com/thiagobutignon/spec-kit-clean-archicteture/releases

## ✅ Workflow Features

### Safety Checks

- **Version Validation**: Ensures `package.json` version matches the git tag
- **Test Execution**: Runs full test suite before publishing
- **Template Building**: Ensures templates are built correctly

### Provenance

The workflow uses `--provenance` flag, which:
- Links the package to the exact source code and build process
- Provides transparency about package origin
- Enhances security and trust

### Automatic GitHub Release

Creates a release with:
- Release notes template
- Installation instructions
- Link to NPM package
- CHANGELOG reference

## 🛠️ Manual Publishing (Emergency)

If you need to publish manually (workflow failure, emergency fix):

```bash
# 1. Ensure you're on main branch with latest code
git checkout main
git pull

# 2. Update version in package.json manually
vim package.json

# 3. Build and test
npm ci
npm test
npm run templates:build

# 4. Publish
npm publish --access public

# 5. Create git tag and push
git tag v2.1.2
git push origin v2.1.2

# 6. Create GitHub release manually
gh release create v2.1.2 --title "Release 2.1.2" --notes "Manual release"
```

## 📊 Version Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (x.X.0): New features, backward compatible
- **PATCH** (x.x.X): Bug fixes, backward compatible

### When to Bump

- **Patch**: Bug fixes, documentation updates, small improvements
- **Minor**: New commands, new features, non-breaking enhancements
- **Major**: Breaking API changes, major architectural changes

## 🚨 Troubleshooting

### Version Mismatch Error

```
❌ ERROR: Version mismatch!
   package.json: 2.1.1
   git tag: v2.1.2
```

**Solution**: Update `package.json` to match the tag, or delete the tag and create a new one:

```bash
# Option 1: Update package.json
npm version 2.1.2 --no-git-tag-version
git add package.json
git commit -m "chore: bump version to 2.1.2"
git push

# Option 2: Delete and recreate tag
git tag -d v2.1.2
git push origin :refs/tags/v2.1.2
npm version patch
git push origin main --follow-tags
```

### NPM Token Expired

If publish fails with authentication error:

1. Generate new NPM token
2. Update `NPM_TOKEN` secret in GitHub repository
3. Re-run the workflow or push tag again

### Tests Failing

The workflow will **not publish** if tests fail. Fix the tests first:

```bash
npm test
# Fix failing tests
git add .
git commit -m "fix: resolve test failures"
git push
```

Then create a new version/tag.

## 📝 Best Practices

1. **Always test locally** before creating a release tag
2. **Update CHANGELOG.md** before releasing
3. **Use descriptive commit messages** for version bumps
4. **Verify NPM package** after publishing
5. **Monitor GitHub Issues** for post-release problems

## 🎯 Quick Reference

```bash
# Standard release process (recommended)
npm version patch          # Updates package.json and creates tag
git push origin main --follow-tags

# Check published version
npm view the-regent-cli version

# Test installation
npm install -g the-regent-cli@latest
regent --version
```

## 📚 Related Documentation

- [GitHub Actions Workflow](.github/workflows/npm-publish.yml)
- [NPM Publishing Documentation](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)

---

**Last Updated**: 2025-09-29
**Automation Level**: Semi-automatic (tag-triggered)
**Maintainers**: See [CODEOWNERS](../CODEOWNERS) (if exists)