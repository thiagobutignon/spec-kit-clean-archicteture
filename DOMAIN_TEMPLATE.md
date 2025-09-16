# Domain Layer Template

## Feature-Based Domain Structure

```
src/
└── features/
    └── [feature-name]/
        └── domain/
            ├── errors/         # Feature-specific errors
            ├── use-cases/      # Feature use case interfaces
            └── test/           # Feature test helpers
```

## Feature Example Structure

### Layer Dependencies Rules

#### ✅ Layers that CAN import from Domain:
- **Data Layer** - Implements the use case interfaces defined in domain
- **Presentation Layer** - Uses domain types and calls use cases
- **Infrastructure Layer** - May use domain types for adapters
- **Main/Factory Layer** - Wires everything together, knows all layers
- **Test Files** - Can import domain types and interfaces for testing

#### ❌ Layers that CANNOT import from Domain:
- **External Libraries** - Should never know about your domain
- **Node Modules** - Third-party code should not depend on domain

#### ❌ Domain CANNOT import from:
- **Any other layer** - Domain must be completely independent
- **Data Layer** - No implementation details
- **Presentation Layer** - No UI concerns
- **Infrastructure Layer** - No external dependencies
- **Main Layer** - No dependency injection logic
- **External Libraries** - No third-party dependencies

### Domain Layer Rules

#### ✅ What CAN be in Domain Layer:
- Simple type definitions (Input/Output types)
- Use case interfaces (contracts only)
- Domain-specific error classes
- Test mock functions

#### ❌ What CANNOT be in Domain Layer:
- Framework dependencies (React, Next.js, Express)
- External libraries (axios, fetch, database clients)
- Implementation details of any kind
- UI components
- HTTP/Database/File system operations
- Environment variables
- Console.log or any I/O operations
- Value objects
- Entities
- Business rules or business logic
- Validation logic
- Calculations or computations
- Any behavior beyond type definitions and interfaces

### Feature Use Cases

**Purpose:** Define the business operations/actions available in the system

#### ✅ Use Cases SHOULD:
- Define only interfaces/contracts, not implementations
- Have EXACTLY ONE responsibility (one business operation)
- Do ONE thing and ONE thing only (never multiple operations)
- Return domain types or primitives
- Be named with verbs (CreateUser, AuthenticateUser, etc.)
- Be framework agnostic

#### ❌ Use Cases SHOULD NOT:
- Contain implementation logic
- Know about HTTP, databases, or external services
- Import from data, presentation, or infrastructure layers
- Have side effects
- Execute multiple operations (e.g., CreateUserAndSendEmail is wrong, split into two use cases)

```typescript
// src/features/[feature-name]/domain/use-cases/[action-entity].ts

/**
 * Input parameters for [ActionEntity]UseCase
 */
export type [ActionEntity]Input = {
  // Define your input parameters here
}

/**
 * Output type for [ActionEntity]UseCase
 */
export type [ActionEntity]Output = {
  // Define your output type here
}

/**
 * [ActionEntity]UseCase interface
 * @description [Describe ONE specific action this use case performs]
 */
export interface [ActionEntity]UseCase {
  /**
   * Execute the [action] operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   */
  execute: (input: [ActionEntity]Input) => Promise<[ActionEntity]Output>
}
```

```bash
echo "🔍 Running lint check..."
yarn lint
if [ $? -ne 0 ]; then
  echo "❌ LINT FAILED - Attempting auto-fix..."
  yarn lint --fix
  if [ $? -ne 0 ]; then
    echo "❌ AUTO-FIX FAILED - Manual intervention required"
    echo "📋 Run 'yarn lint' to see remaining errors"
    exit 1
  fi
  echo "✅ Lint errors auto-fixed, validating again..."
  yarn lint
  if [ $? -ne 0 ]; then
    echo "❌ LINT STILL FAILING - Manual fixes needed"
    exit 1
  fi
fi
echo "✅ Lint passed"

echo "🧪 Running tests with coverage..."
yarn test --coverage
if [ $? -ne 0 ]; then
  echo "❌ TESTS FAILED - Running specific test to identify issue..."
  yarn test --run --reporter=verbose
  echo "❌ Tests must be fixed manually"
  echo "📋 Check the test output above for details"
  exit 1
fi
echo "✅ Tests passed"

echo "📦 Staging changes..."
git add .

echo "💾 Creating commit..."
git commit -m "feat([feature-name]): add [action] use case"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED - Checking git status..."
  git status
  echo "📋 Review the status above and fix any issues"
  exit 1
fi
echo "✅ Successfully committed"
```

### Feature Errors

**Purpose:** Define domain-specific exceptions for business rule violations

#### ✅ Domain Errors SHOULD:
- Extend the native Error class
- Have descriptive names ending with "Error"
- Contain meaningful error messages
- Represent business rule violations
- Be thrown when domain invariants are violated

