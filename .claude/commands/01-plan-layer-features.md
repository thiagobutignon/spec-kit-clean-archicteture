---
title: "Pre-Task Layer Planning"
description: "Transform high-level feature requests into detailed JSON plans for any Clean Architecture layer (domain, data, infrastructure, presentation, main)"
category: "planning"
stage: "planning"
priority: 1
tags:
  - clean-architecture
  - layer-planning
  - rlhf-scoring
  - json-generation
parameters:
  layer:
    type: "enum"
    values: ["layer", "data", "infra", "presentation", "main"]
    description: "Target Clean Architecture layer"
    required: true
  input:
    type: "string"
    description: "Natural language feature request or modification"
    required: true
  output_format:
    type: "json"
    description: "Structured JSON plan for layer generation"
    required: true
  output_location:
    type: "path"
    pattern: "./spec/__FEATURE_NUMBER__-__FEATURE_NAME__/__LAYER__/plan.json"
    example: "./spec/001-user-registration/__LAYER__/plan.json"
scoring:
  levels:
    catastrophic: -2
    runtime_error: -1
    low_confidence: 0
    good: 1
    perfect: 2
  perfect_requirements:
    domain_layer:
      - "Define Ubiquitous Language explicitly"
      - "Use Layer-Specific Design principles"
      - "Apply Clean Architecture concepts"
      - "Reference patterns (Aggregate Root, Value Objects, Layer Events)"
      - "Perfect naming using business vocabulary"
      - "Document layer concepts with @layerConcept tags"
    data:
      - "Clean repository pattern implementation"
      - "Proper dependency injection"
      - "Database-agnostic interfaces"
      - "Transaction handling patterns"
      - "Caching strategy documented"
    infra:
      - "External service integrations properly abstracted"
      - "Configuration management patterns"
      - "Error handling and retry logic"
      - "Logging and monitoring setup"
      - "Security best practices"
    presentation:
      - "RESTful API design or GraphQL schema"
      - "Input validation patterns"
      - "Response formatting standards"
      - "Authentication/authorization middleware"
      - "API documentation annotations"
    main:
      - "Dependency injection container setup"
      - "Application bootstrap sequence"
      - "Environment configuration"
      - "Graceful shutdown handling"
      - "Health check endpoints"
tools:
  external:
    - name: "context7"
      purpose: "Research patterns and best practices for the selected layer"
  internal:
    - name: "serena"
      purpose: "Read .regent template sections sequentially using searchPattern with context"
next_command: "/02-validate-layer-plan --layer=__LAYER__ --file=spec/__FEATURE__/__LAYER__/plan.json"
---

# Task: Pre-Task Layer Planning

⚠️ **CRITICAL CLEAN ARCHITECTURE PRINCIPLE** ⚠️
Each layer has specific responsibilities and constraints:

## Layer Responsibilities

### 🎯 Selected Layer
- **Independent** of ALL other layers
- **Free** from ANY external dependencies
- **Focused** ONLY on contracts and types
- **Without** ANY business logic implementation
- Defines WHAT, not HOW

### 🎯 Domain Layer - Functional Approach

**CRITICAL**: This project uses **Functional Clean Architecture**, NOT classic OOP DDD.

#### Core Principles:

1. **Anemic Domain Models** (data structures, no behavior)
   ```typescript
   // ✅ CORRECT - Simple data structure
   export type Product = {
     id: string;
     sku: string;
     price: number;
     isArchived: boolean;
   };
   ```

2. **Factory Functions for Value Objects** (NOT classes)
   ```typescript
   // ✅ CORRECT - Type + factory function with error handling
   export type SKU = { value: string };
   export type ValidationError = { message: string };

   // Option 1: Throw errors (simpler, but less functional)
   export const createSKU = (value: string): SKU => {
     if (!value?.trim()) throw new Error('SKU cannot be empty');
     return { value: value.trim().toUpperCase() };
   };

   // Option 2: Result type (more functional, better composability)
   export type Result<T, E> = { success: true; value: T } | { success: false; error: E };

   export const createSKUSafe = (value: string): Result<SKU, ValidationError> => {
     if (!value?.trim()) {
       return { success: false, error: { message: 'SKU cannot be empty' } };
     }
     return { success: true, value: { value: value.trim().toUpperCase() } };
   };

   // ❌ WRONG - Don't use classes
   export class SKU {
     private constructor(private readonly _value: string) {}
     static create(value: string): SKU { /* ... */ }
   }
   ```

