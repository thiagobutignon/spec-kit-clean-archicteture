# Task: Pre-Task Domain Planning

⚠️ **CRITICAL DOMAIN LAYER PRINCIPLE** ⚠️
The Domain Layer is the CORE of Clean Architecture and MUST remain:

- Independent of ALL other layers
- Free from ANY external dependencies
- Focused ONLY on contracts and types
- Without ANY business logic implementation

Remember: Domain defines WHAT, not HOW!

## 🤖 INTELLIGENT RLHF SCORING SYSTEM

The system uses automated scoring to ensure quality:

### Score Levels:
- **-2 (CATASTROPHIC)**: Architecture violations, wrong REPLACE/WITH format
- **-1 (RUNTIME ERROR)**: Lint failures, test failures, git operations
- **0 (LOW CONFIDENCE)**: System uncertain, prevents hallucinations
- **+1 (GOOD)**: Complete but missing DDD elements
- **+2 (PERFECT)**: Exceptional with Clean Architecture + DDD

### 🏆 How to Achieve +2 Score:
1. **Define Ubiquitous Language** explicitly
2. **Use Domain-Driven Design** principles
3. **Apply Clean Architecture** concepts
4. **Reference patterns**: Aggregate Root, Value Objects, Domain Events
5. **Perfect naming**: Use business vocabulary consistently
6. **Document domain concepts** with @domainConcept tags

## 1. Your Deliverable

Your **only** output for this task is a single, complete, and well-formed **JSON object**. This JSON will serve as the input for the `/03-generate-domain-code` command, which will then generate the final YAML plan.

**OUTPUT LOCATION**:
- If you need to save this JSON for reference, save it at: `spec/[FEATURE_NUMBER]-[FEATURE_NAME]/domain/plan.json`
- Example: `spec/001-user-registration/domain/plan.json`
- The feature number should be sequential (001, 002, 003, etc.)

## 2. Objective

Your goal is to transform a high-level, conceptual feature request into a detailed, structured JSON plan. This plan must be ready for the code generation phase and include all necessary details for creating or refactoring domain layer components while strictly adhering to Clean Architecture principles.

## 3. Available Tools

- **External Knowledge:** `context7` MCP Server (for researching domain patterns and DDD concepts).
- **Internal Codebase Analysis:** `Serena` MCP Server (for understanding existing code structure, conventions, and identifying files to be refactored).

## 4. Input Parameters

- **UserInput:** A natural language string describing a feature concept or a modification to an existing feature.

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

Your final JSON must follow this structure with COMPLETE examples:

### Example 1: Creating New Files (with Placeholders)

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
    },
    {
      "id": "create-register-user-test-helper",
      "type": "create_file",
      "description": "Create test helper for RegisterUser use case",
      "path": "src/features/user-registration/domain/use-cases/__test-helpers__/register-user.ts",
      "template": "export const mockRegisterUser = (): RegisterUser => ({\n  execute: jest.fn().mockResolvedValue({\n    __MOCK_OUTPUT_DATA__\n  })\n});",
      "mockInput": {
        "email": "john@example.com",
        "password": "securePassword123",
        "name": "John Doe"
      },
      "mockOutput": {
        "id": "user-123",
        "email": "john@example.com",
        "name": "John Doe",
        "createdAt": "new Date('2024-01-01')"
      },
      "references": []
    },
    {
      "id": "create-user-already-exists-error",
      "type": "create_file",
      "description": "Create UserAlreadyExists domain error",
      "path": "src/features/user-registration/domain/errors/user-already-exists.ts",
      "template": "export class UserAlreadyExistsError extends Error {\n  constructor(email: string) {\n    super(`User with email ${email} already exists`);\n    this.name = 'UserAlreadyExistsError';\n  }\n}",
      "references": []
    }
  ]
}
```

### Example 2: Refactoring Existing Files

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
      "references": [
        {
          "type": "internal_code_analysis",
          "source": "serena",
          "tool": "find_symbol",
          "query": "UpdateUserInput",
          "description": "Located UpdateUserInput type for modification"
        }
      ]
    },
    {
      "id": "refactor-update-user-output",
      "type": "refactor_file",
      "description": "Add nickname to UpdateUserOutput type",
      "path": "src/features/user-profile/domain/use-cases/update-user.ts",
      "template": "<<<REPLACE>>>\nexport type UpdateUserOutput = {\n  id: string;\n  firstName: string;\n  lastName: string;\n  updatedAt: Date;\n};\n<<</REPLACE>>>\n<<<WITH>>>\nexport type UpdateUserOutput = {\n  id: string;\n  firstName: string;\n  lastName: string;\n  nickname?: string;\n  updatedAt: Date;\n};\n<<</WITH>>>",
      "references": []
    },
    {
      "id": "create-nickname-too-long-error",
      "type": "create_file",
      "description": "Create NicknameTooLong domain error",
      "path": "src/features/user-profile/domain/errors/nickname-too-long.ts",
      "template": "export class NicknameTooLongError extends Error {\n  constructor(maxLength: number) {\n    super(`Nickname must not exceed ${maxLength} characters`);\n    this.name = 'NicknameTooLongError';\n  }\n}",
      "references": [
        {
          "type": "external_pattern",
          "source": "context7",
          "query": "domain validation errors DDD",
          "url": "https://example.com/validation-patterns",
          "description": "Standard practice for domain validation errors"
        }
      ]
    }
  ]
}
```

