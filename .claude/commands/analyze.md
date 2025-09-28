---
title: "Analyze Cross-Artifact Consistency"
description: "Validate consistency and alignment across specifications, plans, tasks, and implementation"
category: "validation"
stage: "quality-assurance"
priority: 4.5
tags:
  - analysis
  - consistency
  - validation
  - quality-assurance
  - clean-architecture
parameters:
  scope:
    type: "enum"
    values: ["feature", "layer", "project", "all"]
    description: "Scope of analysis"
    required: false
  artifacts:
    type: "array"
    description: "Specific artifacts to analyze"
    required: false
next_command: "/implement (if consistent) or fix inconsistencies first"
---

# Task: Analyze Cross-Artifact Consistency

You are performing a **comprehensive consistency analysis** across all project artifacts to ensure alignment between specifications, plans, tasks, and implementation before proceeding with execution.

## 🎯 Analysis Purpose

**Quality Assurance**: Catch inconsistencies before they become implementation problems
**Risk Mitigation**: Identify missing or conflicting requirements
**Architecture Validation**: Ensure Clean Architecture principles are maintained
**Stakeholder Alignment**: Verify all artifacts support the same goals

## 📋 Input Processing

**Analysis Scope**: $SCOPE (feature/layer/project/all)
**Target Artifacts**: $ARTIFACTS (optional - if not specified, analyze all relevant artifacts)

## 🔍 Consistency Analysis Framework

### 1. Vertical Consistency (Requirement Flow)

#### Specification → Plan Alignment
```markdown
## 📋 Specification to Plan Consistency

### Domain Model Alignment
**Specification Entities**: [List from spec]
**Plan Implementation**: [List from plan]
**Consistency Check**:
- [ ] All spec entities have implementation plans
- [ ] No plan entities missing from specification
- [ ] Entity relationships properly mapped

### Use Case Coverage
**Specification Use Cases**: [List from spec]
**Plan Implementation Tasks**: [List from plan]
**Consistency Check**:
- [ ] All use cases have implementation tasks
- [ ] Task complexity matches use case complexity
- [ ] Use case dependencies reflected in task order

### Layer Responsibility Mapping
**Specification Requirements**: [Requirements by layer]
**Plan Layer Tasks**: [Tasks by layer]
**Consistency Check**:
- [ ] Domain requirements mapped to domain tasks
- [ ] Data requirements mapped to data tasks
- [ ] All layers properly covered
```

#### Plan → Tasks Alignment
```markdown
## 📋 Plan to Tasks Consistency

### Task Coverage Completeness
**Plan Components**: [List from plan]
**Generated Tasks**: [List from tasks]
**Consistency Check**:
- [ ] All plan components have corresponding tasks
- [ ] Task granularity appropriate for implementation
- [ ] No orphaned tasks without plan justification

### Dependency Accuracy
**Plan Dependencies**: [Dependencies from plan]
**Task Dependencies**: [Dependencies from tasks]
**Consistency Check**:
- [ ] Task dependencies respect Clean Architecture rules
- [ ] Plan dependencies accurately reflected in tasks
- [ ] No circular dependencies introduced
```

### 2. Horizontal Consistency (Layer Alignment)

#### Clean Architecture Layer Compliance
```markdown
## 🏗️ Clean Architecture Consistency

### Domain Layer Consistency
**Entities Defined**: [Across all artifacts]
**Value Objects**: [Across all artifacts]
**Use Cases**: [Across all artifacts]
**Consistency Check**:
- [ ] Same entities referenced everywhere
- [ ] Value objects consistently applied
- [ ] Use case interfaces match across artifacts
- [ ] Zero external dependencies maintained

### Data Layer Consistency
**Repository Interfaces**: [Domain definitions]
**Repository Implementations**: [Data layer plans]
**Consistency Check**:
- [ ] All domain repositories have implementations
- [ ] Implementation methods match interface contracts
- [ ] DTO mapping strategies consistent

### Integration Points
**External Services**: [Identified across artifacts]
**Infrastructure Adapters**: [Planned implementations]
**Consistency Check**:
- [ ] All external integrations have adapters
- [ ] Adapter interfaces properly defined
- [ ] Error handling strategies consistent
```

### 3. Technical Consistency

#### Data Model Alignment
```markdown
## 💾 Data Model Consistency

### Entity-DTO Mapping
**Domain Entities**: [Structure and properties]
**Data DTOs**: [Structure and properties]
**API DTOs**: [Structure and properties]
**Consistency Check**:
- [ ] Entity properties properly mapped to DTOs
- [ ] API DTOs support all use case needs
- [ ] No data loss in mapping transformations

### Database Schema Alignment
**Domain Model**: [Entity relationships]
**Database Schema**: [Table relationships]
**Consistency Check**:
- [ ] All entities have corresponding tables
- [ ] Relationships properly represented
- [ ] Constraints match business rules
```

#### API Contract Consistency
```markdown
## 🌐 API Contract Consistency

### Endpoint Coverage
**Use Cases**: [From specification]
**API Endpoints**: [From plan/tasks]
**Consistency Check**:
- [ ] All use cases have API endpoints
- [ ] Endpoint methods match use case operations
- [ ] Request/response formats support use cases

### Validation Rules
**Domain Validation**: [Business rules]
**API Validation**: [Input validation]
**Consistency Check**:
- [ ] API validation enforces domain rules
- [ ] No business logic in presentation layer
- [ ] Consistent error message formats
```

### 4. Test Strategy Consistency