3. **Use Case Interfaces in Domain, Logic in Data Layer**
   ```typescript
   // domain/usecases/archive-product.ts (interface only - WHAT)
   export type ArchiveProductInput = { productId: string };
   export type ArchiveProductOutput = { product: Product };

   export interface ArchiveProduct {
     execute(input: ArchiveProductInput): Promise<ArchiveProductOutput>;
   }

   // data/usecases/db-archive-product.ts (implementation with logic - HOW)
   export class DbArchiveProduct implements ArchiveProduct {
     async execute(input: ArchiveProductInput): Promise<ArchiveProductOutput> {
       const product = await this.repository.findById(input.productId);

       // ✅ Business logic HERE (data layer), NOT in Product entity
       if (product.isArchived) {
         throw new ProductAlreadyArchivedError(product.id);
       }

       // ✅ Immutability: Always create new objects, never mutate
       const archivedProduct: Product = {
         ...product,
         isArchived: true
       };

       await this.repository.update(archivedProduct);

       return { product: archivedProduct };
     }
   }
   ```

4. **Repository Interfaces (Port Pattern)**
   ```typescript
   // domain/repositories/product-repository.ts
   export interface ProductRepository {
     findById(id: string): Promise<Product | null>;
     save(product: Product): Promise<void>;
     update(product: Product): Promise<void>;

     // ❌ DON'T: archive(productId: string)
     // Why: Business logic (knowing HOW to archive) belongs in use cases
     // Repositories should only handle data persistence operations (CRUD)
   }
   ```

#### Why This Approach?

- **Simpler**: Less boilerplate than OOP
- **TypeScript Idiomatic**: Leverages structural typing
- **Testable**: Pure functions are easier to test
- **Maintainable**: Less abstraction, more clarity
- **80/20 Rule**: Most projects don't need rich domain models

#### Research Queries (Domain Layer)

When researching domain patterns, prefer functional approaches but keep valuable DDD concepts:
- ✅ `"functional domain design TypeScript"`
- ✅ `"anemic domain model patterns"`
- ✅ `"type-driven architecture"`
- ✅ `"clean architecture interfaces TypeScript"`
- ✅ `"functional domain modeling [concept]"`
- ✅ `"DDD without classes [feature]"`
- ✅ `"bounded contexts"`, `"ubiquitous language"`, `"domain events"` (these are valid in functional approach)
- ❌ **AVOID**: `"DDD rich entities"`, `"aggregate root class"`, `"entity encapsulation"`

---

### When to Use Classic DDD Instead

Consider classic rich domain models ONLY if:
- Domain is extremely complex (insurance, finance, legal)
- Many interdependent invariants
- Team is experienced in OOP DDD
- Compile-time guarantees are critical

For most CRUD/SaaS/E-commerce apps: **Use our Functional approach** ✅

### 💾 Data Layer
- Implements repository interfaces from selected layer
- Handles data persistence and retrieval
- Manages transactions and database connections
- Implements caching strategies
- NO business logic, only data operations

### 🔌 Infrastructure Layer
- External service integrations (email, SMS, payment)
- File system operations
- Message queues and event buses
- Third-party API clients
- Configuration and secrets management

### 🌐 Presentation Layer
- HTTP/GraphQL endpoints
- Input validation and sanitization
- Response formatting
- Authentication and authorization
- API documentation
- WebSocket handlers

### 🚀 Main Layer
- Application entry point
- Dependency injection setup
- Server configuration
- Middleware registration
- Application lifecycle management

## 🤖 INTELLIGENT RLHF SCORING SYSTEM

The system uses automated scoring to ensure quality:

