---
title: "Pre-Task Layer Planning"
description: "Transform high-level feature requests into detailed JSON plans for domain layer generation following Clean Architecture and DDD principles"
category: "domain"
stage: "planning"
priority: 1
tags:
  - domain-driven-design
  - clean-architecture
  - ubiquitous-language
  - rlhf-scoring
  - json-generation
parameters:
  input:
    type: "string"
    description: "Natural language feature request or modification"
    required: true
  output_format:
    type: "json"
    description: "Structured JSON plan for domain layer generation"
    required: true
  output_location:
    type: "path"
    pattern: "spec/[FEATURE_NUMBER]-[FEATURE_NAME]/domain/plan.json"
    example: "spec/001-user-registration/domain/plan.json"
scoring:
  levels:
    catastrophic: -2
    runtime_error: -1
    low_confidence: 0
    good: 1
    perfect: 2
  perfect_requirements:
    - "Define Ubiquitous Language explicitly"
    - "Use Domain-Driven Design principles"
    - "Apply Clean Architecture concepts"
    - "Reference patterns (Aggregate Root, Value Objects, Domain Events)"
    - "Perfect naming using business vocabulary"
    - "Document domain concepts with @domainConcept tags"
tools:
  external:
    - name: "context7"
      purpose: "Research domain patterns and DDD concepts"
  internal:
    - name: "serena"
      purpose: "Analyze existing code structure and conventions"
next_command: "/02-validate-layer-plan from json: <your-generated-json>"
---

# Task: Pre-Task Domain Planning

⚠️ **CRITICAL DOMAIN LAYER PRINCIPLE** ⚠️
The Domain Layer is the CORE of Clean Architecture and MUST remain:

- **Independent** of ALL other layers
- **Free** from ANY external dependencies
- **Focused** ONLY on contracts and types
- **Without** ANY business logic implementation

> 💡 **Remember**: Domain defines WHAT, not HOW!

## 🤖 INTELLIGENT RLHF SCORING SYSTEM

The system uses automated scoring to ensure quality:

### Score Levels:
| Score | Level | Description |
|-------|-------|-------------|
| **-2** | CATASTROPHIC | Architecture violations, wrong REPLACE/WITH format |
| **-1** | RUNTIME ERROR | Lint failures, test failures, git operations |
| **0** | LOW CONFIDENCE | System uncertain, prevents hallucinations |
| **+1** | GOOD | Complete but missing DDD elements |
| **+2** | PERFECT | Exceptional with Clean Architecture + DDD |

### 🏆 How to Achieve +2 Score:
1. **Define Ubiquitous Language** explicitly
2. **Use Domain-Driven Design** principles
3. **Apply Clean Architecture** concepts
4. **Reference patterns**: Aggregate Root, Value Objects, Domain Events
5. **Perfect naming**: Use business vocabulary consistently
6. **Document domain concepts** with @domainConcept tags

## 1. Your Deliverable

Your **only** output for this task is a single, complete, and well-formed **JSON object**. This JSON will serve as the input for the `/03-generate-layer-code` command, which will then generate the final YAML plan.

**OUTPUT LOCATION**:
- Save at: `spec/[FEATURE_NUMBER]-[FEATURE_NAME]/domain/plan.json`
- Example: `spec/001-user-registration/domain/plan.json`
- Feature numbers should be sequential (001, 002, 003, etc.)

## 2. Objective

Transform a high-level, conceptual feature request into a detailed, structured JSON plan. This plan must be ready for the code generation phase and include all necessary details for creating or refactoring domain layer components while strictly adhering to Clean Architecture principles.

## 3. Available Tools

| Tool | Type | Purpose |
|------|------|---------|
| **context7** | External Knowledge | Research domain patterns and DDD concepts |
| **serena** | Internal Analysis | Understand existing code structure and conventions |

## 4. Input Parameters

- **UserInput:** A natural language string describing a feature concept or modification to an existing feature.

## 5. Step-by-Step Execution Plan

### Step 1: Deconstruct Request & Establish Ubiquitous Language 🏆

