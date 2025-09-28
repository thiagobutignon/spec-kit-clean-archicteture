# Issue Fixing Strategy - Architectural Integration

## Priority Analysis of Open Issues

### Critical Architecture Issues (From Dogfooding)

#### Issue #77: 💡 Optimization - Create Transformer (FOUNDATION)
**Priority: 1 (Start Here)**
- **Purpose**: Create spec-kit → YAML transformer
- **Complexity**: Medium
- **Dependencies**: None
- **Impact**: Enables all other fixes
- **Files**: New transformer class

#### Issue #76: 🐛 /implement Bypass (INTEGRATION)
**Priority: 2**
- **Purpose**: Modify /implement to use transformer
- **Complexity**: Medium
- **Dependencies**: #77 (transformer)
- **Impact**: Fixes execution workflow
- **Files**: /implement command modification

#### Issue #75: 🔴 Critical Integration (SYSTEM UNIFICATION)
**Priority: 3**
- **Purpose**: Complete spec-kit/.regent integration
- **Complexity**: High
- **Dependencies**: #77, #76
- **Impact**: Unifies the two systems
- **Files**: Multiple command integrations

#### Issue #78: 🚨 GitFlow Enforcement (QUALITY)
**Priority: 4**
- **Purpose**: Enforce GitFlow in all YAML
- **Complexity**: Medium
- **Dependencies**: #77, #76, #75
- **Impact**: Deterministic builds
- **Files**: YAML templates, validation

### Other Open Issues

#### Issue #72: 🧪 Validation Tests
**Priority: 5**
- **Purpose**: Add tests for feature slicing
- **Complexity**: Low
- **Impact**: Quality assurance

#### Issue #71: 📁 Directory Structure
**Priority: 6**
- **Purpose**: Fix .regent/config location
- **Complexity**: Low
- **Impact**: Organization

#### Issue #70: 🚨 Missing Templates
**Priority: 7**
- **Purpose**: Create 10 missing templates
- **Complexity**: High
- **Impact**: Feature completeness

#### Issue #69: 🔧 Path Inconsistency
**Priority: 8**
- **Purpose**: Fix feature slicing paths
- **Complexity**: Low
- **Impact**: Documentation

## Implementation Strategy

### Phase 1: Foundation (Issue #77)
**Goal**: Create the transformer infrastructure

```typescript
// Create: src/core/SpecToYamlTransformer.ts
interface SpecToYamlTransformer {
  transformTask(taskId: string): Promise<YamlWorkflow>;
  transformFromMarkdown(markdown: string): Promise<YamlWorkflow>;
  addGitFlowSteps(workflow: YamlWorkflow): YamlWorkflow;
}
```

**Branch**: `feat/77-spec-yaml-transformer`
**Files to create**:
- `src/core/SpecToYamlTransformer.ts`
- `src/core/SpecToYamlTransformer.test.ts`
- `src/types/YamlWorkflow.ts`

### Phase 2: Integration (Issue #76)
**Goal**: Modify /implement to use transformer

**Branch**: `feat/76-implement-integration`
**Files to modify**:
- Command that handles `/implement`
- Route through transformer
- Call execute-steps.ts

### Phase 3: System Unification (Issue #75)
**Goal**: Integrate all spec-kit commands

**Branch**: `feat/75-complete-integration`
**Files to modify**:
- All spec-kit commands
- Ensure YAML output
- Integration tests

### Phase 4: GitFlow Enforcement (Issue #78)
**Goal**: Add GitFlow to all YAML workflows

**Branch**: `feat/78-gitflow-enforcement`
**Files to modify**:
- Transformer to add GitFlow steps
- Validation in execute-steps.ts
- Documentation

## PR Strategy

Each issue will have its own PR:

1. **PR for #77**: Create transformer foundation
2. **PR for #76**: Integrate /implement command
3. **PR for #75**: Complete system integration
4. **PR for #78**: Add GitFlow enforcement

## Success Metrics

### Issue #77 Success:
- ✅ Transformer created and tested
- ✅ Can convert task → YAML
- ✅ Unit tests passing

### Issue #76 Success:
- ✅ /implement uses transformer
- ✅ No direct file creation
- ✅ Calls execute-steps.ts

### Issue #75 Success:
- ✅ All commands generate YAML
- ✅ Integration tests pass
- ✅ No system disconnect

### Issue #78 Success:
- ✅ All YAML has GitFlow steps
- ✅ Branch/PR creation automatic
- ✅ 100% compliance

## Files to Create/Modify

### New Files (Issue #77):
```
src/core/
├── SpecToYamlTransformer.ts
├── SpecToYamlTransformer.test.ts
└── types/
    └── YamlWorkflow.ts
```

### Modified Files (Issues #76-#78):
```
- /implement command handler
- All spec-kit command handlers
- execute-steps.ts (validation)
- Integration tests
```

## Timeline

- **Week 1**: Issue #77 (Transformer)
- **Week 2**: Issue #76 (/implement integration)
- **Week 3**: Issue #75 (Complete integration)
- **Week 4**: Issue #78 (GitFlow enforcement)

## Next Action

Start with Issue #77 - Create the transformer foundation that enables all other fixes.

```bash
git checkout main
git pull origin main
git checkout -b feat/77-spec-yaml-transformer
```