### Score Levels:
| Score | Level | Description |
|-------|-------|-------------|
| **-2** | CATASTROPHIC | Architecture violations, wrong REPLACE/WITH format |
| **-1** | RUNTIME ERROR | Lint failures, test failures, git operations |
| **0** | LOW CONFIDENCE | System uncertain, prevents hallucinations |
| **+1** | GOOD | Complete but missing layer-specific patterns |
| **+2** | PERFECT | Exceptional with Clean Architecture + layer patterns |

### 🏆 How to Achieve +2 Score:
Each layer has specific requirements for perfect score - see `scoring.perfect_requirements` above.

## 1. Your Deliverable

Your **only** output for this task is a single, complete, and well-formed **JSON object**. This JSON will serve as the input for the `/03-generate-layer-code` command.

**OUTPUT LOCATION**:
- Save at: `./spec/__FEATURE_NUMBER__-__FEATURE_NAME__/__LAYER__/plan.json`
- Example: `./spec/001-user-registration/__LAYER__/plan.json`
- Feature numbers should be sequential (001, 002, 003, etc.)

## 2. Layer Selection

First, determine which layer you're working with:

```bash
# Examples of layer selection:
--layer=domain      # For types, interfaces, contracts
--layer=data        # For repository implementations
--layer=infra       # For external services
--layer=presentation # For API endpoints
--layer=main        # For application setup
```

## 3. Available Tools

| Tool | Type | Purpose |
|------|------|---------|
| **context7** | External Knowledge | Research patterns for the selected layer |
| **serena** | Internal Analysis | Understand existing code structure and conventions |

## 4. Input Parameters

- **Layer:** One of [domain, data, infra, presentation, main]
- **UserInput:** Natural language string describing the feature

## 5. Layer-Specific Execution Plans

### Step 1: Deconstruct Request & Establish Context

**Identify Core Concepts Based on Layer:**

#### For Selected Layer:
- Extract business entities and concepts
- Establish Ubiquitous Language
- Define contracts and types
- Map business terms to technical terms

#### For Data Layer:
- Identify data models and repositories
- Determine persistence patterns
- Define transaction boundaries
- Plan caching strategies

#### For Infrastructure Layer:
- List external services needed
- Define integration patterns
- Plan error handling strategies
- Document configuration needs

#### For Presentation Layer:
- Define API endpoints or GraphQL schema
- Plan request/response formats
- Document validation rules
- Design authentication flow

#### For Main Layer:
- Plan application bootstrap sequence
- Define dependency injection setup
- Document environment configuration
- Design health check strategy

### Step 1.5: Sequential Template Reading (MANDATORY)

**You must read the template in 4 sequential steps, consolidating information as you go:**

#### Step 1.5.1: Read Header Context
Use serena: searchPattern("# --- From: shared/00-header", "templates/[target]-[layer]-template.regent", {context_lines_after: 15})
**Write down:** Project configuration, architecture style, and base metadata.

#### Step 1.5.2: Read Target Structure
Use serena: searchPattern("# --- From: [target]/01-structure", "templates/[target]-[layer]-template.regent", {context_lines_after: 30})
**Write down:** The `use_case_slice` section with basePath and layer folder definitions.

#### Step 1.5.3: Read Layer Implementation
Use serena: searchPattern("# --- From: [target]/steps/", "templates/[target]-[layer]-template.regent", {context_lines_after: 50})
**Write down:** Layer-specific patterns, file structures, and implementation guidelines.

#### Step 1.5.4: Read Validation Rules
Use serena: searchPattern("# --- From: shared/01-footer", "templates/[target]-[layer]-template.regent", {context_lines_after: 20})
**Write down:** Validation requirements and compliance rules.

#### Step 1.5.5: Consolidate All Information
Before generating JSON, create a summary:
- **Target/Layer:** [extracted from header]
- **Base Path Pattern:** [extracted from structure]
- **Folder Structure:** [extracted from structure]
- **Implementation Patterns:** [extracted from layer steps]
- **Validation Requirements:** [extracted from footer]

**CRITICAL:** Your JSON paths MUST use the exact folder structure from Step 1.5.2.

**Example Target Resolution:**
- If user says "backend domain" → read `templates/backend-domain-template.regent`
- If user says "frontend presentation" → read `templates/frontend-presentation-template.regent`
- If unclear, ask: "Is this for backend, frontend, or fullstack?"

