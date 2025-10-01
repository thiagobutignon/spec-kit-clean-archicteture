# Experiment #003: Modular YAML Generation Recovery

**Date**: 2025-10-01
**Version**: 2.2.0
**Status**: 🔄 IN PROGRESS
**Type**: Bug Recovery + Feature Validation
**Previous Experiment**: #002 (blocked by Bug #122)
**Related Issue**: #143 (Complete test plan for modular YAML generation)

## 📊 **EXPERIMENT OBJECTIVE**

Recover from Experiment #002 failures and validate the modular YAML generation feature introduced in PR #136. This experiment specifically addresses:

1. **Bug #122 Recovery**: Verify `/06-execute-layer-steps` works after dependency fixes
2. **Issue #143 Testing**: Validate modular YAML generation (1 shared + N use cases)
3. **End-to-End Validation**: Complete workflow from `/01` → `/06` without blockers

## 🎯 **Context from Experiment #002**

### What Worked ✅
- Phase 1: `/01-plan-layer-features` generated valid JSON plan
- Phase 2: `/02-validate-layer-plan` scored +2 (PERFECT)
- Phase 3: `/03-generate-layer-code` generated YAML (but monolithic, not modular)

### What Failed ❌
- Phase 6: `/06-execute-layer-steps` completely broken
  - **Bug #122**: Missing `utils/` directory
  - **Bug #122**: Incorrect import paths in `execute-steps.ts`
  - Error: `Cannot find module '.regent/config/core/logger'`

### Critical Bugs to Verify Fixed
| Bug | Severity | Description | Status |
|-----|----------|-------------|--------|
| #122 | P0 | /06 broken - missing dependencies | 🔴 Not Fixed |
| #117 | P0 | Monolithic YAML instead of modular | 🔴 Not Fixed |
| #115 | P0 | MCP servers not detected | 🔴 Not Fixed |

## 🔬 **Test Scope (Issue #143)**

This experiment will test the **modular YAML generation** feature:

### Expected Behavior (PR #136)
**Input**: JSON plan with `sharedComponents` + `useCases` arrays
```json
{
  "featureNumber": "001",
  "featureName": "product-catalog-management",
  "sharedComponents": {
    "models": [...],
    "valueObjects": [...],
    "repositories": [...]
  },
  "useCases": [
    { "name": "CreateProduct", ... },
    { "name": "UpdateProduct", ... },
    { "name": "ArchiveProduct", ... },
    { "name": "SearchProducts", ... },
    { "name": "ManageInventory", ... }
  ]
}
```

**Output**: 6 modular YAMLs
```
spec/001-product-catalog-management/domain/
├── shared-implementation.yaml          # Shared components only
├── create-product-implementation.yaml   # CreateProduct use case
├── update-product-implementation.yaml   # UpdateProduct use case
├── archive-product-implementation.yaml  # ArchiveProduct use case
├── search-products-implementation.yaml  # SearchProducts use case
└── manage-inventory-implementation.yaml # ManageInventory use case
```

### Test Scenarios

#### Test 1: `/01-plan-layer-features` generates new JSON structure
**Objective**: Verify JSON plan has `sharedComponents` and `useCases` arrays

**Success Criteria**:
- ✅ JSON has `sharedComponents` object with models, valueObjects, repositories
- ✅ JSON has `useCases` array with 5 use cases
- ✅ Each use case has name, input, output, errors
- ✅ No flat `steps` array (old structure)

#### Test 2: `/03-generate-layer-code` generates 6 YAMLs
**Objective**: Verify modular YAML generation (not monolithic)

**Success Criteria**:
- ✅ Generates `shared-implementation.yaml` with shared components
- ✅ Generates 5 use case YAMLs (create, update, archive, search, manage-inventory)
- ✅ Each YAML is atomic (can be executed independently)
- ✅ No monolithic YAML with all 19 steps

#### Test 3: `/06-execute-layer-steps` works with modular YAMLs
**Objective**: Verify execution works after Bug #122 fix

**Prerequisites**:
- Bug #122 must be fixed (utils/ copied, imports corrected)
- Modular YAMLs exist from Test 2

