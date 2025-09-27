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
    pattern: "spec/[FEATURE_NUMBER]-[FEATURE_NAME]/[LAYER]/plan.json"
    example: "spec/001-user-registration/[LAYER]/plan.json"
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
      purpose: "Analyze existing code structure and conventions"
next_command: "/02-validate-layer-plan --layer=[LAYER] from json: <your-generated-json>"
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
- Save at: `spec/[FEATURE_NUMBER]-[FEATURE_NAME]/[LAYER]/plan.json`
- Example: `spec/001-user-registration/[LAYER]/plan.json`
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

### Step 2: External Research - Layer Specific

**Use `context7` to search for layer-specific patterns:**

#### Selected Layer Searches:
- `"DDD [feature]"`
- `"domain modeling [concept]"`
- `"type design [entity]"`
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
import { Repository } from '../[LAYER]/repositories'; // ✅ Implement domain interface
// FORBIDDEN:
import { Controller } from 'express'; // ❌ Presentation layer
```

#### Infrastructure Layer Validation:
```typescript
// ALLOWED:
import axios from 'axios'; // ✅ External service client
// FORBIDDEN:
import { User } from '../[LAYER]/entities'; // ❌ Domain logic
```

#### Presentation Layer Validation:
```typescript
// ALLOWED:
import { Request, Response } from 'express'; // ✅ HTTP handling
// REQUIRED:
import { UseCase } from '../[LAYER]/use-cases'; // ✅ Call domain use cases
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

## 6. JSON Output Structure

Your final JSON must follow this structure:

### Generic Structure for All Layers:

```json
{
  "layer": "[domain|data|infra|presentation|main]",
  "featureName": "FeatureName",
  "layerContext": {
    // Layer-specific context
  },
  "steps": [
    {
      "id": "step-identifier",
      "type": "[create_file|refactor_file]",
      "description": "Step description",
      "path": "src/[layer]/path/to/file.ts",
      "template": "// Code template with placeholders",
      "references": []
    }
  ]
}
```

### Layer-Specific Examples:

#### Selected Layer Example:
```json
{
  "layer": "layer",
  "featureName": "UserRegistration",
  "layerContext": {
    "ubiquitousLanguage": {
      "Registration": "The process of creating a new user account",
      "User": "An authenticated system participant"
    }
  },
  "steps": [
    {
      "id": "create-register-user-use-case",
      "type": "create_file",
      "path": "src/[LAYER]/use-cases/register-user.ts",
      "template": "export interface RegisterUser {\n  execute(input: RegisterUserInput): Promise<RegisterUserOutput>;\n}"
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
      "path": "src/data/repositories/user-repository.ts",
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
      "path": "src/infra/services/email-service.ts",
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
      "path": "src/presentation/controllers/user-controller.ts",
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
      "path": "src/main/container.ts",
      "template": "export const container = new Container();\n// Bindings"
    }
  ]
}
```

## 7. Final Validation Checklist

### Per Layer Validation:

#### Domain ✅
- [ ] Zero external dependencies
- [ ] No implementation code
- [ ] Only types and interfaces
- [ ] Ubiquitous Language documented

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

## 8. Common Mistakes to Avoid

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

## 📍 Next Step

After generating your JSON plan, your next command should be:

```bash
/02-validate-layer-plan --layer=[your-layer] from json: <your-generated-json>
```

This will validate your JSON plan for layer-specific compliance and architectural correctness.