**CRITICAL FOR +2 SCORE: Ubiquitous Language is the foundation of DDD**

**Identify Core Domain Concepts:**

- Extract the core concepts and entities from the `UserInput`
- Determine if the request is for a **new feature** or a **modification**
- **Establish Ubiquitous Language:** (ESSENTIAL FOR +2 SCORE)
  - List all domain terms that will be used
  - Ensure consistent naming across the entire feature
  - Map business terms to technical terms
  - Document any domain-specific terminology
  - Define each term with business context
  - Ensure alignment with stakeholder vocabulary

**Ubiquitous Language Checklist for +2 Score:**

- [ ] All entity names match business vocabulary
- [ ] Use case names reflect business operations
- [ ] Error names describe business rule violations
- [ ] No technical jargon in domain terminology
- [ ] Consistent plural/singular usage
- [ ] No abbreviations unless part of business language
- [ ] Each term has a clear business definition
- [ ] Terms are used consistently throughout
- [ ] Language is validated with domain experts

### Step 2: External Research - Domain Layer Specific (The "What")

**a. Use `context7` to search for DOMAIN-SPECIFIC patterns:**

✅ **SEARCH FOR:**
- Domain-Driven Design (DDD) patterns for the feature
- Type-Driven Development approaches
- Contract-First Design principles
- Domain Error patterns (Result Pattern vs Exceptions)
- Specification Pattern when applicable
- Pure Functions and Immutability concepts
- Ubiquitous Language examples for similar domains

❌ **AVOID SEARCHING FOR:**
- Implementation details
- Framework-specific solutions (React, Express, etc.)
- Database patterns (belongs to Data Layer)
- API design (belongs to Presentation Layer)
- Infrastructure concerns (caching, messaging, etc.)

**c. Focus queries on:**
- `"DDD [feature]"`
- `"domain modeling [concept]"`
- `"type design [entity]"`
- `"ubiquitous language [business domain]"`
- `"domain errors [feature]"`

**d. From results, identify:**
- Common domain patterns
- Standard error scenarios
- Type structures
- Business invariants

### Step 3: Internal Analysis - Domain Constraints (The "How")

**a. Use `serena` to analyze the existing project's `domain` layer**

**b. Validate Domain Purity:**
```typescript
// FORBIDDEN imports to check for:
import axios from 'axios';        // ❌ External library
import { PrismaClient } from '@prisma/client'; // ❌ Database
import express from 'express';     // ❌ Framework
console.log('...');               // ❌ I/O operation
```

**c. Naming Convention Checks:**
- Use cases MUST be named with verbs (CreateUser, AuthenticateUser, GetUserProfile)
- Errors MUST extend native Error class
- Types should follow Input/Output pattern
- Maintain consistency with existing Ubiquitous Language

**d. For new features:**
- Use `list_dir` and `get_symbols_overview` to understand patterns
- Identify naming conventions for consistency
- Check existing domain vocabulary for conflicts

**e. For modifications:**
- Use `find_symbol` to locate exact files and symbols to change
- Use `find_referencing_symbols` to identify impact radius
- Verify changes don't introduce external dependencies
- Ensure backward compatibility of contracts
- Validate Ubiquitous Language consistency

### Step 4: Domain Layer Rules Validation

Before synthesizing the JSON, validate against these CRITICAL rules:

#### ✅ **ALLOWED in Domain:**
- Simple type definitions (Input/Output types)
- Use case interfaces (contracts only)
- Domain-specific error classes
- Test mock functions
- Type aliases for primitives
- Enums for domain constants

#### ❌ **FORBIDDEN in Domain:**
- ANY business logic implementation
- Validation logic (goes to Presentation Layer)
- Calculations or computations
- Framework dependencies (React, Express, Next.js)
- External libraries (axios, prisma, redis)
- I/O operations (console.log, file, network)
- Environment variables
- Value Objects with behavior/methods
- Entities with methods
- Static methods or utility functions
- Decorators or metadata

### Step 5: Synthesize the JSON Plan

