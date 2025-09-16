# Task: Pre-Task Domain Planning

⚠️ **CRITICAL DOMAIN LAYER PRINCIPLE** ⚠️
The Domain Layer is the CORE of Clean Architecture and MUST remain:

- Independent of ALL other layers
- Free from ANY external dependencies
- Focused ONLY on contracts and types
- Without ANY business logic implementation

Remember: Domain defines WHAT, not HOW!

## 1. Your Deliverable

Your **only** output for this task is a single, complete, and well-formed **JSON object**. This JSON will serve as the input for the `/tasks-domain` command, which will then generate the final YAML plan.

## 2. Objective

Your goal is to transform a high-level, conceptual feature request into a detailed, structured JSON plan. This plan must be ready for the code generation phase and include all necessary details for creating or refactoring domain layer components while strictly adhering to Clean Architecture principles.

## 3. Available Tools

- **External Knowledge:** `context7` MCP Server (for researching domain patterns and DDD concepts).
- **Internal Codebase Analysis:** `Serena` MCP Server (for understanding existing code structure, conventions, and identifying files to be refactored).

## 4. Input Parameters

- **UserInput:** A natural language string describing a feature concept or a modification to an existing feature.

## 5. Step-by-Step Execution Plan

### Step 1: Deconstruct Request & Establish Ubiquitous Language

**Identify Core Domain Concepts:**

- Extract the core concepts and entities from the `UserInput`
- Determine if the request is for a **new feature** or a **modification**
- **Establish Ubiquitous Language:**
  - List all domain terms that will be used
  - Ensure consistent naming across the entire feature
  - Map business terms to technical terms
  - Document any domain-specific terminology

**Ubiquitous Language Checklist:**

- [ ] All entity names match business vocabulary
- [ ] Use case names reflect business operations
- [ ] Error names describe business rule violations
- [ ] No technical jargon in domain terminology
- [ ] Consistent plural/singular usage
- [ ] No abbreviations unless part of business language

### Step 2: External Research - Domain Layer Specific (The "What")

**a. Use `context7` to search for DOMAIN-SPECIFIC patterns:**

- Domain-Driven Design (DDD) patterns for the feature
- Type-Driven Development approaches
- Contract-First Design principles
- Domain Error patterns (Result Pattern vs Exceptions)
- Specification Pattern when applicable
- Pure Functions and Immutability concepts
- Ubiquitous Language examples for similar domains

**b. AVOID searching for:**

- Implementation details
- Framework-specific solutions (React, Express, etc.)
- Database patterns (belongs to Data Layer)
- API design (belongs to Presentation Layer)
- Infrastructure concerns (caching, messaging, etc.)

**c. Focus queries on:**

- "DDD [feature]"
- "domain modeling [concept]"
- "type design [entity]"
- "ubiquitous language [business domain]"
- "domain errors [feature]"

**d. From results, identify:**

- Common domain patterns
- Standard error scenarios
- Type structures
- Business invariants

### Step 3: Internal Analysis - Domain Constraints (The "How")

**a. Use `Serena` to analyze the existing project's `domain` layer:**

**b. Validate Domain Purity:**

- Ensure NO imports from: axios, fetch, prisma, express, react, next, redis, keycloak
- Verify only TypeScript native types are used
- Check that use cases are INTERFACES only (no implementations)
- Confirm no console.log or any I/O operations

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

✅ **ALLOWED in Domain:**

- Simple type definitions (Input/Output types)
- Use case interfaces (contracts only)
- Domain-specific error classes
- Test mock functions
- Type aliases for primitives
- Enums for domain constants

❌ **FORBIDDEN in Domain:**

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

**a. Combine external knowledge with internal context**

**b. Construct a single JSON object with:**

- `featureName` (in PascalCase, following Ubiquitous Language)
- `steps` array

**c. For each required action, create a step object:**

**d. CRITICAL: For each step, decide the correct `type`:**

- Use `type: 'create_file'` for new files (use cases, errors, mocks)
- Use `type: 'refactor_file'` for modifying existing files

**e. For each step, populate the `references` array:**

- Add `external_pattern` objects with `source`, `query`, `url`, `description`
- Add `internal_code_analysis` objects with `source`, `tool`, `query`, `description`

**f. For `create_file` steps:**

- Provide full `template` content
- Include populated `input`, `output`, and `mock` data fields
- Ensure templates contain ONLY interfaces and types

**g. For each use case, ensure:**

- ONE responsibility only (never multiple operations)
- Returns domain types or primitives only
- No implementation details in template
- Mock data is realistic but simple
- Follows verb naming convention

**h. Domain Layer Checklist:**

- [ ] No external dependencies in imports
- [ ] All use cases are interfaces only
- [ ] Errors extend native Error
- [ ] Types follow Input/Output pattern
- [ ] No business logic in templates
- [ ] Ubiquitous Language is consistent
- [ ] Use case names are verbs
- [ ] Single responsibility per use case

