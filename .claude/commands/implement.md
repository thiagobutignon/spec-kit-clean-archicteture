---
title: "Execute Implementation"
description: "Execute layer-specific tasks using .regent templates with RLHF validation"
category: "implementation"
stage: "execution"
priority: 5
tags:
  - implementation
  - clean-architecture
  - regent-templates
  - rlhf-validation
parameters:
  task_list:
    type: "string"
    description: "Task list ID or specific tasks to implement"
    required: true
  layer:
    type: "enum"
    values: ["domain", "data", "infra", "presentation", "main", "all"]
    description: "Specific layer to implement"
    required: false
next_command: "/analyze (optional) for validation or next /specify cycle"
---

# Task: Execute Implementation

You are executing Clean Architecture implementation tasks using the **hybrid scaffolding + AI generation approach** with **.regent templates** and **RLHF validation**.

## 🚀 NEW: SpecToYamlTransformer Integration

**Issue #77 Resolved**: We now have a transformer that converts spec-kit tasks directly to YAML workflows!

### Quick Usage
```bash
/implement T001
```

This will:
1. **Transform** the task from `.specify/tasks/TASK-LIST-SPEC-001-cli.md` to YAML workflow
2. **Save** the workflow to `.regent/workflows/T001-workflow.yaml`
3. **Execute** the workflow with GitFlow enforcement (branches, commits, PRs)

### Transformer Process
```typescript
import { SpecToYamlTransformer } from './packages/cli/src/core/SpecToYamlTransformer.js';

// Create transformer with GitFlow config
const transformer = new SpecToYamlTransformer({
  branch_prefix: 'feature/',
  target_branch: 'main',
  commit_convention: 'feat({layer}): {task-id} - {description}'
});

// Transform task to YAML workflow
const workflow = await transformer.transformTask(taskId, taskListPath);

// Save workflow for execution
await transformer.saveWorkflowAsYaml(workflow, outputPath);
```

## 🔄 Hybrid Implementation Process

### 1. Template-Guided Generation
- **Load appropriate .regent template** for the layer
- **Extract AI-NOTEs** for generation guidance
- **Apply task-specific context** from specifications
- **Generate code** following template structure

### 2. RLHF Validation
- **Automatic scoring** of generated code
- **Architectural compliance** checking
- **Layer dependency validation**
- **Quality assurance** before finalization

## 📋 Input Processing

**Task Source**: $TASK_LIST
**Target Layer**: $LAYER (optional - if not specified, process all layers in order)

## 🏗️ Implementation Strategy

### Phase-Based Execution
Execute tasks in **dependency order** to prevent architectural violations:

1. **Domain Layer First** (zero dependencies)
2. **Data & Infrastructure** (parallel, depend on domain)
3. **Presentation Layer** (depends on domain)
4. **Main Layer Last** (composition root)

### Template Selection Matrix

| Layer | Template File | Purpose |
|-------|--------------|---------|
| Domain | `backend-domain-template.regent` | Entities, use cases, contracts |
| Data | `backend-data-template.regent` | Repository implementations |
| Infrastructure | `backend-infra-template.regent` | External integrations |
| Presentation | `backend-presentation-template.regent` | Controllers, DTOs |
| Main | `backend-main-template.regent` | DI and bootstrapping |

## 🎯 Implementation Workflow

### For Each Task:

#### Step 0: Transform Task to YAML (NEW!)
```typescript
// Use SpecToYamlTransformer to convert task to workflow
const transformer = new SpecToYamlTransformer();
const workflow = await transformer.transformTask(taskId);

// Save workflow for audit and execution
const workflowPath = `.regent/workflows/${taskId}-workflow.yaml`;
await transformer.saveWorkflowAsYaml(workflow, workflowPath);
```

#### Step 1: Task Analysis
```yaml
task_analysis:
  id: "T001"
  layer: "domain"
  type: "create_entity"
  dependencies: []
  acceptance_criteria: [...]
  file_path: "src/features/user/create-user/domain/entities/user.ts"
```