### Example 3: Complex Refactoring with Multiple Changes

```json
{
  "featureName": "OrderManagement",
  "ubiquitousLanguage": {
    "OrderCancellation": "The process of voiding an existing order",
    "RefundPolicy": "Rules governing money return after cancellation"
  },
  "steps": [
    {
      "id": "refactor-cancel-order-interface",
      "type": "refactor_file",
      "description": "Add refund reason to CancelOrder use case",
      "path": "src/features/order-management/domain/use-cases/cancel-order.ts",
      "template": "<<<REPLACE>>>\nexport interface CancelOrder {\n  execute(input: CancelOrderInput): Promise<CancelOrderOutput>;\n}\n\nexport type CancelOrderInput = {\n  orderId: string;\n  userId: string;\n};\n<<</REPLACE>>>\n<<<WITH>>>\nexport interface CancelOrder {\n  execute(input: CancelOrderInput): Promise<CancelOrderOutput>;\n}\n\nexport type CancelOrderInput = {\n  orderId: string;\n  userId: string;\n  reason: CancellationReason;\n  refundRequested: boolean;\n};\n\nexport enum CancellationReason {\n  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',\n  OUT_OF_STOCK = 'OUT_OF_STOCK',\n  PRICING_ERROR = 'PRICING_ERROR',\n  FRAUDULENT = 'FRAUDULENT',\n  OTHER = 'OTHER'\n}\n<<</WITH>>>",
      "references": [
        {
          "type": "internal_code_analysis",
          "source": "serena",
          "tool": "find_symbol",
          "query": "CancelOrderInput",
          "description": "Located CancelOrderInput for enhancement"
        },
        {
          "type": "external_pattern",
          "source": "context7",
          "query": "order cancellation reasons e-commerce",
          "url": "https://example.com/order-patterns",
          "description": "Common cancellation reason patterns"
        }
      ]
    }
  ]
}
```

### Critical Template Rules:

#### For `create_file` steps:
1. **Use PLACEHOLDERS in templates** - The template should contain placeholders that will be replaced by the next phase:
   - `__USE_CASE_INPUT_FIELDS__` - Will be replaced with actual input fields
   - `__USE_CASE_OUTPUT_FIELDS__` - Will be replaced with actual output fields
   - `__MOCK_INPUT_DATA__` - Will be replaced with mock input values
   - `__MOCK_OUTPUT_DATA__` - Will be replaced with mock output values
2. **Provide field definitions separately** - Use `input`, `output`, `mockInput`, and `mockOutput` arrays/objects
3. **Exception: Error classes** - Error classes don't use placeholders, provide complete template

#### For `refactor_file` steps:
1. **Template must use `<<<REPLACE>>>` and `<<<WITH>>>` blocks**
2. **The `<<<REPLACE>>>` block must match the existing code EXACTLY (including whitespace)**
3. **The `<<<WITH>>>` block contains the new code to replace it**
4. **Multiple refactors to the same file should be separate steps**

### Important Notes for +2 Score:

- **ubiquitousLanguage field is RECOMMENDED** - Include it for +2 RLHF score
- **Placeholders are REQUIRED** for use cases and test helpers to maintain pipeline compatibility
- **The 02-validate-domain-plan phase will check for these placeholders**
- **The 03-generate-domain-code phase will replace placeholders with actual values**
- **Add @domainConcept tags** in templates for higher scores
- **Use business vocabulary** consistently for perfect execution
- **Document patterns used** (@pattern tags) for Clean Architecture bonus

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

## 10. Common Mistakes to Avoid (That Lead to Low Scores)

### Mistakes that cause -2 (CATASTROPHIC):
1. **Wrong REPLACE/WITH format**: Missing or incorrect template blocks
2. **Architecture violations**: Importing from other layers
3. **External dependencies**: Using libraries in domain

### Mistakes that cause -1 (RUNTIME ERROR):
4. **Invalid TypeScript**: Syntax errors in templates
5. **Missing required fields**: Incomplete type definitions
6. **Incorrect naming**: Not following conventions

### Mistakes that cause 0 (LOW CONFIDENCE):
7. **Unclear domain concepts**: Vague or ambiguous terms
8. **Missing references**: No context7 or serena analysis

### Mistakes that prevent +2 (PERFECT):
9. **No ubiquitous language**: Missing domain vocabulary
10. **No @domainConcept tags**: Undocumented business concepts
11. **Technical jargon**: Using tech terms instead of business
12. **Missing patterns**: Not referencing DDD/Clean Architecture

---

## 🏆 Pro Tips for +2 Score:

1. **Always define ubiquitousLanguage** with clear business definitions
2. **Use @domainConcept tags** in all templates
3. **Reference DDD patterns** explicitly (@pattern tags)
4. **Maintain Clean Architecture** principles strictly
5. **Document business rules** in comments using domain language
6. **Ensure perfect naming** following business vocabulary

**Remember**: The Domain Layer is the heart of your application. With proper ubiquitous language and Clean Architecture, you can achieve a perfect +2 RLHF score!

## 📍 Next Step

After generating your JSON plan, your next command should be:

```bash
/02-validate-domain-plan from json: <your-generated-json>
```

This will validate your JSON plan for completeness and architectural compliance, providing an RLHF score prediction.