**Domain Layer Checklist:**
- [ ] No external dependencies in imports
- [ ] All use cases are interfaces only
- [ ] Errors extend native Error
- [ ] Types follow Input/Output pattern
- [ ] No business logic in templates
- [ ] Ubiquitous Language is consistent
- [ ] Use case names are verbs
- [ ] Single responsibility per use case

**Ubiquitous Language Validation:**
- [ ] All terms match established vocabulary
- [ ] No synonyms for the same concept
- [ ] Consistent with existing domain terms
- [ ] Business-friendly naming

## 6. Examples of Correct Domain Patterns

### ✅ CORRECT Use Case for +2 Score (Interface with Domain Concepts):

```typescript
/**
 * CreateUser use case interface
 * @domainConcept User Registration - Core business operation
 * @pattern Command Pattern - Single Responsibility Principle
 * @layer Domain Layer - Framework agnostic business interface
 */
export interface CreateUser {
  /**
   * Execute user creation following business rules
   * @throws UserAlreadyExistsError when email is taken
   * @throws InvalidUserDataError when business rules violated
   */
  execute(input: CreateUserInput): Promise<CreateUserOutput>;
}

/**
 * Input for user creation - represents registration request
 * @domainConcept Registration Request from bounded context
 */
export type CreateUserInput = {
  email: string;      // Business identifier for user
  name: string;       // User's display name in system
  password: string;   // Authentication credential
};

/**
 * Output representing successfully created user
 * @domainConcept User Aggregate in the system
 */
export type CreateUserOutput = {
  id: string;         // System-generated unique identifier
  email: string;      // Confirmed business identifier
  name: string;       // Stored display name
  createdAt: Date;    // Domain event timestamp
};
```

### ✅ CORRECT Error for +2 Score:

```typescript
/**
 * Domain error for user not found scenario
 * @domainConcept User existence validation in bounded context
 * @pattern Domain Error - Clean Architecture principle
 */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    // Business-friendly message using ubiquitous language
    super(`User with identifier ${userId} does not exist in the system`);
    this.name = "UserNotFoundError";
  }
}
```

### ❌ INCORRECT Examples to Avoid:

<details>
<summary>❌ Has Implementation (FORBIDDEN)</summary>

```typescript
export class CreateUser {
  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    // NO! Implementation doesn't belong in Domain
    if (!input.email.includes("@")) {
      throw new Error("Invalid email");
    }
    // Database call - FORBIDDEN in Domain!
    const user = await prisma.user.create({ data: input });
    return user;
  }
}
```
</details>

<details>
<summary>❌ External Dependency (FORBIDDEN)</summary>

```typescript
import { PrismaClient } from "@prisma/client"; // NO! External library
import axios from "axios"; // NO! External library

export interface SaveUser {
  execute(user: User): Promise<void>;
}
```
</details>

## 7. JSON Output Structure

Your final JSON must follow this structure with COMPLETE examples:

### Example 1: Creating New Feature

```json
{
  "featureName": "UserRegistration",
  "ubiquitousLanguage": {
    "Registration": "The process of creating a new user account",
    "WelcomeEmail": "Initial email sent after successful registration"
  },
  "steps": [
    {
      "id": "create-register-user-use-case",
      "type": "create_file",
      "description": "Create RegisterUser use case interface",
      "path": "src/features/user-registration/domain/use-cases/register-user.ts",
      "template": "export interface RegisterUser {\n  execute(input: RegisterUserInput): Promise<RegisterUserOutput>;\n}\n\nexport type RegisterUserInput = {\n  __USE_CASE_INPUT_FIELDS__\n};\n\nexport type RegisterUserOutput = {\n  __USE_CASE_OUTPUT_FIELDS__\n};",
      "input": [
        { "name": "email", "type": "string" },
        { "name": "password", "type": "string" },
        { "name": "name", "type": "string" }
      ],
      "output": [
        { "name": "id", "type": "string" },
        { "name": "email", "type": "string" },
        { "name": "name", "type": "string" },
        { "name": "createdAt", "type": "Date" }
      ],
      "references": [
        {
          "type": "external_pattern",
          "source": "context7",
          "query": "DDD user registration domain patterns",
          "url": "https://example.com/ddd-patterns",
          "description": "Domain pattern for user registration"
        }
      ]
    }
  ]
}
```

