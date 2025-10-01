# Definition of Done: Architectural Changes

> **Context**: Issue #152 - Process for maintaining prompt consistency across AI commands during architectural changes

## Quick Start

**When to use this checklist**: Any change affecting:
- Core data structures (JSON format, YAML structure)
- Workflow steps (adding/removing phases)
- Architectural patterns (new layer rules)
- Template structures (new .regent patterns)
- Validation rules (new compliance checks)
- RLHF scoring criteria (new scoring rules)

**How to use**:
1. Start with **Phase 1: Impact Analysis** - identify what's affected
2. Complete all applicable checkboxes in each phase
3. Run `npm run validate:commands` after making updates
4. Document your changes in CHANGELOG.md
5. Create issues for any automation opportunities discovered

**Rule of thumb**: If the change affects how AI commands interpret or generate data, use this checklist.

---

## Problem Statement

When implementing architectural changes that affect multiple AI commands (like Issue #117 - modular YAML structure), there's no systematic checklist to ensure ALL affected command prompts are updated consistently.

**Example from Dogfooding Experiment #003:**
- Issue #117 implemented modular structure (`sharedComponents + useCases`)
- `/01-plan-layer-features.md` ✅ Updated
- `/03-generate-layer-code.md` ✅ Updated
- `/02-validate-layer-plan.md` ❌ NOT updated → **prompt drift**
- Result: Validator expected old structure, received new structure, causing confusing warnings

## Impact Without This Process

- **Runtime**: Commands fail or show confusing warnings
- **Developer Experience**: Hard to debug "why is validation failing?"
- **Technical Debt**: Drift accumulates over time
- **Documentation**: Prompts become inconsistent source of truth

---

## Definition of Done Checklist

### When Implementing Architectural Changes

When modifying core concepts or data structures, **YOU MUST** complete this checklist:

#### Phase 1: Impact Analysis

- [ ] **Identify affected commands**: Search for references to the concept being changed
  ```bash
  # Example: Search for structure/format changes
  grep -r "steps\[\]" .claude/commands/
  grep -r "sharedComponents" .claude/commands/
  grep -r "useCases" .claude/commands/
  ```

- [ ] **List all affected files**: Document which commands need updates
  ```
  Affected commands:
  - /01-plan-layer-features.md (generates JSON with new structure)
  - /02-validate-layer-plan.md (validates new structure)
  - /03-generate-layer-code.md (consumes new structure)
  - /04-reflect-layer-lessons.md (analyzes new structure)
  ```

- [ ] **Document the change**: Create a clear description of what's changing
  ```markdown
  ## Change Summary
  - **Old Structure**: Single `steps` array
  - **New Structure**: `sharedComponents` + `useCases` arrays
  - **Reason**: Enable modular YAML generation
  - **Impact**: 4 commands need updates
  ```

#### Phase 2: Update Commands Consistently

Update ALL workflow commands that reference the changed concept:

- [ ] `/01-plan-layer-features.md` - Planning phase
  - [ ] Update JSON output structure examples
  - [ ] Add new fields to validation checklist
  - [ ] Update "How to Achieve +2 Score" section
  - [ ] Add edge case guidance if applicable

- [ ] `/02-validate-layer-plan.md` - Validation phase
  - [ ] Update JSON schema expectations
  - [ ] Add validation rules for new structure
  - [ ] Update error messages to reference new structure
  - [ ] Update examples with new format

- [ ] `/03-generate-layer-code.md` - Code generation phase
  - [ ] Update YAML separation strategy
  - [ ] Add new file generation patterns
  - [ ] Update examples with new structure
  - [ ] Add edge case handling

- [ ] `/04-reflect-layer-lessons.md` - Reflection phase
  - [ ] Update analysis patterns for new structure
  - [ ] Add RLHF scoring criteria for new elements
  - [ ] Update examples

- [ ] `/05-evaluate-layer-results.md` - Evaluation phase
  - [ ] Update architecture compliance checks
  - [ ] Add validation for new structural elements
  - [ ] Update violation detection

- [ ] `/06-execute-layer-steps.md` - Execution phase
  - [ ] Update YAML parsing logic expectations
  - [ ] Add error handling for new structure
  - [ ] Update execution order validation

- [ ] `/07-fix-layer-errors.md` - Error fixing phase
  - [ ] Add common errors for new structure
  - [ ] Update fix patterns
  - [ ] Add troubleshooting guide

- [ ] `/08-apply-layer-improvements.md` - Improvement phase
  - [ ] Update improvement patterns
  - [ ] Add template evolution guidance

- [ ] `/09-e2e-performance-testing.md` - Testing phase
  - [ ] Update test scenarios if structure affects testing
  - [ ] Add new validation checkpoints

#### Phase 3: Update Supporting Documentation

- [ ] **Update core documentation**
  - [ ] `README.md` - Update workflow descriptions
  - [ ] `docs/architecture/` - Update architecture diagrams
  - [ ] `docs/workflows/` - Update workflow guides

- [ ] **Update templates**
  - [ ] `templates/backend-*-template.regent` - Update patterns
  - [ ] `templates/frontend-*-template.regent` - Update patterns
  - [ ] `templates/fullstack-*-template.regent` - Update patterns

- [ ] **Update schemas (if applicable)**
  - [ ] `templates/parts/*/steps/*.part.schema.json` - Update JSON schemas
  - [ ] Add new fields to schemas
  - [ ] Update validation rules

#### Phase 4: Add Backward Compatibility (if needed)

- [ ] **Determine if backward compatibility is needed**
  - Breaking change? → Add migration guide
  - Non-breaking change? → Support both formats temporarily

- [ ] **Add compatibility layer** (if needed)
  ```typescript
  // Example: Support both old and new formats
  function parseJSON(input: any) {
    if (input.steps) {
      // Old format - migrate to new
      return migrateOldFormat(input);
    }
    if (input.sharedComponents && input.useCases) {
      // New format
      return input;
    }
    throw new Error('Invalid format');
  }
  ```

- [ ] **Add deprecation warnings** (if phasing out old format)
  ```
  ⚠️  WARNING: Single 'steps' array format is deprecated.
  Please use 'sharedComponents' + 'useCases' structure.
  Old format will be removed in v3.0.0.
  ```

#### Phase 5: Testing & Validation

- [ ] **Update examples with real data**
  - [ ] Use actual examples from dogfooding experiments
  - [ ] Include both success and failure cases
  - [ ] Show before/after comparisons

- [ ] **Test commands in sequence**
  - [ ] Run complete workflow `/01` → `/09`
  - [ ] Verify each command produces expected output
  - [ ] Check that output of one command is valid input for next

- [ ] **Run dogfooding experiment**
  - [ ] Create new dogfooding experiment document
  - [ ] Test with real feature implementation
  - [ ] Document any issues discovered

- [ ] **Validate templates**
  ```bash
  # Validate all templates against schemas
  npx tsx validate-template.ts --all
  ```

- [ ] **Check for inconsistencies**
  ```bash
  # Look for references to old patterns
  grep -r "old-pattern" .claude/commands/
  grep -r "deprecated-field" templates/
  ```

#### Phase 6: Version Documentation

- [ ] **Document structure versions explicitly**
  ```yaml
  # In metadata section
  structure_version: "2.0"  # sharedComponents + useCases
  # Previous versions:
  # 1.0 - Single steps array
  ```

- [ ] **Update changelog**
  ```markdown
  ## [2.0.0] - 2025-01-XX
  ### Changed
  - BREAKING: JSON structure now uses sharedComponents + useCases
  - Updated all 9 workflow commands for consistency
  ### Migration Guide
  - See docs/migrations/v1-to-v2.md
  ```

- [ ] **Create migration guide** (for breaking changes)
  ```markdown
  # Migration Guide: v1.0 to v2.0

  ## Changes
  Old format:
  ```json
  { "steps": [...] }
  ```

  New format:
  ```json
  {
    "sharedComponents": {...},
    "useCases": [...]
  }
  ```

  ## How to Migrate
  1. Identify shared components in your steps
  2. Move shared components to sharedComponents object
  3. Move use case steps to useCases array
  ```

---

## Automation Opportunities

### 1. Pre-commit Hook: Cross-Command Consistency

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for concept inconsistencies across commands

CONCEPTS=("steps" "sharedComponents" "useCases" "metadata")

for concept in "${CONCEPTS[@]}"; do
  # Check if concept appears in some commands but not others
  files_with_concept=$(grep -l "$concept" .claude/commands/*.md | wc -l)
  total_files=$(ls .claude/commands/*.md | wc -l)

  if [ $files_with_concept -gt 0 ] && [ $files_with_concept -lt $((total_files - 2)) ]; then
    echo "⚠️  WARNING: '$concept' found in $files_with_concept/$total_files commands"
    echo "   This might indicate inconsistent documentation."
    echo "   Files with '$concept':"
    grep -l "$concept" .claude/commands/*.md
    echo ""
  fi
done
```

### 2. Command Dependency Graph

Visualize which commands reference each other:

```bash
#!/bin/bash
# scripts/generate-command-graph.sh

echo "digraph CommandDependencies {"
for cmd in .claude/commands/*.md; do
  cmd_name=$(basename "$cmd" .md)

  # Find previous_command references
  prev=$(grep "previous_command:" "$cmd" | sed 's/.*: "\(.*\)"/\1/')
  if [ -n "$prev" ]; then
    echo "  \"$prev\" -> \"$cmd_name\""
  fi

  # Find next_command references
  next=$(grep "next_command:" "$cmd" | sed 's/.*: "\(.*\)"/\1/')
  if [ -n "$next" ]; then
    echo "  \"$cmd_name\" -> \"$next\""
  fi
done
echo "}"
```

### 3. Validation Script: Consistent Terminology

```typescript
// scripts/validate-command-consistency.ts

interface ConsistencyRule {
  term: string;
  required_in: string[];
  description: string;
}

const rules: ConsistencyRule[] = [
  {
    term: "sharedComponents",
    required_in: ["/01-plan-layer-features.md", "/02-validate-layer-plan.md", "/03-generate-layer-code.md"],
    description: "New JSON structure field"
  },
  {
    term: "useCases",
    required_in: ["/01-plan-layer-features.md", "/02-validate-layer-plan.md", "/03-generate-layer-code.md"],
    description: "New JSON structure field"
  }
];

async function validateConsistency() {
  for (const rule of rules) {
    for (const file of rule.required_in) {
      const content = await fs.readFile(`.claude/commands/${file}`, 'utf-8');
      if (!content.includes(rule.term)) {
        console.error(`❌ ${file} missing term: ${rule.term}`);
        console.error(`   Description: ${rule.description}`);
      }
    }
  }
}
```

Run with:
```bash
npm run validate:commands
```

---

## Real-World Example: Issue #117 Implementation

### What Went Right ✅

1. Core commands updated:
   - `/01-plan-layer-features.md` - Added sharedComponents + useCases to JSON output
   - `/03-generate-layer-code.md` - Implemented YAML separation strategy

2. Edge cases documented:
   - Created `docs/edge-cases/modular-yaml-edge-cases.md`
   - Added 4 edge cases with solutions

### What Went Wrong ❌

1. Validator not updated immediately:
   - `/02-validate-layer-plan.md` still expected old `steps[]` structure
   - Caused confusing warnings during dogfooding

2. Missing documentation:
   - Edge cases discovered during dogfooding, not planned upfront
   - Should have been part of initial design

### Lessons Learned 📚

1. **Update all commands simultaneously** - Don't update `/01` and `/03` but forget `/02`
2. **Test the full workflow** - Run `/01` → `/09` before considering done
3. **Document edge cases upfront** - Think through unusual scenarios during design
4. **Use this checklist** - Would have caught the validator drift

---

## Benefits of This Process

✅ **Prevents Future Drift**: Systematic approach to prompt updates
✅ **Better DX**: Developers see consistent behavior across commands
✅ **Self-Documenting**: Checklist serves as process documentation
✅ **Quality Gate**: Catches inconsistencies before they reach users
✅ **Faster Debugging**: When issues occur, easier to trace which command wasn't updated

---

## When to Use This Checklist

Use this checklist when making changes to:

- [ ] Core data structures (JSON format, YAML structure)
- [ ] Workflow steps (adding/removing phases)
- [ ] Architectural patterns (new layer rules)
- [ ] Template structures (new .regent patterns)
- [ ] Validation rules (new compliance checks)
- [ ] RLHF scoring criteria (new scoring rules)

**Rule of thumb**: If the change affects how AI commands interpret or generate data, use this checklist.

---

## Related Issues

- **#117** - Modular YAML generation (the architectural change that triggered this)
- **#151** - Update /02 validator (symptom of missing this process)
- **#143** - Complete test plan (dogfooding that discovered the gap)
- **#145** - Edge case documentation (complementary to this checklist)

---

## References

- **Dogfooding Experiment #003**: `docs/dogfooding-experiment/003-modular-yaml-recovery.md` (lines 1453-1543)
- **Fix Commit**: `e33fb4e` - Applied ReAct cycle to correct prompt drift
- **Root Cause Analysis**: Ultrathink section in experiment doc

---

**Last Updated**: 2025-10-01
**Status**: ✅ Defined and Ready for Use
**Owner**: The Regent Team
**Review Frequency**: After each major architectural change
