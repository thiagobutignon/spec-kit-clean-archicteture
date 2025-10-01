# Architectural Changes Checklist

## Purpose

When implementing architectural changes that affect multiple AI commands (like Issue #117 - modular YAML structure), use this checklist to ensure ALL affected command prompts are updated consistently.

## Problem This Solves

**Without this process:**
- ❌ Commands drift in terminology
- ❌ Inconsistent data structures
- ❌ Confusing validation errors
- ❌ Technical debt accumulates

**With this process:**
- ✅ Consistent command behavior
- ✅ Clear validation messages
- ✅ Better developer experience
- ✅ Self-documenting changes

## When to Use This Checklist

Use when:
- Adding new data structures (e.g., `sharedComponents`)
- Changing JSON/YAML formats
- Renaming core concepts
- Adding/removing workflow phases
- Modifying architectural patterns

## Definition of Done Checklist

### Phase 1: Planning
- [ ] **Identify scope**: List all commands affected by change
- [ ] **Search codebase**: `grep -r "concept" .claude/commands/`
- [ ] **Document decision**: Why this change? What's the impact?
- [ ] **Create issue**: Reference in all related PRs

### Phase 2: Implementation
- [ ] **Update affected commands**:
  - [ ] `/01-plan-layer-features.md`
  - [ ] `/02-validate-layer-plan.md`
  - [ ] `/03-generate-layer-code.md`
  - [ ] `/04-reflect-layer-lessons.md`
  - [ ] `/05-evaluate-layer-results.md`
  - [ ] `/06-execute-layer-steps.md`
  - [ ] `/07-fix-layer-errors.md`
- [ ] **Add backward compatibility** (when appropriate)
- [ ] **Update examples** with real data from dogfooding
- [ ] **Document structure versions** explicitly
- [ ] **Update related schemas/types**

### Phase 3: Testing
- [ ] **Test commands in sequence**: `/01` → `/02` → `/03` → `/04` → `/05` → `/06`
- [ ] **Dogfooding workflow**: Run with real feature
- [ ] **Check validation**: Ensure no false warnings
- [ ] **Verify backward compat**: Test with old structure (if applicable)

### Phase 4: Documentation
- [ ] **Update README**: If user-facing changes
- [ ] **Update examples**: In all affected commands
- [ ] **Update diagrams**: If workflow changed
- [ ] **Add migration guide**: If breaking change

### Phase 5: Communication
- [ ] **Update issues**: Reference in related issues
- [ ] **PR descriptions**: Clear before/after comparison
- [ ] **Changelog**: Document user-visible changes
- [ ] **Announce**: If affects users

## Example: Issue #117 (Modular YAML)

### What Changed
- Added `sharedComponents` and `useCases` structure
- Replaced flat `steps[]` array
- New: generate multiple YAMLs instead of one

### Commands Affected
✅ Updated:
- `/01-plan-layer-features.md` (generates new structure)
- `/03-generate-layer-code.md` (handles new structure)

⚠️ Initially Missed:
- `/02-validate-layer-plan.md` (caused false warnings)

### Lesson Learned
Without this checklist, we missed updating `/02`, causing prompt drift and confusion.

## Tools

### 1. Search for Concept References
```bash
# Find all mentions of a concept
grep -r "steps\[\]" .claude/commands/
grep -r "sharedComponents" .claude/commands/

# Find command dependencies
grep -r "previous_command\|next_command" .claude/commands/
```

### 2. Validate Consistency
```bash
# Check terminology consistency
npm run validate:commands  # TODO: Create this script
```

### 3. Command Dependency Graph
```bash
# Generate workflow diagram
npm run graph:commands  # TODO: Create this script
```

## Automation Opportunities

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for concept inconsistencies
if git diff --cached --name-only | grep -q "\.claude/commands/"; then
  echo "Checking command prompt consistency..."
  # TODO: Add validation logic
fi
```

### CI Check
```yaml
# .github/workflows/validate-commands.yml
name: Validate Command Consistency

on:
  pull_request:
    paths:
      - '.claude/commands/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check consistency
        run: npm run validate:commands
```

## References

- Issue #152 (this process)
- Issue #117 (modular YAML - triggered need for process)
- Issue #151 (symptom of missing process)
- Dogfooding Experiment 003 (discovered the gap)

---

**Status**: Active Process
**Owner**: Architecture Team
**Last Updated**: 2025-01-10
**Version**: 1.0