**Success Criteria**:
- ✅ Can execute `shared-implementation.yaml` first
- ✅ Can execute use case YAMLs independently
- ✅ Each execution creates atomic commit
- ✅ No import errors
- ✅ No missing dependency errors

#### Test 4: Edge Cases
**Objective**: Test boundary conditions

**Scenarios**:
1. Feature with 1 use case → 2 YAMLs (1 shared + 1 use case)
2. Feature with 0 shared components → N use case YAMLs only
3. Feature with 10 use cases → 1 shared + 10 use case YAMLs

## 🛠️ **Setup**

### Prerequisites
- ✅ The Regent v2.2.0 installed
- ⚠️ Bug #122 must be fixed first
- ⚠️ Bug #117 modular generation must be implemented
- ✅ Clean workspace for testing

### Pre-Experiment Validation

**Check 1: Verify Bug #122 Fix**
```bash
# Check if utils/ directory is copied by regent init
regent init test-bug-122 --ai claude --skip-mcp
ls -la test-bug-122/.regent/utils/  # Should exist

# Check execute-steps.ts imports
grep "from './core/" test-bug-122/.regent/config/execute-steps.ts
# Should return nothing (all imports should be ../core/)
```

**Check 2: Verify Modular YAML Generation**
```bash
# Check if /03 command mentions modular generation
cat .claude/commands/03-generate-layer-code.md | grep -i "modular\|separate"
# Should have instructions for generating multiple YAMLs
```

**Check 3: Verify Templates Support Modular**
```bash
# Check backend-domain-template.regent structure
cat templates/backend-domain-template.regent | grep -i "sharedComponents\|useCases"
# Should have both sections
```

### Environment Preparation
```bash
# Create test project for experiment 003
cd dogfooding
regent init product-catalog-v2 --ai claude --skip-mcp

# Verify installation
cd product-catalog-v2
ls -la .regent/templates/
ls -la .regent/utils/        # ← Must exist (Bug #122 fix)
ls -la .claude/commands/

# Verify execute-steps.ts imports are correct
cat .regent/config/execute-steps.ts | head -20
```

## 📋 **Execution Plan**

### Phase 0: Pre-Flight Checks (CRITICAL)
**Objective**: Verify bugs are fixed before starting

**Checks**:
- [ ] Bug #122 fixed: `utils/` directory exists in `.regent/`
- [ ] Bug #122 fixed: Import paths use `../core/` not `./core/`
- [ ] Bug #117 implemented: `/03` command supports modular generation
- [ ] Templates updated: Support `sharedComponents` and `useCases`

**Decision Point**:
- If ANY check fails → **STOP EXPERIMENT**, fix bugs first
- If all pass → Proceed to Phase 1

---

### Phase 1: Generate Modular JSON Plan
**Objective**: Test `/01-plan-layer-features` with new structure
**Command**: `/01-plan-layer-features`

**Input Specification**:
```
Feature: Product Catalog Management

Use Cases:
1. Create Product - Add new product with SKU, name, description, price, inventory
2. Update Product - Modify existing product details
3. Archive Product - Soft delete product from active catalog

Business Rules:
- SKU must be unique
- Price must be positive
- Inventory cannot go negative
- Archived products not shown in search
```

**Expected Output**:
```json
{
  "featureNumber": "001",
  "featureName": "product-catalog-management",
  "sharedComponents": {
    "models": ["ProductModel"],
    "valueObjects": ["SKU", "Price", "InventoryLevel"],
    "repositories": ["ProductRepository"]
  },
  "useCases": [
    {
      "name": "CreateProduct",
      "input": "CreateProductInput",
      "output": "CreateProductOutput",
      "errors": ["InvalidSKUError", "DuplicateSKUError"]
    },
    {
      "name": "UpdateProduct",
      "input": "UpdateProductInput",
      "output": "UpdateProductOutput",
      "errors": ["ProductNotFoundError", "InvalidPriceError"]
    },
    {
      "name": "ArchiveProduct",
      "input": "ArchiveProductInput",
      "output": "ArchiveProductOutput",
      "errors": ["ProductNotFoundError"]
    }
  ],
  "ubiquitousLanguage": { ... }
}
```

**Success Criteria**:
- ✅ JSON has `sharedComponents` object (not flat array)
- ✅ JSON has `useCases` array (not mixed with shared)
- ✅ Each use case has required fields
- ✅ No `steps` array (old structure)