### Step 2: External Research - Layer Specific

**Use `context7` to search for layer-specific patterns:**

#### Selected Layer Searches:
- `"functional domain design TypeScript [feature]"`
- `"anemic domain model patterns [concept]"`
- `"type-driven architecture [entity]"`
- `"clean architecture interfaces TypeScript"`
- `"ubiquitous language [business domain]"`

#### Data Layer Searches:
- `"repository pattern [database]"`
- `"transaction handling [pattern]"`
- `"database migration strategies"`
- `"caching patterns [technology]"`

#### Infrastructure Layer Searches:
- `"[service] integration best practices"`
- `"message queue patterns"`
- `"circuit breaker pattern"`
- `"external API client design"`

#### Presentation Layer Searches:
- `"REST API design [feature]"`
- `"GraphQL schema design"`
- `"API versioning strategies"`
- `"input validation patterns"`

#### Main Layer Searches:
- `"dependency injection [framework]"`
- `"application bootstrap patterns"`
- `"graceful shutdown [language]"`
- `"health check implementation"`

### Step 3: Internal Analysis - Layer Constraints

**Use `serena` to analyze the existing project's layer:**

#### Selected Layer Validation:
```typescript
// FORBIDDEN imports:
import axios from 'axios';        // ❌ External library
import { PrismaClient } from '@prisma/client'; // ❌ Database
```

#### Data Layer Validation:
```typescript
// REQUIRED patterns:
import { Repository } from '../__LAYER__/repositories'; // ✅ Implement domain interface
// FORBIDDEN:
import { Controller } from 'express'; // ❌ Presentation layer
```

#### Infrastructure Layer Validation:
```typescript
// ALLOWED:
import axios from 'axios'; // ✅ External service client
// FORBIDDEN:
import { User } from '../__LAYER__/entities'; // ❌ Domain logic
```

#### Presentation Layer Validation:
```typescript
// ALLOWED:
import { Request, Response } from 'express'; // ✅ HTTP handling
// REQUIRED:
import { UseCase } from '../__LAYER__/use-cases'; // ✅ Call domain use cases
```

#### Main Layer Validation:
```typescript
// REQUIRED:
import { Container } from 'inversify'; // ✅ DI container
import { Server } from './server'; // ✅ Application setup
```

### Step 4: Layer Rules Validation

#### ✅ **ALLOWED per Layer:**

**Domain:**
- Type definitions
- Interfaces
- Error classes
- Enums

**Data:**
- Repository implementations
- Database models
- Query builders
- Transaction management

**Infrastructure:**
- External API clients
- File system operations
- Message queue handlers
- Email/SMS services

**Presentation:**
- Controllers/Resolvers
- Middleware
- Validators
- Response formatters

**Main:**
- Dependency injection
- Server configuration
- Environment setup
- Application lifecycle

#### ❌ **FORBIDDEN per Layer:**

**Domain:**
- ANY implementation
- External dependencies
- I/O operations

**Data:**
- Business logic
- Direct HTTP handling
- External service calls

**Infrastructure:**
- Business rules
- Direct database access
- Domain logic

**Presentation:**
- Business logic
- Direct database access
- Complex computations

**Main:**
- Business logic
- Direct feature implementation
- Complex algorithms

## 6. Edge Case Guidance (Issue #145)

Before generating your JSON plan, consider these edge cases for modular YAML structure:

### Edge Case 1: Single Use Case Feature
**Question**: Should we still generate both shared + use case YAMLs?
**Answer**: YES - Always follow the modular pattern for consistency.

```
spec/001-simple-feature/domain/
├── shared-implementation.yaml          # Shared components
└── single-use-case-implementation.yaml # The one use case
```

**Rationale**: Consistency, future-proof, clear separation, tool compatibility.

### Edge Case 2: No Shared Components
**Question**: Skip shared YAML if empty?
**Answer**: YES - Don't create empty files.

```
spec/002-standalone-feature/domain/
├── use-case-1-implementation.yaml
└── use-case-2-implementation.yaml
```

**Warning**: Most features DO have shared components (entities, VOs, errors, repositories). Only skip if truly nothing is shared.