#### Test Coverage Alignment
```markdown
## 🧪 Test Strategy Consistency

### Test Level Coverage
**Specification Acceptance Criteria**: [From spec]
**Planned Tests**: [From plan/tasks]
**Consistency Check**:
- [ ] All acceptance criteria have corresponding tests
- [ ] Test levels appropriate for layer responsibilities
- [ ] Integration points properly tested

### Test Data Requirements
**Domain Examples**: [From specification]
**Test Data Plans**: [From implementation plan]
**Consistency Check**:
- [ ] Test data supports all specified scenarios
- [ ] Edge cases properly covered
- [ ] Performance test data realistic
```

## 📊 Consistency Metrics

### Quantitative Analysis
```markdown
## 📈 Consistency Metrics

### Coverage Metrics
- **Entity Coverage**: [X/Y entities planned] (Target: 100%)
- **Use Case Coverage**: [X/Y use cases tasked] (Target: 100%)
- **API Coverage**: [X/Y endpoints planned] (Target: 100%)
- **Test Coverage**: [X/Y scenarios tested] (Target: 95%+)

### Complexity Alignment
- **Specification Complexity**: [Simple/Medium/Complex]
- **Plan Complexity**: [Story points/effort estimate]
- **Task Granularity**: [Average task size]
- **Alignment Score**: [How well complexity matches]

### Dependency Health
- **Clean Architecture Violations**: [Count] (Target: 0)
- **Circular Dependencies**: [Count] (Target: 0)
- **Orphaned Components**: [Count] (Target: 0)
- **Missing Dependencies**: [Count] (Target: 0)
```

## 🚨 Inconsistency Detection

### Critical Inconsistencies (Must Fix)
```markdown
## 🚨 Critical Issues Found

### Architecture Violations
- **Issue**: [Description of violation]
- **Location**: [Where found]
- **Impact**: [Why this is critical]
- **Resolution**: [How to fix]

### Missing Requirements
- **Issue**: [What's missing]
- **Discovered In**: [Which artifact revealed this]
- **Impact**: [Implementation risk]
- **Resolution**: [What needs to be added]
```

### Warning-Level Inconsistencies (Should Fix)
```markdown
## ⚠️ Warning Issues Found

### Complexity Mismatches
- **Issue**: [Description of mismatch]
- **Artifacts**: [Which artifacts disagree]
- **Risk**: [Potential problems]
- **Recommendation**: [Suggested resolution]

### Coverage Gaps
- **Issue**: [What's not covered]
- **Gap Type**: [Test/Implementation/Documentation]
- **Risk Level**: [Low/Medium/High]
- **Recommendation**: [How to address]
```

## 🔧 Inconsistency Resolution

### Resolution Priority Matrix
| Priority | Issue Type | Action Required |
|----------|------------|----------------|
| **P0** | Architecture Violations | Must fix before implementation |
| **P1** | Missing Requirements | Must clarify before proceeding |
| **P2** | Coverage Gaps | Address during implementation |
| **P3** | Documentation Issues | Fix during or after implementation |

### Resolution Workflow
```markdown
## 🔄 Resolution Process

### For Each Critical Issue:
1. **Root Cause Analysis**: Why did this inconsistency occur?
2. **Impact Assessment**: How does this affect implementation?
3. **Resolution Strategy**: What's the best way to fix this?
4. **Artifact Updates**: Which documents need updates?
5. **Validation**: How to verify the fix is complete?

### For Each Warning Issue:
1. **Risk Assessment**: What's the likelihood and impact?
2. **Cost-Benefit Analysis**: Fix now vs. accept risk?
3. **Mitigation Strategy**: How to minimize risk if not fixed?
4. **Monitoring Plan**: How to watch for problems?
```

## 📁 Analysis Output

### Generated Reports
Create these files in `.specify/analysis/[TIMESTAMP]/`:

1. **`consistency-report.md`** - Complete analysis findings
2. **`critical-issues.md`** - P0/P1 issues requiring immediate attention
3. **`metrics-dashboard.md`** - Quantitative consistency metrics
4. **`resolution-plan.md`** - Recommended fixes and priorities
5. **`validation-checklist.md`** - Post-fix validation steps

### Executive Summary
```markdown
# Consistency Analysis Summary

**Analysis Date**: [DATE]
**Scope**: [SCOPE]
**Artifacts Analyzed**: [COUNT]

## Health Score: [X/100]

### Critical Issues: [COUNT] ❌
- [List critical issues]

### Warning Issues: [COUNT] ⚠️
- [List warning issues]

### Recommendations:
1. [Priority recommendation]
2. [Second priority]
3. [Third priority]

### Ready for Implementation: [YES/NO]
**Rationale**: [Why ready or not ready]
```

## ✅ Analysis Completion Criteria

### Consistency Validation
- [ ] **All critical inconsistencies** identified and documented
- [ ] **Resolution plan** created for each issue
- [ ] **Impact assessment** completed for all findings
- [ ] **Stakeholder review** scheduled for critical issues

### Quality Gates
- [ ] **Architecture violations**: 0 (target)
- [ ] **Missing requirements**: <5% (target)
- [ ] **Coverage gaps**: <10% (target)
- [ ] **Documentation alignment**: >90% (target)

### Implementation Readiness
- [ ] **No blocking inconsistencies** remain
- [ ] **Critical path** clearly defined
- [ ] **Risk mitigation** strategies in place
- [ ] **Success criteria** validated across artifacts

## 📍 Next Steps

Based on analysis results:

### If Consistent (Ready for Implementation)
1. **Proceed with**: `/implement from tasks: [TASK-LIST]`
2. **Monitor**: Watch for issues during implementation
3. **Validate**: Confirm implementation matches analysis

### If Inconsistencies Found
1. **Fix Critical Issues**: Update affected artifacts
2. **Re-run Analysis**: Validate fixes resolve issues
3. **Get Stakeholder Approval**: For any requirement changes
4. **Proceed when clean**: Only implement after consistency achieved

The goal is to catch and resolve inconsistencies before they become expensive implementation problems.