#### ❌ Domain Errors SHOULD NOT:
- Contain HTTP status codes
- Include technical/implementation details
- Expose sensitive information
- Import external dependencies

```typescript
// src/features/[feature-name]/domain/errors/[error-name].ts

/**
 * Error thrown when [describe when this error occurs]
 * @extends Error
 */
export class [ErrorName]Error extends Error {
  constructor() {
    super('[Error message]')
    this.name = '[ErrorName]Error'
  }
}
```

```bash
echo "🔍 Running lint check..."
yarn lint
if [ $? -ne 0 ]; then
  echo "❌ LINT FAILED - Attempting auto-fix..."
  yarn lint --fix
  if [ $? -ne 0 ]; then
    echo "❌ AUTO-FIX FAILED - Manual intervention required"
    echo "📋 Run 'yarn lint' to see remaining errors"
    exit 1
  fi
  echo "✅ Lint errors auto-fixed, validating again..."
  yarn lint
  if [ $? -ne 0 ]; then
    echo "❌ LINT STILL FAILING - Manual fixes needed"
    exit 1
  fi
fi
echo "✅ Lint passed"

echo "🧪 Running tests with coverage..."
yarn test --coverage
if [ $? -ne 0 ]; then
  echo "❌ TESTS FAILED - Running specific test to identify issue..."
  yarn test --run --reporter=verbose
  echo "❌ Tests must be fixed manually"
  echo "📋 Check the test output above for details"
  exit 1
fi
echo "✅ Tests passed"

echo "📦 Staging changes..."
git add .

echo "💾 Creating commit..."
git commit -m "feat([feature-name]): add [error-name] domain error"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED - Checking git status..."
  git status
  echo "📋 Review the status above and fix any issues"
  exit 1
fi
echo "✅ Successfully committed"
```

### Feature Test Helpers

**Purpose:** Provide mock implementations and test utilities for domain testing

#### ✅ Test Helpers SHOULD:
- Create mock/stub implementations of use cases
- Generate fake test data
- Be pure functions that return consistent data
- Help reduce test boilerplate
- Use ONLY Vitest (Jest is prohibited)

#### ❌ Test Helpers SHOULD NOT:
- Make real API calls or database queries
- Depend on external services
- Contain test assertions (those belong in test files)
- Have side effects or maintain state
- Use Jest (use Vitest instead)

```typescript
// src/features/[feature-name]/domain/test/mock-[action-entity]-use-case.ts
import { vi } from 'vitest'
import type { [ActionEntity]UseCase, [ActionEntity]Input, [ActionEntity]Output } from '../use-cases'

/**
 * Creates a mock instance of [ActionEntity]Input
 * @returns Mock input for testing
 */
export const mock[ActionEntity]Input = (): [ActionEntity]Input => ({
  // Mock input parameters
})

/**
 * Creates a mock instance of [ActionEntity]Output
 * @returns Mock output for testing
 */
export const mock[ActionEntity]Output = (): [ActionEntity]Output => ({
  // Mock output data
})

/**
 * Creates a mock instance of [ActionEntity]UseCase
 * @returns Mocked use case with vitest functions
 */
export const mock[ActionEntity]UseCase = (): [ActionEntity]UseCase => ({
  execute: vi.fn()
})
```

```bash
echo "🔍 Running lint check..."
yarn lint
if [ $? -ne 0 ]; then
  echo "❌ LINT FAILED - Attempting auto-fix..."
  yarn lint --fix
  if [ $? -ne 0 ]; then
    echo "❌ AUTO-FIX FAILED - Manual intervention required"
    echo "📋 Run 'yarn lint' to see remaining errors"
    exit 1
  fi
  echo "✅ Lint errors auto-fixed, validating again..."
  yarn lint
  if [ $? -ne 0 ]; then
    echo "❌ LINT STILL FAILING - Manual fixes needed"
    exit 1
  fi
fi
echo "✅ Lint passed"

echo "🧪 Running tests with coverage..."
yarn test --coverage
if [ $? -ne 0 ]; then
  echo "❌ TESTS FAILED - Running specific test to identify issue..."
  yarn test --run --reporter=verbose
  echo "❌ Tests must be fixed manually"
  echo "📋 Check the test output above for details"
  exit 1
fi
echo "✅ Tests passed"

echo "📦 Staging changes..."
git add .

echo "💾 Creating commit..."
git commit -m "test([feature-name]): add [action-entity] use case test helpers"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED - Checking git status..."
  git status
  echo "📋 Review the status above and fix any issues"
  exit 1
fi
echo "✅ Successfully committed"
```

## Troubleshooting & Refactoring Guide

### When Code Generation Fails

#### If Lint Fails:
1. **DO NOT commit** - Fix all lint errors first
2. Check for unused imports
3. Verify proper TypeScript types
4. Ensure no console.log statements
5. Run `yarn lint --fix` to auto-fix when possible