### Example 2: Refactoring Existing Feature

```json
{
  "featureName": "UserProfile",
  "ubiquitousLanguage": {
    "Nickname": "Optional display name chosen by the user",
    "ProfileUpdate": "Modification of existing user information"
  },
  "steps": [
    {
      "id": "refactor-update-user-input",
      "type": "refactor_file",
      "description": "Add nickname field to UpdateUserInput type",
      "path": "src/features/user-profile/domain/use-cases/update-user.ts",
      "template": "<<<REPLACE>>>\nexport type UpdateUserInput = {\n  firstName?: string;\n  lastName?: string;\n};\n<<</REPLACE>>>\n<<<WITH>>>\nexport type UpdateUserInput = {\n  firstName?: string;\n  lastName?: string;\n  nickname?: string;\n};\n<<</WITH>>>",
      "references": []
    }
  ]
}
```

### Critical Template Rules:

#### For `create_file` steps:
1. **Use PLACEHOLDERS in templates**:
   - `__USE_CASE_INPUT_FIELDS__` - Will be replaced with actual input fields
   - `__USE_CASE_OUTPUT_FIELDS__` - Will be replaced with actual output fields
   - `__MOCK_INPUT_DATA__` - Will be replaced with mock input values
   - `__MOCK_OUTPUT_DATA__` - Will be replaced with mock output values

2. **Provide field definitions separately** - Use `input`, `output`, `mockInput`, and `mockOutput` arrays/objects

#### For `refactor_file` steps:
1. **Template must use `<<<REPLACE>>>` and `<<<WITH>>>` blocks**
2. **The `<<<REPLACE>>>` block must match the existing code EXACTLY**
3. **The `<<<WITH>>>` block contains the new code**

## 8. Final Validation Checklist

### Domain Purity ✅
- [ ] Zero external dependencies
- [ ] No implementation code
- [ ] Only types and interfaces
- [ ] No I/O operations

### Clean Architecture ✅
- [ ] Domain is independent
- [ ] No layer violations
- [ ] Contracts only, no logic
- [ ] Pure TypeScript types

### Ubiquitous Language ✅
- [ ] Consistent terminology
- [ ] Business-aligned naming
- [ ] No technical jargon in domain
- [ ] Documented vocabulary

### SOLID Principles ✅
- [ ] Single Responsibility (one operation per use case)
- [ ] Interface Segregation (focused interfaces)
- [ ] Dependency Inversion (depend on abstractions)

## 9. Common Mistakes to Avoid

| Score | Type | Examples |
|-------|------|----------|
| **-2** | CATASTROPHIC | Wrong REPLACE/WITH format, Architecture violations, External dependencies |
| **-1** | RUNTIME ERROR | Invalid TypeScript, Missing required fields, Incorrect naming |
| **0** | LOW CONFIDENCE | Unclear domain concepts, Missing references |
| **Prevents +2** | MISSING EXCELLENCE | No ubiquitous language, No @domainConcept tags, Technical jargon, Missing patterns |

## 🏆 Pro Tips for +2 Score

1. **Always define ubiquitousLanguage** with clear business definitions
2. **Use @domainConcept tags** in all templates
3. **Reference DDD patterns** explicitly (@pattern tags)
4. **Maintain Clean Architecture** principles strictly
5. **Document business rules** in comments using domain language
6. **Ensure perfect naming** following business vocabulary

> 💡 **Remember**: The Domain Layer is the heart of your application. With proper ubiquitous language and Clean Architecture, you can achieve a perfect +2 RLHF score!

## 📍 Next Step

After generating your JSON plan, your next command should be:

```bash
/02-validate-layer-plan from json: <your-generated-json>
```

This will validate your JSON plan for completeness and architectural compliance, providing an RLHF score prediction.