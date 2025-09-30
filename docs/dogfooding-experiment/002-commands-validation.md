# Experiment #002: Commands 01-03 Validation

**Date**: 2025-09-29
**Version**: 2.1.9
**Status**: 🔄 IN PROGRESS
**Type**: End-to-End Workflow Validation

## 📊 **EXPERIMENT OBJECTIVE**

Validate the complete workflow from planning to code generation using commands `/01`, `/02`, and `/03` with the latest version (2.1.9) that includes:
- MCP auto-installation
- Improved error handling
- Path escaping for spaces
- Updated branding (regent)

## 🎯 **Test Scope**

This experiment will test the complete workflow:

1. **`/01-plan-layer-features`** - Generate JSON plan for domain layer
2. **`/02-validate-layer-plan`** - Validate the generated plan
3. **`/03-generate-layer-code`** - Generate actual implementation code

## 🔬 **Test Scenario**

**Target Feature**: **Product Catalog Management**
**Layer Focus**: Domain Layer → Data Layer → Infrastructure Layer
**Template Target**: Backend templates (domain, data, infra)

### Choice Justification
- **Product Catalog** is a common e-commerce domain with clear business rules
- **Multiple Layers** tests the complete vertical slice architecture
- **Backend Templates** validates the core Clean Architecture patterns

## 🛠️ **Setup**

### Prerequisites
- ✅ The Regent v2.1.9 installed (`the-regent-cli@2.1.9`)
- ✅ MCP servers configured (Serena, Context7, Chrome DevTools, Playwright)
- ✅ Clean workspace for dogfooding
- ✅ `.regent` templates available
- ✅ `.claude` commands available

### Environment Preparation
```bash
# Create test project
cd dogfooding
regent init product-catalog --ai claude --skip-mcp

# Verify installation
cd product-catalog
ls -la .regent/templates/
ls -la .claude/commands/
```

## 📋 **Execution Plan**

### Phase 1: Domain Layer Planning
**Objective**: Generate complete domain layer plan
**Command**: `/01-plan-layer-features`

**Input Specification**:
```
Feature: Product Catalog Management

Use Cases:
1. Create Product - Add new product to catalog with SKU, name, description, price, and inventory
2. Update Product - Modify existing product details
3. Archive Product - Soft delete product from active catalog
4. Search Products - Query products by name, category, price range
5. Manage Inventory - Track and update product stock levels

Business Rules:
- SKU must be unique across catalog
- Price must be positive and support multiple currencies
- Inventory cannot go negative
- Archived products are not shown in search results
- Products must have at least one category
```

**Expected Output**:
- JSON plan with ~15-20 files
- Complete use case slices (create, update, archive, search, manage-inventory)
- Shared domain components (Product entity, value objects, repository interface)
- Zero external dependencies
- RLHF indicators for +2 score

### Phase 2: Plan Validation
**Objective**: Validate architectural compliance
**Command**: `/02-validate-layer-plan`

**Validation Criteria**:
- ✅ Schema compliance (all required keys)
- ✅ Naming conventions (PascalCase, kebab-case)
- ✅ Domain layer purity (zero external dependencies)
- ✅ Logical consistency (paths, dependencies)
- ✅ DDD patterns (entities, value objects, repository)
- ✅ Ubiquitous language completeness

**Expected RLHF Score**: +2 (PERFECT) or +1 (GOOD)

### Phase 3: Code Generation
**Objective**: Generate actual TypeScript implementation
**Command**: `/03-generate-layer-code`

**Expected Outcome**:
- All files created in correct paths
- TypeScript code compiles without errors
- Zero external dependencies in domain layer
- Proper interface definitions
- Business rules encoded in entities
- Complete error hierarchy

### Phase 4: Data Layer (Optional)
**Objective**: Test layer progression
**Command**: `/01-plan-layer-features --layer=data`

### Phase 5: Integration Test (Optional)
**Objective**: Verify cross-layer compliance
**Commands**: Build and test generated code

## ✅ **Success Criteria**

### Primary Criteria (Must Pass)
1. ✅ **Phase 1**: JSON plan generated with complete structure
2. ✅ **Phase 2**: Validation passes with score +1 or +2
3. ✅ **Phase 3**: Code generation completes without errors
4. ✅ **Architecture**: Zero violations in domain layer
5. ✅ **Compilation**: Generated TypeScript code compiles

### Secondary Criteria (Desirable)
6. ⚡ **Performance**: Each phase completes in < 5 minutes
7. 🎯 **Quality**: RLHF score of +2 (PERFECT)
8. 📚 **Documentation**: Clear ubiquitous language
9. 🏗️ **Structure**: Clean vertical slice architecture
10. 🔄 **Completeness**: All use cases properly implemented

## 📊 **Monitoring Metrics**

### Quantitative
- Token usage per phase
- Execution time per command
- Number of files generated
- Lines of code generated
- Error/warning count

### Qualitative
- Architecture conformance (1-5)
- Code quality (1-5)
- Template fidelity (1-5)
- DDD alignment (1-5)
- Clean Architecture compliance (1-5)

## 📋 **Execution Checklist**

### Pre-Execution
- [ ] Environment verified (regent v2.1.9)
- [ ] Test project initialized
- [ ] Templates accessible
- [ ] Commands available
- [ ] MCP servers ready