**Metrics to Collect**:
- Execution time
- Token usage
- Number of shared components
- Number of use cases
- JSON structure validity

---

### Phase 2: Validate JSON Plan
**Objective**: Validate modular structure
**Command**: `/02-validate-layer-plan`

**Expected Behavior**:
- Validates `sharedComponents` object
- Validates `useCases` array
- Checks for architectural violations
- Scores RLHF (+2, +1, 0, -1, -2)

**Success Criteria**:
- ✅ Validation passes with +1 or +2
- ✅ No schema errors
- ✅ Modular structure recognized

---

### Phase 3: Generate Modular YAMLs
**Objective**: Test modular YAML generation (Issue #143)
**Command**: `/03-generate-layer-code`

**Expected Output**:
```
spec/001-product-catalog-management/domain/
├── shared-implementation.yaml          # ~5 steps (models, VOs, repo)
├── create-product-implementation.yaml   # ~3 steps (use case files)
├── update-product-implementation.yaml   # ~3 steps
└── archive-product-implementation.yaml  # ~3 steps
```

**Success Criteria**:
- ✅ 4 separate YAML files generated (1 shared + 3 use cases)
- ✅ Each YAML has own branch step
- ✅ Each YAML has own folder step
- ✅ Each YAML is atomic (can execute independently)
- ✅ No monolithic YAML with all steps

**Failure Indicators**:
- ❌ Single YAML with 19 steps (Bug #117 not fixed)
- ❌ No `shared-implementation.yaml`
- ❌ Use cases mixed with shared components

---

### Phase 4: Execute Shared Components
**Objective**: Verify `/06` works with shared YAML
**Command**: `/06-execute-layer-steps --file=spec/.../shared-implementation.yaml`

**Expected Behavior**:
1. Creates branch `feat/product-catalog-management/domain-shared`
2. Creates folder structure
3. Creates 5 files (Product model, SKU, Price, InventoryLevel, ProductRepository)
4. Runs `yarn lint` (should pass)
5. Runs `yarn test` (should pass)
6. Commits with message: `feat(domain): add shared components for product catalog`
7. Creates PR

**Success Criteria**:
- ✅ No import errors
- ✅ No missing dependency errors
- ✅ Lint passes
- ✅ Test passes
- ✅ Commit created
- ✅ PR created

**Failure Indicators**:
- ❌ `Cannot find module` error (Bug #122 not fixed)
- ❌ Import path errors
- ❌ Lint failures
- ❌ Test failures

---

### Phase 5: Execute Use Case YAMLs
**Objective**: Verify atomic use case execution
**Commands**:
```bash
/06-execute-layer-steps --file=spec/.../create-product-implementation.yaml
/06-execute-layer-steps --file=spec/.../update-product-implementation.yaml
/06-execute-layer-steps --file=spec/.../archive-product-implementation.yaml
```

**Expected Behavior**:
Each execution:
1. Creates use case-specific branch
2. Creates use case files (input, output, errors, use case interface)
3. Runs quality checks
4. Creates atomic commit
5. Creates separate PR

**Success Criteria**:
- ✅ 3 separate branches created
- ✅ 3 separate commits
- ✅ 3 separate PRs
- ✅ Each PR has 2-3 files (atomic, reviewable)
- ✅ All quality checks pass

**Benefits Validated**:
- ✅ Atomic commits per use case (vs 1 monolithic commit)
- ✅ Better reviewability (2 files vs 17 files)
- ✅ True Vertical Slice Architecture
- ✅ Parallel execution possible

---

### Phase 6: Edge Case Testing
**Objective**: Test boundary conditions

**Test 6A: Single Use Case**
```bash
# Input: Feature with only 1 use case
# Expected: 2 YAMLs (1 shared + 1 use case)
```

**Test 6B: No Shared Components**
```bash
# Input: Feature with no shared models/VOs/repos
# Expected: N use case YAMLs only (no shared YAML)
```

**Test 6C: Many Use Cases**
```bash
# Input: Feature with 10 use cases
# Expected: 11 YAMLs (1 shared + 10 use cases)
```

---

## ✅ **Success Criteria**

### Primary Criteria (Must Pass)
1. ✅ **Bug #122 Fixed**: `/06` executes without import/dependency errors
2. ✅ **Issue #143 Test 1**: JSON plan has `sharedComponents` + `useCases`
3. ✅ **Issue #143 Test 2**: 6 modular YAMLs generated (not monolithic)
4. ✅ **Issue #143 Test 3**: `/06` executes modular YAMLs successfully
5. ✅ **Atomic Commits**: Each use case creates separate commit + PR

### Secondary Criteria (Desirable)
6. ⚡ **Performance**: Each YAML executes in < 3 minutes
7. 🎯 **Quality**: All quality checks pass (lint + test)
8. 📚 **Documentation**: Clear modular structure
9. 🏗️ **Architecture**: True vertical slice per use case
10. 🔄 **Completeness**: All use cases independently executable

## 📊 **Monitoring Metrics**

### Quantitative
- Number of YAMLs generated (expect 4 for 3 use cases)
- Number of commits created (expect 4)
- Number of PRs created (expect 4)
- Files per commit (expect 2-5 per use case, vs 17 monolithic)
- Execution time per YAML
- Token usage per phase

### Qualitative
- Reviewability (1-5): Can PRs be reviewed easily?
- Atomicity (1-5): Are commits truly atomic?
- Architecture (1-5): True vertical slice?
- Developer Experience (1-5): Easy to understand workflow?

## 📋 **Execution Checklist**

### Pre-Flight (Phase 0)
- [ ] Bug #122 fix verified (utils/ exists, imports correct)
- [ ] Bug #117 implementation verified (modular YAML)
- [ ] Templates updated for modular generation
- [ ] Test project initialized
- [ ] MCP servers ready (or skip if Bug #115 not fixed)

### Phase 1: Planning
- [ ] Execute `/01-plan-layer-features`
- [ ] Verify JSON has `sharedComponents` object
- [ ] Verify JSON has `useCases` array
- [ ] No flat `steps` array
- [ ] Metrics collected

### Phase 2: Validation
- [ ] Execute `/02-validate-layer-plan`
- [ ] RLHF score +1 or +2
- [ ] Modular structure validated
- [ ] Metrics collected

### Phase 3: Modular Generation
- [ ] Execute `/03-generate-layer-code`
- [ ] Count YAMLs generated (expect 4)
- [ ] Verify `shared-implementation.yaml` exists
- [ ] Verify 3 use case YAMLs exist
- [ ] No monolithic YAML
- [ ] Metrics collected

### Phase 4: Shared Execution
- [ ] Execute `/06` on `shared-implementation.yaml`
- [ ] No import/dependency errors
- [ ] Lint passes
- [ ] Test passes
- [ ] Commit created
- [ ] PR created
- [ ] Metrics collected

### Phase 5: Use Case Execution
- [ ] Execute `/06` on `create-product-implementation.yaml`
- [ ] Execute `/06` on `update-product-implementation.yaml`
- [ ] Execute `/06` on `archive-product-implementation.yaml`
- [ ] 3 separate branches created
- [ ] 3 separate commits
- [ ] 3 separate PRs
- [ ] Metrics collected

### Phase 6: Edge Cases
- [ ] Test single use case (2 YAMLs expected)
- [ ] Test no shared components (N YAMLs expected)
- [ ] Test many use cases (11 YAMLs expected)

### Post-Execution
- [ ] All metrics documented
- [ ] Screenshots captured
- [ ] Issue #143 acceptance criteria met
- [ ] Lessons learned recorded
- [ ] Next steps identified

## 🎯 **Expected Results**

### Ideal Outcome
```json
{
  "phase1": {
    "status": "✅ SUCCESS",
    "jsonStructure": "modular (sharedComponents + useCases)",
    "useCases": 3
  },
  "phase2": {
    "status": "✅ SUCCESS",
    "rlhfScore": "+2 PERFECT",
    "modularStructureValidated": true
  },
  "phase3": {
    "status": "✅ SUCCESS",
    "yamlsGenerated": 4,
    "modular": true,
    "monolithic": false
  },
  "phase4": {
    "status": "✅ SUCCESS",
    "sharedExecuted": true,
    "filesCreated": 5,
    "noErrors": true
  },
  "phase5": {
    "status": "✅ SUCCESS",
    "useCasesExecuted": 3,
    "atomicCommits": 3,
    "separatePRs": 3,
    "reviewability": "excellent"
  },
  "issue143": {
    "status": "✅ COMPLETE",
    "test1": "✅ JSON modular structure",
    "test2": "✅ Modular YAMLs generated",
    "test3": "✅ Execution successful"
  }
}
```

## 🚨 **Failure Scenarios**

### Scenario A: Bug #122 Not Fixed
**Symptoms**: Import errors, missing dependency errors
**Action**: STOP experiment, fix Bug #122 first
**Priority**: P0 (blocks everything)

### Scenario B: Bug #117 Not Implemented
**Symptoms**: Single monolithic YAML generated
**Action**: STOP experiment, implement modular generation
**Priority**: P0 (blocks Issue #143)

### Scenario C: Modular YAMLs Generated but Won't Execute
**Symptoms**: `/06` fails on modular YAMLs
**Action**: Debug execution logic, check YAML format
**Priority**: P0 (partial success)

### Scenario D: Quality Checks Fail
**Symptoms**: Lint or test failures
**Action**: Analyze errors, fix templates
**Priority**: P1 (execution works but quality issues)

## 📈 **Success Metrics**

| Metric | Target | Measured |
|--------|--------|----------|
| YAMLs generated | 4 (1 shared + 3 use cases) | ___ |
| Monolithic YAML | 0 | ___ |
| Import errors | 0 | ___ |
| Lint failures | 0 | ___ |
| Test failures | 0 | ___ |
| Commits created | 4 | ___ |
| PRs created | 4 | ___ |
| Files per PR | 2-5 | ___ |
| Execution time per YAML | < 3 min | ___ |
| Issue #143 tests passed | 3/3 | ___ |

## 📝 **Result Template**

```markdown
## Experiment #003 Result

**Execution Date**: [YYYY-MM-DD HH:MM]
**Version**: 2.2.0
**Executor**: [Name]
**Feature**: Product Catalog Management (3 use cases)

### Phase 0: Pre-Flight Checks
- Bug #122 Fixed: ✅/❌
- Bug #117 Implemented: ✅/❌
- Templates Updated: ✅/❌
- Ready to Proceed: ✅/❌

### Phase 1: Modular JSON Plan
- Status: ✅/❌
- JSON Structure: modular / monolithic
- Shared Components: [number]
- Use Cases: [number]

### Phase 2: Validation
- Status: ✅/❌
- RLHF Score: [+2/+1/0/-1/-2]
- Modular Structure: ✅/❌

### Phase 3: Modular YAML Generation
- Status: ✅/❌
- YAMLs Generated: [number]
- Modular: ✅/❌
- Monolithic: ✅/❌

### Phase 4: Shared Execution
- Status: ✅/❌
- Import Errors: [number]
- Lint: ✅/❌
- Test: ✅/❌
- Commit: ✅/❌
- PR: ✅/❌

### Phase 5: Use Case Execution
- Status: ✅/❌
- Use Cases Executed: [number]
- Atomic Commits: [number]
- Separate PRs: [number]
- Reviewability: [1-5]

### Issue #143 Tests
- Test 1 (JSON modular): ✅/❌
- Test 2 (Modular YAMLs): ✅/❌
- Test 3 (Execution): ✅/❌
- **Overall**: ✅/❌

### Overall Success
- [SUCCESS/PARTIAL/FAILURE]
- Completion Rate: [%]
- Quality Score: [average]

### Observations
[Key findings, improvements validated]

### Recommendations
[Next steps, remaining issues]
```

## 🎯 **Next Steps After Experiment**

### If SUCCESS ✅
1. Close Issue #143 (test plan complete)
2. Document modular workflow in README
3. Create video tutorial for modular generation
4. Update templates with lessons learned

### If PARTIAL ⚠️
1. Identify which phases failed
2. Create issues for remaining problems
3. Plan follow-up experiment

### If FAILURE ❌
1. Identify blockers
2. Fix critical bugs first
3. Re-run experiment after fixes

---

**Started**: [To be filled during execution]
**Last Update**: 2025-10-01 (Document created)
**Status**: 🔄 READY TO START (pending Bug #122 fix verification)
