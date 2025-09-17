# Contributing to Spec-Kit Clean Architecture

First off, thank you for considering contributing to Spec-Kit Clean Architecture! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [RLHF Score Requirements](#rlhf-score-requirements)
- [Pull Request Process](#pull-request-process)

## 📜 Code of Conduct

This project adheres to Clean Architecture and DDD principles. All contributions must:
- Maintain domain layer purity (no external dependencies)
- Follow SOLID principles
- Include appropriate tests
- Achieve minimum RLHF score of +1

## 🤝 How Can I Contribute?

### Reporting Bugs
- Use the issue template
- Include RLHF score if applicable
- Provide reproduction steps
- Include error logs from `.rlhf/logs/`

### Suggesting Enhancements
- Check existing issues first
- Describe the problem and solution
- Explain impact on RLHF scoring
- Include examples

### Code Contributions
1. Fork the repository
2. Create a feature branch (`feat/your-feature`)
3. Make your changes
4. Run validation (`npx tsx validate-implementation.ts`)
5. Ensure RLHF score ≥ +1
6. Submit PR with detailed description

## 🛠️ Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/spec-kit-clean-archicteture
cd spec-kit-clean-archicteture

# Install dependencies
yarn install

# Run tests
yarn test

# Run linting
yarn lint

# Check RLHF score
npx tsx rlhf-system.ts analyze implementation.yaml
```

## 🏆 RLHF Score Requirements

All contributions must meet these scoring thresholds:

| Contribution Type | Minimum Score | Target Score |
|------------------|---------------|--------------|
| Bug Fix | 0 | +1 |
| New Feature | +1 | +2 |
| Refactoring | +1 | +2 |
| Documentation | 0 | +1 |

### Achieving +2 (PERFECT) Score

1. **Add Ubiquitous Language**
   ```yaml
   ubiquitousLanguage:
     User: "System user with authentication"
   ```

2. **Include Domain Documentation**
   ```typescript
   /**
    * @domainConcept User Management
    * @pattern Use Case Interface
    */
   ```

3. **Follow Clean Architecture**
   - No external dependencies in domain
   - Proper separation of concerns
   - Interface-based design

## 🔄 Pull Request Process

1. **Before Submitting**
   - [ ] Run `yarn lint` - must pass
   - [ ] Run `yarn test` - must pass
   - [ ] Run validation - must achieve RLHF +1 or better
   - [ ] Update README if needed
   - [ ] Add/update tests

2. **PR Title Format**
   ```
   feat: add new feature
   fix: resolve issue
   docs: update documentation
   refactor: improve code structure
   ```

3. **PR Description Template**
   ```markdown
   ## Summary
   Brief description of changes

   ## RLHF Score
   - Before: [score]
   - After: [score]

   ## Test Plan
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed

   ## Architecture Impact
   - [ ] Domain layer remains pure
   - [ ] No breaking changes
   - [ ] Follows SOLID principles
   ```

4. **Review Process**
   - Automated checks must pass
   - RLHF score verification
   - Code review by maintainers
   - Architecture compliance check

## 📚 Documentation

When contributing documentation:
- Update relevant `.claude/commands/*.md` files
- Include examples
- Explain RLHF score impact
- Use clear, concise language

## 🧪 Testing

All code must include tests:
```typescript
// For every use case
describe('CreateUser', () => {
  it('should create user with valid input', () => {
    // Test implementation
  });
});
```

## 🏗️ Architecture Guidelines

### Domain Layer
- Pure TypeScript interfaces
- No external dependencies
- Business logic only

### Application Layer
- Use case implementations
- Orchestration logic
- Dependency injection

### Infrastructure Layer
- External integrations
- Database access
- API clients

## 📈 Performance Considerations

- Pattern caching for repeated analysis
- Progress reporting for long operations
- Memory-bounded operations (100 cache entries max)
- Graceful cleanup on exit

## 🔍 Code Review Checklist

Reviewers will check:
- [ ] RLHF score ≥ +1
- [ ] Clean Architecture compliance
- [ ] Test coverage
- [ ] Documentation updates
- [ ] No breaking changes
- [ ] Performance impact

## 🎯 Areas for Contribution

### High Priority
- Multi-language support
- VS Code extension
- GitHub Actions integration
- Performance optimizations

### Good First Issues
- Documentation improvements
- Test coverage increase
- Bug fixes with RLHF -1
- Example implementations

## 📞 Getting Help

- **Discord**: [Join our community](https://discord.gg/spec-kit)
- **Issues**: Use appropriate labels
- **Discussions**: For design decisions

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

Thank you for helping make Spec-Kit Clean Architecture better! 🚀