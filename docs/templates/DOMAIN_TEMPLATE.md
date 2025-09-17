---
title: "__FEATURE_NAME_PASCAL_CASE__ Domain Layer - Clean Architecture"
description: "TDD template for __FEATURE_NAME_LOWER_CASE__ feature following the master template rules."
version: "3.0.0"
source: "DOMAIN_TEMPLATE.yaml"
lastUpdated: "__CURRENT_DATE__"
layers:
  - domain
template_type: domain
---

# __FEATURE_NAME_PASCAL_CASE__ Domain Layer - Clean Architecture

> TDD template for __FEATURE_NAME_LOWER_CASE__ feature following the master template rules.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Structure](#structure)
- [Implementation Steps](#implementation-steps)
- [Rules & Guidelines](#rules--guidelines)
- [Troubleshooting](#troubleshooting)
- [AI Guidelines](#ai-guidelines)

## Overview

**Version:** 3.0.0
**Source:** DOMAIN_TEMPLATE.yaml
**Last Updated:** __CURRENT_DATE__

### Ubiquitous Language

| Term | Definition |
|------|------------|
| __ENTITY_NAME__ | __ENTITY_DEFINITION_IN_BUSINESS_CONTEXT__ |
| __VALUE_OBJECT_NAME__ | __VALUE_OBJECT_BUSINESS_MEANING__ |
| __DOMAIN_EVENT__ | __EVENT_BUSINESS_SIGNIFICANCE__ |

## Architecture

### Dependency Rules

#### domain
- **Cannot import from:** application, infrastructure, presentation, external

### Architecture Principles
- Domain must be completely independent
- No external dependencies allowed
- Only interfaces and types
- Framework agnostic
- Business rules expressed as types

## Structure

**Base Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/domain`

### Folders
- `errors`
- `use-cases`
- `test`

## Implementation Steps

Total steps: 8

### Step 1: Create a new feature branch for __FEATURE_NAME_PASCAL_CASE__

**ID:** `create-feature-branch`
**Type:** `branch`
**Status:** PENDING

#### References
- **internal_guideline**: Following git branching best practices for feature development.
  - Source: GIT_WORKFLOW.md

#### Action
```yaml
{
  branch_name: feat/__FEATURE_NAME_KEBAB_CASE__-domain
}
```

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🌿 Creating feature branch..."
# Check if we are on a clean state
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Warning: You have uncommitted changes. Stashing them..."
  git stash save "Auto-stash before creating feature branch for __FEATURE_NAME_KEBAB_CASE__"
fi

# Get current branch to use as base
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Create and checkout new feature branch
BRANCH_NAME="feat/__FEATURE_NAME_KEBAB_CASE__-domain"

# Check if branch already exists
if git show-ref --quiet refs/heads/$BRANCH_NAME; then
  echo "⚠️ Branch $BRANCH_NAME already exists. Checking out..."
  git checkout $BRANCH_NAME
else
  echo "🌿 Creating new branch: $BRANCH_NAME"
  git checkout -b $BRANCH_NAME
fi

# Verify we're on the correct branch
CURRENT=$(git branch --show-current)
if [ "$CURRENT" != "$BRANCH_NAME" ]; then
  echo "❌ ERROR: Failed to switch to branch $BRANCH_NAME"
  exit 1
fi

echo "✅ Successfully created and switched to branch: $BRANCH_NAME"

# If we had stashed changes, inform the user
if git stash list | grep -q "Auto-stash before creating feature branch"; then
  echo "💡 Note: You have stashed changes. Run 'git stash pop' to restore them if needed."
fi
```

</details>

---

### Step 2: Create domain folder structure

**ID:** `create-structure`
**Type:** `folder`
**Status:** PENDING

#### References
- **internal_guideline**: Following the standard feature-based domain structure.
  - Source: ARCHITECTURE.md

#### Action
```yaml
{
  create_folders: {
    basePath: src/features/__FEATURE_NAME_KEBAB_CASE__/domain,
    folders: [
      errors,
      use-cases,
      test
    ]
  }
}
```

<details>
<summary>📋 Validation Script</summary>

```bash
echo "✅ Verifying folder structure..."
# Adiciona uma verificação explícita para falhar se as pastas não existirem
if [ ! -d "src/features/__FEATURE_NAME_KEBAB_CASE__/domain/errors" ] || \
   [ ! -d "src/features/__FEATURE_NAME_KEBAB_CASE__/domain/use-cases" ] || \
   [ ! -d "src/features/__FEATURE_NAME_KEBAB_CASE__/domain/test" ]; then
  echo "❌ ERROR: One or more domain folders were not created."
  exit 1
fi
echo "✅ Folders exist."
```

</details>

---

### Step 3: Create __ACTION_ENTITY_PASCAL_CASE__ use case interface

**ID:** `create-use-case-__ACTION_ENTITY_KEBAB_CASE__`
**Type:** `create_file`
**Status:** PENDING

#### References
- **external_pattern**: This use case follows the Command pattern for handling actions.
  - Source: context7
  - Query: `awesome system design __CONCEPT__`
  - URL: https://github.com/...
- **internal_code_analysis**: The structure is consistent with existing use cases like `OtherUseCase` found in the project.
  - Source: serena
  - Query: `*Repository`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/domain/use-cases/__ACTION_ENTITY_KEBAB_CASE__.ts`

#### Template
```typescript
/**
 * Input parameters for __ACTION_ENTITY_PASCAL_CASE__UseCase
 * Following Clean Architecture principles - pure domain types
 * @domainConcept __UBIQUITOUS_LANGUAGE_TERM__
 */
export type __ACTION_ENTITY_PASCAL_CASE__Input = {
  __USE_CASE_INPUT_FIELDS__
}

/**
 * Output type for __ACTION_ENTITY_PASCAL_CASE__UseCase
 * Represents the business outcome of the operation
 * @domainConcept __UBIQUITOUS_LANGUAGE_TERM__
 */
export type __ACTION_ENTITY_PASCAL_CASE__Output = {
  __USE_CASE_OUTPUT_FIELDS__
}

/**
 * __ACTION_ENTITY_PASCAL_CASE__UseCase interface
 * @description __USE_CASE_DESCRIPTION__
 * @pattern Command Pattern - Single Responsibility Principle
 * @layer Domain Layer - Framework agnostic business interface
 */
export interface __ACTION_ENTITY_PASCAL_CASE__UseCase {
  /**
   * Execute the __ACTION_ENTITY_LOWER_CASE__ operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   * @throws Domain errors when business rules are violated
   */
  execute: (input: __ACTION_ENTITY_PASCAL_CASE__Input) => Promise<__ACTION_ENTITY_PASCAL_CASE__Output>
}
```

<details>
<summary>📋 Validation Script</summary>

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
git commit -m "feat(__FEATURE_NAME_KEBAB_CASE__): add __ACTION_ENTITY_KEBAB_CASE__ use case"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED - Checking git status..."
  git status
  echo "📋 Review the status above and fix any issues"
  exit 1
fi
echo "✅ Successfully committed"
```

</details>

---

### Step 4: Create __ERROR_NAME_KEBAB_CASE__ domain error

**ID:** `create-error-__ERROR_NAME_KEBAB_CASE__`
**Type:** `create_file`
**Status:** PENDING

#### References
- **external_pattern**: This use case follows the Command pattern for handling actions.
  - Source: context7
  - Query: `awesome system design __CONCEPT__`
  - URL: https://github.com/...
- **internal_code_analysis**: The structure is consistent with existing use cases like `OtherUseCase` found in the project.
  - Source: serena
  - Query: `*Repository`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/domain/errors/__ERROR_NAME_KEBAB_CASE__.ts`

#### Template
```typescript
/**
 * Domain error thrown when __ERROR_DESCRIPTION__
 * Represents a business rule violation in the __FEATURE_NAME__ bounded context
 * @domainConcept __UBIQUITOUS_LANGUAGE_TERM__
 * @pattern Domain Error - Clean Architecture principle
 * @extends Error
 */
export class __ERROR_NAME_PASCAL_CASE__Error extends Error {
  constructor() {
    super('__ERROR_MESSAGE__')
    this.name = '__ERROR_NAME_PASCAL_CASE__Error'
  }
}
```

<details>
<summary>📋 Validation Script</summary>

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
git commit -m "feat(__FEATURE_NAME_KEBAB_CASE__): add __ERROR_NAME_KEBAB_CASE__ domain error"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED - Checking git status..."
  git status
  echo "📋 Review the status above and fix any issues"
  exit 1
fi
echo "✅ Successfully committed"
```

</details>

---

### Step 5: Create mock for __ACTION_ENTITY_PASCAL_CASE__ use case

**ID:** `create-test-helper-__ACTION_ENTITY_KEBAB_CASE__`
**Type:** `create_file`
**Status:** PENDING

#### References
- **external_pattern**: This use case follows the Command pattern for handling actions.
  - Source: context7
  - Query: `awesome system design __CONCEPT__`
  - URL: https://github.com/...
- **internal_code_analysis**: The structure is consistent with existing use cases like `OtherUseCase` found in the project.
  - Source: serena
  - Query: `*Repository`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/domain/test/mock-__ACTION_ENTITY_KEBAB_CASE__-use-case.ts`

#### Template
```typescript
import { vi } from 'vitest'
import type { __ACTION_ENTITY_PASCAL_CASE__UseCase, __ACTION_ENTITY_PASCAL_CASE__Input, __ACTION_ENTITY_PASCAL_CASE__Output } from '../use-cases/__ACTION_ENTITY_KEBAB_CASE__'

/**
 * Creates a mock instance of __ACTION_ENTITY_PASCAL_CASE__Input
 * @returns Mock input for testing
 */
export const mock__ACTION_ENTITY_PASCAL_CASE__Input = (): __ACTION_ENTITY_PASCAL_CASE__Input => ({
  __MOCK_INPUT_DATA__
})

/**
 * Creates a mock instance of __ACTION_ENTITY_PASCAL_CASE__Output
 * @returns Mock output for testing
 */
export const mock__ACTION_ENTITY_PASCAL_CASE__Output = (): __ACTION_ENTITY_PASCAL_CASE__Output => ({
  __MOCK_OUTPUT_DATA__
})

/**
 * Creates a mock instance of __ACTION_ENTITY_PASCAL_CASE__UseCase
 * @returns Mocked use case with vitest functions
 */
export const mock__ACTION_ENTITY_PASCAL_CASE__UseCase = (): __ACTION_ENTITY_PASCAL_CASE__UseCase => ({
  execute: vi.fn()
})
```

<details>
<summary>📋 Validation Script</summary>

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
git commit -m "test(__FEATURE_NAME_KEBAB_CASE__): add __ACTION_ENTITY_KEBAB_CASE__ use case test helpers"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED - Checking git status..."
  git status
  echo "📋 Review the status above and fix any issues"
  exit 1
fi
echo "✅ Successfully committed"
```

</details>

---

### Step 6: Refactor __FILE_TO_MODIFY_PASCAL_CASE__ to incorporate new logic

**ID:** `refactor-__FILE_TO_MODIFY_KEBAB_CASE__`
**Type:** `refactor_file`
**Status:** PENDING

#### References
- **internal_code_analysis**: Refactoring this file because it is a primary consumer of the changed `__SYMBOL__` interface.
  - Source: serena
  - Query: `__SYMBOL_BEING_CHANGED__`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/path/to/__FILE_TO_MODIFY_KEBAB_CASE__.ts`

#### Template
```typescript
<<<REPLACE>>>
// Código antigo que a IA identificou para ser substituído
export type OldType = {
  fieldA: string;
}
<<</REPLACE>>>
<<<WITH>>>
// Novo código que a IA gerou para substituir o antigo
export type OldType = {
  fieldA: string;
  newFieldB: number; // Adicionando o novo campo
}
<<</WITH>>>
```

<details>
<summary>📋 Validation Script</summary>

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
git commit -m "refactor(__FEATURE_NAME_KEBAB_CASE__): refactor __FILE_TO_MODIFY_KEBAB_CASE__"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED - Checking git status..."
  git status
  echo "📋 Review the status above and fix any issues"
  exit 1
fi
echo "✅ Successfully committed"
```

</details>

---

### Step 7: Delete the file __FILE_TO_DELETE_PASCAL_CASE__ due to a generation error

**ID:** `delete-file-__FILE_TO_DELETE_KEBAB_CASE__`
**Type:** `delete_file`
**Status:** PENDING

#### References
- **internal_correction**: Deleting the artifact from the failed step `__FAILED_STEP_ID__` to prepare for a corrected version.
  - Source: self

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/path/to/__FILE_TO_DELETE_KEBAB_CASE__.ts`

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🗑️ Verifying file deletion..."
if [ -f "src/features/__FEATURE_NAME_KEBAB_CASE__/path/to/__FILE_TO_DELETE_KEBAB_CASE__.ts" ]; then
  echo "❌ ERROR: File at __FILE_TO_DELETE_KEBAB_CASE__.ts was not deleted."
  exit 1
fi
echo "✅ File successfully deleted."

echo "🔍 Running lint check on the project..."
yarn lint
if [ $? -ne 0 ]; then
  echo "❌ LINT FAILED after deletion."
  exit 1
fi
echo "✅ Lint passed."

echo "📦 Staging changes..."
git add .

echo "💾 Creating commit..."
git commit -m "chore(__FEATURE_NAME_KEBAB_CASE__): delete broken artifact __FILE_TO_DELETE_KEBAB_CASE__"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED - Checking git status..."
  git status
  exit 1
fi
echo "✅ Successfully committed deletion."
```

</details>

---

### Step 8: Create pull request for __FEATURE_NAME_PASCAL_CASE__ domain to staging

**ID:** `create-pull-request`
**Type:** `pull_request`
**Status:** PENDING

#### References
- **internal_guideline**: Following PR process for feature integration to staging.
  - Source: GIT_WORKFLOW.md

#### Action
```yaml
{
  target_branch: staging,
  source_branch: feat/__FEATURE_NAME_KEBAB_CASE__-domain,
  title: feat(__FEATURE_NAME_KEBAB_CASE__): implement domain layer
}
```

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🚀 Preparing to create pull request..."

# Push the current branch to remote
echo "📤 Pushing branch to remote..."
git push --set-upstream origin feat/__FEATURE_NAME_KEBAB_CASE__-domain
if [ $? -ne 0 ]; then
  echo "❌ ERROR: Failed to push branch to remote"
  exit 1
fi

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
  echo "⚠️ GitHub CLI (gh) is not installed."
  echo "📋 Please create PR manually at:"
  echo "   https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/pull/new/feat/__FEATURE_NAME_KEBAB_CASE__-domain"
  exit 0
fi

# Create the pull request
echo "🔄 Creating pull request to staging..."
PR_BODY="## Summary

Implementation of domain layer for __FEATURE_NAME_PASCAL_CASE__ feature.

### Changes included:
- Use case interfaces
- Domain errors
- Test helpers and mocks

### Domain Layer Compliance:
- ✅ No external dependencies
- ✅ Only interfaces and types
- ✅ Follows Clean Architecture principles
- ✅ All tests passing
- ✅ Lint checks passed

### Generated by:
- Template: DOMAIN_TEMPLATE.yaml
- Date: $(date +%Y-%m-%d)

---
🤖 Generated with spec-kit-clean-architecture"

gh pr create \
  --base staging \
  --head feat/__FEATURE_NAME_KEBAB_CASE__-domain \
  --title "feat(__FEATURE_NAME_KEBAB_CASE__): implement domain layer" \
  --body "$PR_BODY" \
  --assignee @me

if [ $? -eq 0 ]; then
  echo "✅ Pull request created successfully!"

  # Show PR URL
  PR_URL=$(gh pr view --json url -q .url)
  echo "📎 Pull Request URL: $PR_URL"

  # Optionally open in browser
  echo "🌐 Opening PR in browser..."
  gh pr view --web
else
  echo "⚠️ Could not create PR automatically. Please create manually:"
  echo "   gh pr create --base staging --head feat/__FEATURE_NAME_KEBAB_CASE__-domain"
fi
```

</details>

---

## Rules & Guidelines

## Domain Layer Rules

### Allowed
- Simple type definitions (Input/Output types)
- Use case interfaces (contracts only)
- Domain-specific error classes
- Test mock functions

### Forbidden
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

## Use Case Rules

### ✅ Should
- Define only interfaces/contracts, not implementations
- Have EXACTLY ONE responsibility (one business operation)
- Do ONE thing and ONE thing only (never multiple operations)
- Return domain types or primitives
- Be named with verbs (CreateUser, AuthenticateUser, etc.)
- Be framework agnostic

### ❌ Should NOT
- Contain implementation logic
- Know about HTTP, databases, or external services
- Import from data, presentation, or infrastructure layers
- Have side effects
- Execute multiple operations (e.g., CreateUserAndSendEmail is wrong)

## Error Rules

### ✅ Should
- Extend the native Error class
- Have descriptive names ending with Error
- Contain meaningful error messages
- Represent business rule violations
- Be thrown when domain invariants are violated

### ❌ Should NOT
- Contain HTTP status codes
- Include technical/implementation details
- Expose sensitive information
- Import external dependencies

## Test Helper Rules

### ✅ Should
- Create mock/stub implementations of use cases
- Generate fake test data
- Be pure functions that return consistent data
- Help reduce test boilerplate
- Use ONLY Vitest (Jest is prohibited)

### ❌ Should NOT
- Make real API calls or database queries
- Depend on external services
- Contain test assertions (those belong in test files)
- Have side effects or maintain state
- Use Jest (use Vitest instead)

## Troubleshooting

### Lint Fails
- DO NOT commit - Fix all lint errors first
- Check for unused imports
- Verify proper TypeScript types
- Ensure no console.log statements
- Run yarn lint --fix to auto-fix when possible

### Tests Fail
- DO NOT commit - All tests must pass
- Check if mocks match the actual interfaces
- Verify Input/Output types are correct
- Ensure test coverage meets requirements
- Run specific test: yarn test [test-file-path]

### Typescript Fails
- Check all type definitions match
- Ensure no missing imports
- Verify interface implementations are complete
- Run yarn tsc --noEmit to check types

## AI Guidelines

- Always validate before committing: Run lint first, Run tests second, Only commit if both pass
- If generation fails: Identify the specific error, Fix only that error, Re-run validation, Do NOT proceed until fixed
- Follow the principle: One use case = One file = One responsibility
- If tempted to add "And" in a use case name, split it
- When in doubt: Choose simplicity over complexity, Split rather than combine, Ask for clarification rather than assume
- MUST generate different case styles from the input names (e.g., "Add Item To Cart" becomes: PascalCase=AddItemToCart, kebab-case=add-item-to-cart, lower case=add item to cart).
- MUST replace ALL placeholder variables (like __FEATURE_NAME_KEBAB_CASE__) with actual values
- MUST NOT leave any placeholder variables in the final implementation
- MUST NOT replace any [placeholders] found inside documentation sections like refactoring or recovery
- MUST use vitest, NOT jest
- MUST follow all domain rules - no business logic, no external dependencies

## Evaluation Criteria

**Status:** PENDING

### Review Summary
```
- What went well:
  - ...
- Areas for improvement:
  - ...
```