### Phase 1: Planning
- [ ] Execute `/01-plan-layer-features`
- [ ] JSON plan generated
- [ ] Structure validated manually
- [ ] Metrics collected

### Phase 2: Validation
- [ ] Execute `/02-validate-layer-plan`
- [ ] RLHF score recorded
- [ ] Violations identified (if any)
- [ ] Quality metrics collected

### Phase 3: Generation
- [ ] Execute `/03-generate-layer-code`
- [ ] Files created in correct paths
- [ ] TypeScript compilation test
- [ ] Architecture verification

### Post-Execution
- [ ] All metrics documented
- [ ] Screenshots captured
- [ ] Lessons learned recorded
- [ ] Next steps identified

## 🎯 **Expected Results**

### Ideal Outcome
```json
{
  "phase1": {
    "status": "✅ SUCCESS",
    "filesPlanned": 18,
    "useCaseSlices": 5,
    "executionTime": "< 5 min"
  },
  "phase2": {
    "status": "✅ SUCCESS",
    "rlhfScore": "+2 PERFECT",
    "violations": 0
  },
  "phase3": {
    "status": "✅ SUCCESS",
    "filesCreated": 18,
    "compilationErrors": 0,
    "architectureViolations": 0
  }
}
```

## 📝 **Result Template**

```markdown
## Experiment #002 Result

**Execution Date**: [YYYY-MM-DD HH:MM]
**Version**: 2.1.9
**Executor**: Claude Code
**Feature**: Product Catalog Management

### Phase 1: Planning
- Status: ✅/❌
- Files Planned: [number]
- Use Case Slices: [number]
- Execution Time: [time]
- Token Usage: [number]

### Phase 2: Validation
- Status: ✅/❌
- RLHF Score: [+2/+1/0/-1/-2]
- Violations: [number]
- Quality Rating: [1-5]

### Phase 3: Generation
- Status: ✅/❌
- Files Created: [number]
- Compilation: ✅/❌
- Architecture: ✅/❌

### Overall Success
- [SUCCESS/PARTIAL/FAILURE]
- Completion Rate: [%]
- Quality Score: [average]

### Observations
[Key findings, issues, improvements]

### Recommendations
[Next steps, optimizations, fixes needed]
```

## 🎯 **Experiment Status**

**Current Phase**: Environment Setup
**Next Action**: Document bugs and continue testing
**Estimated Duration**: 30-45 minutes total

---

## 🐛 **BUGS DISCOVERED**

### Bug #108: MCP Installation "Already Exists" Treated as Failure
**Discovered**: 2025-09-29 23:58 (during `regent init`)
**Version**: 2.1.9
**Severity**: Medium (UX Issue)
**Phase**: Environment Setup

**Description**: When MCP servers already exist in local config, `regent init` marks them as "failed" instead of "skipped", causing user confusion.

**Current Behavior**:
```
❌ Serena installation failed: MCP server serena already exists in local config
❌ Context7 installation failed: MCP server context7 already exists in local config
❌ Chrome DevTools installation failed: MCP server chrome-devtools already exists in local config
```

**Expected Behavior**:
```
⏭️  Serena - Already installed (skipped)
⏭️  Context7 - Already installed (skipped)
⏭️  Chrome DevTools - Already installed (skipped)
```

**Impact**:
- User confusion (thinks installation failed)
- Inaccurate reporting (shows failures when none exist)
- Poor UX with red ❌ indicators

**Reproduction**:
1. Have MCP servers already installed: `claude mcp list`
2. Run: `regent init test-project`
3. Select servers to install (that already exist)
4. Observe "failed" message instead of "skipped"

**Location**: `src/cli/utils/mcp-installer.ts` - all installation methods
**Status**: 🔴 Open
**Issue**: #108
**Fix Priority**: Medium
**Workaround**: Ignore "failed" messages for servers that are actually working

---

### Bug #109: CLI Help Missing Options Documentation
**Discovered**: 2025-09-30 00:03 (during `regent init` with flags)
**Version**: 2.1.9
**Severity**: Low (Documentation/Discoverability Issue)
**Phase**: Environment Setup

**Description**: The `regent --help` output doesn't inform users about command-specific help (`regent init --help`), making it hard to discover useful options like `--skip-mcp`, `--here`, `--force`, etc.

**Current Behavior**:
```bash
regent --help
# Shows: init [options] [project-name]
# But no hint that "regent init --help" exists
```

**Expected Behavior**:
```bash
regent --help
# Should hint: "Use 'regent init --help' for command options"
```

**Impact**:
- Low discoverability of useful flags
- Users don't know `--skip-mcp`, `--here`, `--force` exist
- Poor CLI UX (options work but are hidden)

**Note**: All options actually **work perfectly** when used! This is just a discoverability issue.

**Reproduction**:
1. Run: `regent --help`
2. See `init [options]` without details
3. Most users won't try `regent init --help`

**Location**: `src/cli/main.ts` - command descriptions
**Status**: 🔴 Open
**Issue**: #109
**Fix Priority**: Low
**Workaround**: Run `regent init --help` to see all options

---

**Started**: 2025-09-29 23:55
**Last Update**: 2025-09-30 00:01
**Status**: 🔄 IN PROGRESS - Bug mapping active