**i. Ubiquitous Language Validation:**

- [ ] All terms match established vocabulary
- [ ] No synonyms for the same concept
- [ ] Consistent with existing domain terms
- [ ] Business-friendly naming

## 6. Examples of Correct Domain Patterns

### ✅ CORRECT Use Case (Interface Only):

```typescript
export interface CreateUser {
  execute(input: CreateUserInput): Promise<CreateUserOutput>;
}

export type CreateUserInput = {
  email: string;
  name: string;
  password: string;
};

export type CreateUserOutput = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};
```

### ✅ CORRECT Error:

```typescript
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with id ${userId} not found`);
    this.name = "UserNotFoundError";
  }
}
```

### ✅ CORRECT Mock:

```typescript
export const mockCreateUser = (): CreateUser => ({
  execute: jest.fn().mockResolvedValue({
    id: "user-123",
    email: "john@example.com",
    name: "John Doe",
    createdAt: new Date("2024-01-01"),
  }),
});
```

### ❌ INCORRECT (Has Implementation):

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

### ❌ INCORRECT (External Dependency):

```typescript
import { PrismaClient } from "@prisma/client"; // NO! External library
import axios from "axios"; // NO! External library

export interface SaveUser {
  execute(user: User): Promise<void>;
}
```

### ❌ INCORRECT (Business Logic in Domain):

```typescript
export type CalculatePriceInput = {
  basePrice: number;
  discount: number;
};

// NO! Calculation logic doesn't belong in Domain types
export const calculatePrice = (input: CalculatePriceInput): number => {
  return input.basePrice * (1 - input.discount / 100);
};
```

## 7. Ubiquitous Language Guidelines

### Establishing Terms:

1. **Extract business vocabulary** from requirements
2. **Map to technical terms** consistently
3. **Document any translations** needed

### Example Mapping:

```json
{
  "ubiquitousLanguage": {
    "UserProfile": "The complete user information record",
    "Registration": "The process of creating a new user account",
    "Authentication": "The process of verifying user credentials",
    "ProfileUpdate": "Modification of existing user information",
    "AccountSuspension": "Temporary blocking of user access"
  }
}
```

### Naming Consistency Rules:

- **Entities**: Singular, PascalCase (User, Product, Order)
- **Use Cases**: Verb + Entity (CreateUser, UpdateProduct, CancelOrder)
- **Errors**: Entity + Error Type (UserNotFoundError, InvalidProductError)
- **Types**: Entity + Input/Output (CreateUserInput, GetOrderOutput)

## 8. JSON Output Structure

Your final JSON must follow this structure:

```json
{
  "featureName": "UserRegistration",
  "ubiquitousLanguage": {
    "term1": "definition1",
    "term2": "definition2"
  },
  "steps": [
    {
      "type": "create_file",
      "path": "src/features/user-registration/domain/use-cases/register-user.ts",
      "template": "// Interface-only template",
      "references": [
        {
          "type": "external_pattern",
          "source": "context7",
          "query": "DDD user registration",
          "url": "https://...",
          "description": "Domain pattern for user registration"
        },
        {
          "type": "internal_code_analysis",
          "source": "serena",
          "tool": "find_symbol",
          "query": "existing use case pattern",
          "description": "Following existing conventions"
        }
      ]
    }
  ]
}
```

## 9. Final Validation Checklist

Before outputting the JSON, verify:

### Domain Purity:

- [ ] Zero external dependencies
- [ ] No implementation code
- [ ] Only types and interfaces
- [ ] No I/O operations

### Clean Architecture:

- [ ] Domain is independent
- [ ] No layer violations
- [ ] Contracts only, no logic
- [ ] Pure TypeScript types

### Ubiquitous Language:

- [ ] Consistent terminology
- [ ] Business-aligned naming
- [ ] No technical jargon in domain
- [ ] Documented vocabulary

### Naming Conventions:

- [ ] Use cases are verbs
- [ ] Types follow Input/Output
- [ ] Errors extend Error class
- [ ] PascalCase for types/interfaces

### SOLID Principles:

- [ ] Single Responsibility (one operation per use case)
- [ ] Interface Segregation (focused interfaces)
- [ ] Dependency Inversion (depend on abstractions)

## 10. Common Mistakes to Avoid

1. **Mixing Layers**: Never include Data or Presentation concerns
2. **Fat Interfaces**: Keep use cases focused on ONE operation
3. **Implementation Leak**: No logic, only contracts
4. **External Dependencies**: Domain must be pure TypeScript
5. **Inconsistent Language**: Always use established domain terms
6. **Technical Names**: Use business vocabulary, not technical
7. **Multiple Responsibilities**: One use case = one business operation
8. **Validation in Domain**: Validation belongs in Presentation layer

---

**Remember**: The Domain Layer is the heart of your application. It should be so pure that it could be lifted and placed in any other application using different frameworks, databases, or UI technologies without any modifications.