### Edge Case 3: Modifying Shared After Use Cases
**Question**: How to modify shared components after implementing use cases?
**Answer**: Create `update-shared-implementation.yaml`

```
spec/001-product-catalog/domain/
├── shared-implementation.yaml           # Original (DO NOT EDIT)
├── create-product-implementation.yaml
├── update-product-implementation.yaml
└── update-shared-implementation.yaml    # NEW: Adds field to Product
```

**Rationale**: Maintains history, atomic commits, rollback safety, audit trail.

### Edge Case 4: Use Case Dependencies
**Question**: How to handle use case dependencies?
**Answer**: Add `dependencies` metadata to JSON plan

```json
{
  "useCases": [
    {
      "name": "UpdateProduct",
      "dependencies": [
        "shared-implementation.yaml",
        "create-product-implementation.yaml"
      ]
    }
  ]
}
```

**Rationale**: Explicit execution order, validation safety, self-documenting.

**📖 For detailed edge case documentation, see**: `docs/edge-cases/modular-yaml-edge-cases.md`

---

## 7. JSON Output Structure

**CRITICAL UPDATE (Issue #117)**: The output structure now supports modular YAML generation - one for shared components, one per use case.

### Generic Structure for All Layers:

```json
{
  "featureName": "FeatureName",
  "featureNumber": "001",
  "layer": "[domain|data|infra|presentation|main]",
  "target": "[backend|frontend|fullstack|mobile|api]",
  "layerContext": {
    // Layer-specific context
  },
  "sharedComponents": {
    "models": [
      {
        "name": "ModelName",
        "type": "Entity | AggregateRoot | ValueObject",
        "path": "src/features/__FEATURE_NAME__/domain/models/__model-name__.ts"
      }
    ],
    "valueObjects": [
      {
        "name": "ValueObjectName",
        "path": "src/features/__FEATURE_NAME__/domain/value-objects/__value-object-name__.ts"
      }
    ],
    "repositories": [
      {
        "name": "RepositoryName",
        "path": "src/features/__FEATURE_NAME__/domain/repositories/__repository-name__.interface.ts"
      }
    ],
    "sharedErrors": [
      {
        "name": "ErrorName",
        "path": "src/features/__FEATURE_NAME__/domain/errors/__error-name__.ts"
      }
    ]
  },
  "useCases": [
    {
      "name": "UseCaseName",
      "description": "What this use case does",
      "input": [
        { "name": "fieldName", "type": "string" }
      ],
      "output": [
        { "name": "resultField", "type": "string" }
      ],
      "path": "src/features/__FEATURE_NAME__/__use-case-name__/domain/usecases/__use-case-name__.ts",
      "errors": [
        {
          "name": "UseCaseSpecificError",
          "path": "src/features/__FEATURE_NAME__/__use-case-name__/domain/errors/__error-name__.ts"
        }
      ]
    }
  ]
}
```

### Why This Structure?

The `sharedComponents` and `useCases` separation enables `/03-generate-layer-code` to:
1. Generate `shared-implementation.yaml` for foundation components
2. Generate one YAML per use case for vertical slices
3. Enable parallel execution and atomic commits

### Layer-Specific Examples:

#### Domain Layer Example (NEW - Issue #117):
```json
{
  "featureName": "ProductCatalogManagement",
  "featureNumber": "001",
  "layer": "domain",
  "target": "backend",
  "layerContext": {
    "ubiquitousLanguage": {
      "Product": "An item available for sale in the catalog",
      "SKU": "Stock Keeping Unit - unique identifier for products",
      "Inventory": "Stock levels for each product"
    }
  },
  "sharedComponents": {
    "models": [
      {
        "name": "Product",
        "type": "AggregateRoot",
        "path": "src/features/product-catalog/domain/models/product.ts"
      }
    ],
    "valueObjects": [
      {
        "name": "SKU",
        "path": "src/features/product-catalog/domain/value-objects/sku.ts"
      },
      {
        "name": "Price",
        "path": "src/features/product-catalog/domain/value-objects/price.ts"
      },
      {
        "name": "InventoryLevel",
        "path": "src/features/product-catalog/domain/value-objects/inventory-level.ts"
      }
    ],
    "repositories": [
      {
        "name": "ProductRepository",
        "path": "src/features/product-catalog/domain/repositories/product-repository.interface.ts"
      }
    ],
    "sharedErrors": [
      {
        "name": "ProductNotFoundError",
        "path": "src/features/product-catalog/domain/errors/product-not-found-error.ts"
      },
      {
        "name": "InvalidSKUError",
        "path": "src/features/product-catalog/domain/errors/invalid-sku-error.ts"
      }
    ]
  },
  "useCases": [
    {
      "name": "CreateProduct",
      "description": "Creates a new product in the catalog",
      "input": [
        { "name": "sku", "type": "string" },
        { "name": "name", "type": "string" },
        { "name": "price", "type": "number" }
      ],
      "output": [
        { "name": "id", "type": "string" },
        { "name": "sku", "type": "string" }
      ],
      "path": "src/features/product-catalog/create-product/domain/usecases/create-product.ts",
      "errors": []
    },
    {
      "name": "UpdateProduct",
      "description": "Updates product information",
      "input": [
        { "name": "id", "type": "string" },
        { "name": "price", "type": "number" }
      ],
      "output": [
        { "name": "id", "type": "string" },
        { "name": "updated", "type": "boolean" }
      ],
      "path": "src/features/product-catalog/update-product/domain/usecases/update-product.ts",
      "errors": []
    }
  ]
}
```

#### Data Layer Example:
```json
{
  "layer": "data",
  "featureName": "UserRepository",
  "layerContext": {
    "database": "PostgreSQL",
    "orm": "Prisma",
    "caching": "Redis"
  },
  "steps": [
    {
      "id": "implement-user-repository",
      "type": "create_file",
      "path": "// Use exact path from Step 1.5.2 structure + Step 1.5.3 patterns",
      "template": "export class UserRepositoryImpl implements UserRepository {\n  // Implementation\n}"
    }
  ]
}
```

#### Infrastructure Layer Example:
```json
{
  "layer": "infra",
  "featureName": "EmailService",
  "layerContext": {
    "service": "SendGrid",
    "pattern": "Adapter"
  },
  "steps": [
    {
      "id": "create-email-service",
      "type": "create_file",
      "path": "// Use exact path from Step 1.5.2 structure + Step 1.5.3 patterns",
      "template": "export class SendGridEmailService implements EmailService {\n  // SendGrid implementation\n}"
    }
  ]
}
```

#### Presentation Layer Example:
```json
{
  "layer": "presentation",
  "featureName": "UserController",
  "layerContext": {
    "framework": "Express",
    "pattern": "REST",
    "authentication": "JWT"
  },
  "steps": [
    {
      "id": "create-user-controller",
      "type": "create_file",
      "path": "// Use exact path from Step 1.5.2 structure + Step 1.5.3 patterns",
      "template": "export class UserController {\n  // REST endpoints\n}"
    }
  ]
}
```

#### Main Layer Example:
```json
{
  "layer": "main",
  "featureName": "ApplicationBootstrap",
  "layerContext": {
    "framework": "Express",
    "diContainer": "Inversify"
  },
  "steps": [
    {
      "id": "setup-dependency-injection",
      "type": "create_file",
      "path": "// Use exact path from Step 1.5.2 structure + Step 1.5.3 patterns",
      "template": "export const container = new Container();\n// Bindings"
    }
  ]
}
```

## 8. Final Validation Checklist

### Template Compliance ✅
- [ ] Completed Step 1.5.1: Read and wrote down header context
- [ ] Completed Step 1.5.2: Read and wrote down target structure
- [ ] Completed Step 1.5.3: Read and wrote down layer implementation
- [ ] Completed Step 1.5.4: Read and wrote down validation rules
- [ ] Completed Step 1.5.5: Consolidated all information before JSON generation
- [ ] Generated paths use exact structure from Step 1.5.2

### Per Layer Validation:

#### Domain ✅
- [ ] Zero external dependencies
- [ ] No implementation code
- [ ] Only types and interfaces
- [ ] Ubiquitous Language documented
- [ ] Uses type definitions, NOT classes for entities
- [ ] Value objects use factory functions, NOT class constructors
- [ ] Use case interfaces defined (WHAT), no logic (HOW)
- [ ] Repository interfaces use simple data operations only

#### Data ✅
- [ ] Implements domain interfaces
- [ ] No business logic
- [ ] Proper transaction handling
- [ ] Caching strategy defined

#### Infrastructure ✅
- [ ] External services abstracted
- [ ] Error handling implemented
- [ ] Configuration externalized
- [ ] No domain logic

#### Presentation ✅
- [ ] Input validation complete
- [ ] Uses domain use cases
- [ ] Proper error responses
- [ ] API documentation

#### Main ✅
- [ ] Dependency injection setup
- [ ] Environment configuration
- [ ] Graceful shutdown
- [ ] Health checks

## 9. Common Mistakes to Avoid

| Layer | Common Mistake | Impact |
|-------|---------------|--------|
| Domain | External dependencies | -2 CATASTROPHIC |
| Data | Business logic in repository | -1 RUNTIME ERROR |
| Infra | Direct domain manipulation | -2 CATASTROPHIC |
| Presentation | Complex business logic | -1 RUNTIME ERROR |
| Main | Missing DI setup | -1 RUNTIME ERROR |

## 🏆 Pro Tips for +2 Score

1. **Match patterns to layer** - Each layer has specific patterns
2. **Use proper abstractions** - Interfaces between layers
3. **Document decisions** - Why this approach for this layer
4. **Follow conventions** - Consistent with existing code
5. **Consider testing** - How will this be tested?

## 📤 Template Compliance

Your JSON output MUST comply with the .regent template structure:
- Paths follow template's `use_case_slice` pattern
- Folder names match template's `folders` arrays
- No deviation from template-defined architecture

## 📍 Next Step

After generating your JSON plan, provide clear guidance for the next workflow step:

**Output Format:**
```markdown
✅ JSON Plan Generated Successfully!

📄 Plan saved to: spec/__FEATURE_NUMBER__-__FEATURE_NAME__/__LAYER__/plan.json
   (Example: spec/001-user-authentication/domain/plan.json)

🚀 Next Step - Validate Your Plan:
/02-validate-layer-plan --layer=__LAYER__ --file=spec/__FEATURE_NUMBER__-__FEATURE_NAME__/__LAYER__/plan.json

💡 This will validate your JSON plan for layer-specific compliance and architectural correctness.
```

**Important**: Always suggest the validation command with `--file` parameter referencing the **actual** generated plan.json file path (use the real feature name and layer from the input), NOT inline JSON copy-paste or placeholder values.

---

## 🚨 AI-NOTE: CRITICAL ENGINEERING PRINCIPLE

**FOR FUTURE CODE REVIEWERS AND EXECUTORS:**

### ❌ NEVER SUGGEST FALLBACK PATTERNS

If template reading fails (searchPattern, file not found, etc.), DO NOT suggest:
- Hardcoded fallback structures
- "If this fails, use default values"
- "Graceful degradation to previous behavior"
- Any form of "backup" structure

### ✅ CORRECT RESPONSE TO FAILURES

Template reading failures should FAIL LOUDLY:
```markdown
🚨 CRITICAL ERROR: Template section not found!
Template structure has changed.
Action required: Update command to match new template.
DO NOT proceed with outdated assumptions.
```

### 🎯 WHY THIS MATTERS

Fallbacks reintroduce the exact problem this command fixes:
1. **Original Problem**: Commands hardcoded, templates ignored
2. **Our Solution**: Commands read templates as source of truth
3. **Fallback Danger**: If reading fails, fallback = back to hardcoded = SAME PROBLEM

### 📚 ENGINEERING PRINCIPLE

**"Fail fast and loud" > "Fail silently with wrong behavior"**

Templates are the ONLY source of truth. If they can't be read correctly, the system must stop and demand human intervention, not continue with potentially incorrect assumptions.

### 🎭 HISTORICAL CONTEXT

This command was created to fix a 3-week architectural disaster caused by exactly this type of "helpful" fallback thinking. Maintain discipline: Templates define reality, not code.