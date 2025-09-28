---
title: "Create or Update Project Constitution"
description: "Establish Clean Architecture principles and governance for the project"
category: "governance"
stage: "foundation"
priority: 1
tags:
  - constitution
  - clean-architecture
  - governance
  - principles
parameters:
  project_name:
    type: "string"
    description: "Name of the project"
    required: false
  principles:
    type: "array"
    description: "Additional principles to include"
    required: false
next_command: "/specify [feature-description]"
---

# Task: Create or Update Project Constitution

You are creating or updating the project constitution for a **Spec-Kit Clean Architecture** project. This constitution combines **spec-driven development principles** with **Clean Architecture enforcement**.

## 🏛️ Clean Architecture Foundation

The constitution must establish these non-negotiable architectural principles:

### I. Dependency Rule (SACRED)
- **Dependencies point inward only**: Presentation → Domain ← Data
- **Domain layer has ZERO external dependencies**
- **Interfaces defined in domain, implemented in outer layers**
- **Violation = RLHF score -2 (CATASTROPHIC)**

### II. Layer Responsibilities

#### 🎯 Domain Layer (Pure Business Logic)
- Entities, value objects, use cases
- Business rules and domain events
- Error definitions and types
- **NO external dependencies**

#### 💾 Data Layer (Repository Implementations)
- Repository pattern implementations
- Data source abstractions
- DTOs and mappers
- Transaction management

#### 🔌 Infrastructure Layer (External World)
- Database implementations
- External service integrations
- File system operations
- Message queues and events

#### 🌐 Presentation Layer (User Interface)
- Controllers and routes
- Input validation and sanitization
- Response formatting
- Authentication/authorization

#### 🚀 Main Layer (Composition Root)
- Dependency injection setup
- Application bootstrap
- Server configuration
- Environment management

### III. Development Standards

#### Spec-Driven Development
- **Specifications before implementation**
- User stories drive domain design
- Clear acceptance criteria
- Iterative refinement through /clarify

#### Test-Driven Development (TDD)
- **RED → GREEN → REFACTOR cycle**
- Domain layer: 100% test coverage target
- Integration tests for each layer
- E2E tests for critical user journeys

#### Quality Gates
- **RLHF scoring system enforcement**
  - +2: EXCELLENT (Clean Architecture + best practices)
  - +1: GOOD (Valid implementation)
  - 0: LOW CONFIDENCE (Uncertain quality)
  - -1: RUNTIME ERROR (Failures)
  - -2: CATASTROPHIC (Architecture violations)

#### Git Workflow
- **Atomic commits** with conventional commit format
- **Feature branches** from main
- **Clean Architecture compliance** validated before merge
- **No direct commits to main**

### IV. Template Integration

#### .regent Template System
- **15 layer-specific templates** (5 layers × 3 targets)
- **AI-NOTEs** guide generation decisions
- **Pattern validation** through JSON schemas
- **Automatic RLHF scoring**

#### Workflow Commands
1. `/constitution` - Establish principles (this command)
2. `/specify` - Create feature specifications
3. `/clarify` - Resolve ambiguities
4. `/plan` - Map features to layers
5. `/tasks` - Generate layer-specific tasks
6. `/analyze` - Validate consistency
7. `/implement` - Execute with templates

### V. Feature Slice Architecture

#### Always Greenfield Approach
- **Each use case is self-contained**
- **Legacy code becomes clean features**
- **Vertical slices through all layers**
- **Independent deployability**

#### Structure Pattern
```
features/[domain]/
├── [use-case]/
│   ├── domain/
│   ├── data/
│   ├── infra/
│   ├── presentation/
│   └── main/
└── shared/
```

## 📋 User Input Processing

User input: $ARGUMENTS

## 🔄 Constitution Creation Process

1. **Load existing constitution** at `.specify/memory/constitution.md`
2. **Identify project-specific values**:
   - Project name
   - Domain concepts
   - Technology stack
   - Team principles
3. **Merge with Clean Architecture principles**
4. **Create comprehensive constitution**
5. **Update dependent templates**

## 📝 Constitution Template Structure

Create a constitution.md with these sections:

```markdown
# [PROJECT_NAME] Constitution

## Project Identity
- **Name**: [PROJECT_NAME]
- **Domain**: [BUSINESS_DOMAIN]
- **Architecture**: Clean Architecture + Spec-Driven Development
- **Version**: 1.0.0
- **Ratified**: [DATE]

## I. Clean Architecture Principles
[Include all architectural rules above]

## II. Development Standards
[Include TDD, Git workflow, quality gates]

## III. Project-Specific Principles
[Add domain-specific rules]

## IV. Governance
- Constitution amendments require team consensus
- Architectural violations block merges
- RLHF scoring guides all implementations
- Regular architecture compliance reviews

## V. Technology Stack
[Define approved technologies per layer]

## VI. Team Agreements
[Add team-specific conventions]
```

## 🎯 Output Requirements

1. **Create/update** `.specify/memory/constitution.md`
2. **Ensure no placeholder tokens** remain (except intentionally deferred)
3. **Version appropriately** (semantic versioning)
4. **Update dependent templates** if needed
5. **Provide sync impact report**

## ✅ Success Criteria

- Constitution establishes Clean Architecture as non-negotiable
- All layers have clear responsibilities
- Development workflow is spec-driven
- Quality gates prevent architectural violations
- Team understands and commits to principles

After completion, the next step is: `/specify [feature-description]` to create your first feature specification.