#### If Tests Fail:
1. **DO NOT commit** - All tests must pass
2. Check if mocks match the actual interfaces
3. Verify Input/Output types are correct
4. Ensure test coverage meets requirements
5. Run specific test: `yarn test [test-file-path]`

#### If TypeScript Compilation Fails:
1. Check all type definitions match
2. Ensure no missing imports
3. Verify interface implementations are complete
4. Run `yarn tsc --noEmit` to check types

### Refactoring Checklist

#### Before Refactoring:
```bash
# Check current status and differences
echo "📊 Checking current changes..."
git status
git diff

# Ensure clean working directory
echo "✅ Saving current work..."
git stash save "WIP: before refactoring"

# Create refactoring branch
echo "🌿 Creating refactor branch..."
git checkout -b refactor/[feature-name]

# Run tests to ensure starting point is stable
echo "🧪 Validating current state..."
yarn test --run
if [ $? -ne 0 ]; then
  echo "❌ Tests failing before refactor - fix first!"
  exit 1
fi
echo "✅ Ready to refactor"
```

#### During Refactoring:
```bash
# After each change, check what was modified
echo "🔍 Reviewing changes..."
git diff --stat
git diff

# Validate the change
yarn lint && yarn test --run

# Commit atomically
git add -p  # Interactive staging to commit only related changes
git commit -m "refactor([feature-name]): [specific change description]"

# Show what was changed in the last commit
git show --stat
```

#### Common Refactoring Scenarios:

**Splitting a Use Case (when it does too much):**
```typescript
// ❌ WRONG: Multiple responsibilities
interface CreateUserAndSendEmailUseCase {
  execute: (input: CreateUserAndSendEmailInput) => Promise<CreateUserAndSendEmailOutput>
}

// ✅ CORRECT: Split into two use cases
interface CreateUserUseCase {
  execute: (input: CreateUserInput) => Promise<CreateUserOutput>
}

interface SendWelcomeEmailUseCase {
  execute: (input: SendWelcomeEmailInput) => Promise<SendWelcomeEmailOutput>
}
```

**Renaming for Clarity:**
```bash
# 1. See all occurrences before changing
echo "🔍 Finding all occurrences of [OldName]..."
grep -r "[OldName]" src/features/[feature-name]/

# 2. Perform the rename
echo "✏️ Renaming [OldName] to [NewName]..."
# Update files...

# 3. Review the changes
echo "📊 Reviewing rename changes..."
git diff --word-diff  # Shows word-level differences

# 4. Validate nothing broke
yarn lint && yarn test --run

# 5. Check if rename is complete
echo "🔍 Ensuring no [OldName] remains..."
grep -r "[OldName]" src/features/[feature-name]/
if [ $? -eq 0 ]; then
  echo "⚠️ Warning: [OldName] still found in some files"
fi

# 6. Commit the rename
git add .
git commit -m "refactor([feature-name]): rename [OldName] to [NewName] for clarity"

# 7. Show the final diff
git show --stat
```

### Recovery Steps

#### If You Accidentally Committed Bad Code:
```bash
# Revert the last commit but keep changes
git reset --soft HEAD~1

# Fix the issues
# ... make corrections ...

# Re-run validation
yarn lint
yarn test --coverage

# Commit again with fixed code
git add .
git commit -m "[original message] - fixed"
```

#### If Domain Layer Gets Polluted:
```bash
# 1. Identify violations in domain
echo "🔍 Checking for domain violations..."
git diff src/features/[feature-name]/domain/

# Check for forbidden patterns
echo "⚠️ Checking for business logic..."
grep -r "class.*{.*calculate\|validate\|process" src/features/[feature-name]/domain/

echo "⚠️ Checking for external dependencies..."
grep -r "import.*axios\|fetch\|http" src/features/[feature-name]/domain/

echo "⚠️ Checking for console logs..."
grep -r "console\." src/features/[feature-name]/domain/

# 2. Show what needs to be moved
git diff src/features/[feature-name]/domain/ --name-only

# 3. After moving code to proper layers
echo "✅ Validating domain is clean..."
yarn lint
yarn test --run

# 4. Commit the cleanup
git add .
git diff --staged --stat
git commit -m "refactor([feature-name]): remove business logic from domain layer"
```

### AI Code Generation Guidelines

When generating code, the AI should:

1. **Always validate before committing:**
   - Run lint first
   - Run tests second
   - Only commit if both pass

2. **If generation fails:**
   - Identify the specific error
   - Fix only that error
   - Re-run validation
   - Do NOT proceed until fixed

3. **Follow the principle:**
   - One use case = One file = One responsibility
   - If tempted to add "And" in a use case name, split it

4. **When in doubt:**
   - Choose simplicity over complexity
   - Split rather than combine
   - Ask for clarification rather than assume