#### Step 2: Template Loading
```typescript
// Load appropriate .regent template
const template = await loadTemplate(`${layer}-${target}-template.regent`);

// Extract AI-NOTEs and patterns
const guidance = extractAIGuidance(template);
const patterns = extractPatterns(template);
```

#### Step 3: Context Preparation
```typescript
// Prepare generation context
const context = {
  task: taskDetails,
  domain: domainModel,
  entities: relatedEntities,
  valueObjects: relatedVOs,
  useCases: relatedUseCases,
  guidance: aiNotes
};
```

#### Step 4: Code Generation
```typescript
// Generate code using template + context
const generatedCode = await generateFromTemplate(template, context);

// Apply AI-NOTEs guidance
const refinedCode = applyGuidance(generatedCode, guidance);
```

#### Step 5: RLHF Validation
```typescript
// Validate against Clean Architecture rules
const score = await rlhfValidation(refinedCode, layer, patterns);

if (score < 1) {
  // Regenerate with feedback
  return regenerateWithFeedback(refinedCode, feedback);
}
```

#### Step 6: File Creation
```typescript
// Write validated code to file system
await writeCodeToFile(refinedCode, task.file_path);

// Update task status
await markTaskCompleted(task.id);
```

## 🤖 AI-NOTEs Integration

### Template Guidance Examples

#### Domain Layer AI-NOTEs
```yaml
# AI-NOTE: Domain entities must have ZERO external dependencies
# AI-NOTE: Use value objects for primitive obsession prevention
# AI-NOTE: Implement business rules as methods, not setters
# AI-NOTE: Domain events should be immutable and serializable
```

#### Data Layer AI-NOTEs
```yaml
# AI-NOTE: Repository implementations must use dependency injection
# AI-NOTE: Never expose database types to domain layer
# AI-NOTE: Use DTOs for data transfer, entities for business logic
# AI-NOTE: Implement proper error handling for database operations
```

#### Infrastructure AI-NOTEs
```yaml
# AI-NOTE: Wrap external services with adapters
# AI-NOTE: Implement circuit breaker pattern for resilience
# AI-NOTE: Use configuration injection, never hardcode URLs
# AI-NOTE: Log all external service interactions
```

## 📊 RLHF Scoring Integration

### Layer-Specific Scoring Rules

#### Domain Layer Validation
```typescript
const domainValidation = {
  zeroExternalDependencies: {
    weight: 10,
    check: hasNoExternalImports,
    violation: "CATASTROPHIC (-2)"
  },
  businessRulesInMethods: {
    weight: 5,
    check: hasBusinessMethodsNotSetters,
    violation: "RUNTIME_ERROR (-1)"
  }
};
```

#### Architecture Compliance
```typescript
const architectureValidation = {
  dependencyDirection: {
    check: respectsDependencyRule,
    violation: "CATASTROPHIC (-2)"
  },
  layerIsolation: {
    check: noLayerViolations,
    violation: "RUNTIME_ERROR (-1)"
  }
};
```

## 🔄 Implementation Modes

### 1. Sequential Mode (Default)
Execute tasks one by one in dependency order:
```bash
/implement from tasks: TASK-001
# Completes T001, then proceeds to T002, etc.
```

### 2. Layer Mode
Execute all tasks for a specific layer:
```bash
/implement from tasks: TASK-001 --layer=domain
# Completes all domain layer tasks
```

### 3. Parallel Mode
Execute independent tasks simultaneously:
```bash
/implement from tasks: TASK-001 --parallel
# Executes tasks with no dependencies in parallel
```

## 📁 Output Structure

### Generated Files
Each implementation creates:
```
src/features/[domain]/[use-case]/
├── domain/
│   ├── entities/[entity].ts           # ✅ Generated + validated
│   ├── value-objects/[vo].ts          # ✅ Generated + validated
│   ├── use-cases/[use-case].ts        # ✅ Generated + validated
│   └── repositories/[repo].ts         # ✅ Generated + validated
├── data/
│   ├── repositories/[repo]-impl.ts    # ✅ Generated + validated
│   └── dtos/[entity]-dto.ts           # ✅ Generated + validated
├── infra/
│   └── adapters/[service]-adapter.ts  # ✅ Generated + validated
├── presentation/
│   ├── controllers/[controller].ts    # ✅ Generated + validated
│   └── dtos/[request]-dto.ts          # ✅ Generated + validated
└── main/
    ├── container.ts                   # ✅ Generated + validated
    └── routes.ts                      # ✅ Generated + validated
```

### Implementation Reports
```
.specify/implementation/__FEATURE_NAME__/
├── implementation-report.md           # Summary of generated code
├── rlhf-scores.json                  # RLHF scores per file
├── architecture-validation.md        # Compliance report
└── test-coverage.md                  # Test execution results
```

## ✅ Success Validation

### Per Task Validation
- [ ] **Code generated** matches template structure
- [ ] **RLHF score ≥ +1** (Good or better)
- [ ] **No architectural violations** detected
- [ ] **Tests pass** for generated code
- [ ] **File created** at correct location

### Layer Completion Validation
- [ ] **All layer tasks completed** successfully
- [ ] **Layer boundaries respected** (no cross-layer violations)
- [ ] **Integration tests pass** for layer interactions
- [ ] **Documentation updated** with layer decisions

### Feature Completion Validation
- [ ] **All layers implemented** and integrated
- [ ] **End-to-end tests pass** for complete feature
- [ ] **Performance meets requirements** (if specified)
- [ ] **Security validation** completed
- [ ] **Feature ready for deployment**

## 🎯 Error Handling

### Generation Failures
```typescript
if (rlhfScore < 0) {
  // Architectural violation or runtime error
  await regenerateWithStricterGuidance();
}

if (rlhfScore === 0) {
  // Low confidence - request human review
  await requestReview(generatedCode, uncertainties);
}
```

### Template Issues
```typescript
if (templateNotFound) {
  // Fallback to base template with warnings
  await useBaseTemplateWithWarnings();
}

if (aiNotesInconsistent) {
  // Log inconsistency and proceed with best judgment
  await logInconsistencyAndProceed();
}
```

## 📈 Continuous Improvement

### RLHF Learning Loop
1. **Track successful patterns** (score +2)
2. **Identify failure patterns** (score ≤ 0)
3. **Update template AI-NOTEs** based on learnings
4. **Regenerate failing templates** with improvements

### Template Evolution
- **Performance monitoring** of generated code
- **Developer feedback** on code quality
- **Automatic pattern extraction** from high-scoring code
- **Template versioning** for backward compatibility

## 📍 Completion

After successful implementation:

1. **Generate implementation report**
2. **Update project documentation**
3. **Run full test suite**
4. **Perform security scan**
5. **Ready for `/analyze` validation** (optional)
6. **Ready for next `/specify` cycle**

The implementation is complete when all tasks achieve RLHF score ≥ +1 and pass all layer-specific validation rules.

## 🚧 Implementation Status (Issue #76)

### ✅ Completed
- **SpecToYamlTransformer** (Issue #77) - Fully implemented with:
  - Task parsing from markdown
  - YAML workflow generation
  - GitFlow enforcement (branches, commits, PRs)
  - Security sanitization
  - 11 passing tests

### ⚠️ Pending
- **execute-steps.ts** - Workflow executor not yet located/created
- **Integration testing** - End-to-end test of /implement command
- **RLHF scoring integration** - Connect to scoring system

### 📝 Notes
- The transformer bridges the gap between spec-kit documentation (6,336 lines) and .regent execution (808 lines)
- Addresses "Parallel Evolution" anti-pattern discovered during dogfooding
- Enables 10x performance improvement by eliminating re-analysis