---
title: "__FEATURE_NAME_PASCAL_CASE__ Clean Architecture Implementation"
description: "Clean Architecture template for __FEATURE_NAME_LOWER_CASE__ feature following master template rules."
version: "3.0.0"
source: "TEMPLATE_REFACTORED.yaml"
lastUpdated: "__CURRENT_DATE__"
layers:
  - domain
template_type: domain
---

# __FEATURE_NAME_PASCAL_CASE__ Clean Architecture Implementation

> Clean Architecture template for __FEATURE_NAME_LOWER_CASE__ feature following master template rules.

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
**Source:** TEMPLATE_REFACTORED.yaml
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
- Independence: Business rules don't know about outside world
- Testability: Business rules can be tested without UI, Database, Web Server, etc.
- Flexibility: UI, Database, and any external agency are plugins
- Separation: Business rules are the core, everything else is detail

## Structure

**Base Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__`

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
  branch_name: feat/__FEATURE_NAME_KEBAB_CASE__
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
BRANCH_NAME="feat/__FEATURE_NAME_KEBAB_CASE__"

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

### Step 2: Create __LAYER__ layer folder structure

**ID:** `create-__LAYER__-structure`
**Type:** `folder`
**Status:** PENDING

#### References
- **internal_guideline**: Following Clean Architecture __LAYER__ layer structure.
  - Source: ARCHITECTURE.md

#### Action
```yaml
{
  create_folders: {
    basePath: src/features/__FEATURE_NAME_KEBAB_CASE__/__LAYER__,
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
BASE_PATH="src/features/__FEATURE_NAME_KEBAB_CASE__/__LAYER__"
FOLDERS="$BASE_PATH/errors $BASE_PATH/use-cases $BASE_PATH/test"
echo "✅ Verifying __LAYER__ folder structure..."
for folder in $FOLDERS; do
  if [ ! -d "$folder" ]; then
    echo "❌ ERROR: Folder $folder was not created."
    exit 1
  fi
done
echo "✅ All __LAYER__ folders exist."
```

</details>

---

### Step 3: Create __ACTION_ENTITY_PASCAL_CASE__ use case interface

**ID:** `create-use-case-__ACTION_ENTITY_KEBAB_CASE__`
**Type:** `create_file`
**Status:** PENDING

#### References
- **external_pattern**: Following Clean Architecture pattern.
  - Source: context7
  - Query: `clean architecture use case`
  - URL: https://github.com/...
- **internal_code_analysis**: Consistent with existing use case interfaces.
  - Source: serena
  - Query: `*UseCase`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/__LAYER__/use-cases/__ACTION_ENTITY_KEBAB_CASE__.ts`

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
  exit 1
fi
echo "✅ Successfully committed"
```

</details>

---

### Step 4: Create __ERROR_NAME_KEBAB_CASE__ error class

**ID:** `create-error-__ERROR_NAME_KEBAB_CASE__`
**Type:** `create_file`
**Status:** PENDING

#### References
- **external_pattern**: Following DDD error handling patterns.
  - Source: context7
  - Query: `domain driven design error handling`
  - URL: https://github.com/...
- **internal_code_analysis**: Consistent with existing domain errors.
  - Source: serena
  - Query: `*Error`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/__LAYER__/errors/__ERROR_NAME_KEBAB_CASE__.ts`

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
  echo "❌ TESTS FAILED"
  exit 1
fi
echo "✅ Tests passed"

echo "📦 Staging changes..."
git add .

echo "💾 Creating commit..."
git commit -m "feat(__FEATURE_NAME_KEBAB_CASE__): add __ERROR_NAME_KEBAB_CASE__ error class"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
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
- **external_pattern**: Following TDD mock patterns.
  - Source: context7
  - Query: `test driven development mocks`
  - URL: https://github.com/...
- **internal_code_analysis**: Consistent with existing test helpers.
  - Source: serena
  - Query: `mock*`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/__LAYER__/test/mock-__ACTION_ENTITY_KEBAB_CASE__-use-case.ts`

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
  echo "❌ LINT FAILED"
  exit 1
fi
echo "✅ Lint passed"

echo "🧪 Running tests..."
yarn test --coverage
if [ $? -ne 0 ]; then
  echo "❌ TESTS FAILED"
  exit 1
fi
echo "✅ Tests passed"

echo "📦 Staging changes..."
git add .

echo "💾 Creating commit..."
git commit -m "test(__FEATURE_NAME_KEBAB_CASE__): add __ACTION_ENTITY_KEBAB_CASE__ use case test helpers"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
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
- **internal_code_analysis**: Refactoring affected files.
  - Source: serena
  - Query: `__SYMBOL_BEING_CHANGED__`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/path/to/__FILE_TO_MODIFY_KEBAB_CASE__.ts`

#### Template
```typescript
<<<REPLACE>>>
// Old code to be replaced
export type OldType = {
  fieldA: string;
}
<<</REPLACE>>>
<<<WITH>>>
// New code
export type OldType = {
  fieldA: string;
  newFieldB: number;
}
<<</WITH>>>
```

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🔍 Running lint check..."
yarn lint
if [ $? -ne 0 ]; then
  echo "❌ LINT FAILED"
  exit 1
fi
echo "✅ Lint passed"

echo "🧪 Running tests..."
yarn test --coverage
if [ $? -ne 0 ]; then
  echo "❌ TESTS FAILED"
  exit 1
fi
echo "✅ Tests passed"

echo "📦 Staging changes..."
git add .

echo "💾 Creating commit..."
git commit -m "refactor(__FEATURE_NAME_KEBAB_CASE__): update __FILE_TO_MODIFY_KEBAB_CASE__"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
  exit 1
fi
echo "✅ Successfully committed"
```

</details>

---

### Step 7: Delete file __FILE_TO_DELETE_PASCAL_CASE__ due to generation error

**ID:** `delete-file-__FILE_TO_DELETE_KEBAB_CASE__`
**Type:** `delete_file`
**Status:** PENDING

#### References
- **internal_correction**: Deleting artifact from failed step.
  - Source: self

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/path/to/__FILE_TO_DELETE_KEBAB_CASE__.ts`

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🗑️ Verifying file deletion..."
if [ -f "src/features/__FEATURE_NAME_KEBAB_CASE__/path/to/__FILE_TO_DELETE_KEBAB_CASE__.ts" ]; then
  echo "❌ ERROR: File was not deleted."
  exit 1
fi
echo "✅ File successfully deleted."

echo "🔍 Running lint check..."
yarn lint
if [ $? -ne 0 ]; then
  echo "❌ LINT FAILED"
  exit 1
fi
echo "✅ Lint passed."

echo "📦 Staging changes..."
git add .

echo "💾 Creating commit..."
git commit -m "chore(__FEATURE_NAME_KEBAB_CASE__): delete broken artifact"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
  exit 1
fi
echo "✅ Successfully committed."
```

</details>

---

### Step 8: Create pull request for __FEATURE_NAME_PASCAL_CASE__ implementation

**ID:** `create-pull-request`
**Type:** `pull_request`
**Status:** PENDING

#### References
- **internal_guideline**: Following PR process for feature integration.
  - Source: GIT_WORKFLOW.md

#### Action
```yaml
{
  target_branch: main,
  source_branch: feat/__FEATURE_NAME_KEBAB_CASE__,
  title: feat(__FEATURE_NAME_KEBAB_CASE__): implement clean architecture layers
}
```

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🚀 Preparing to create pull request..."

# Push the current branch to remote
echo "📤 Pushing branch to remote..."
git push --set-upstream origin feat/__FEATURE_NAME_KEBAB_CASE__
if [ $? -ne 0 ]; then
  echo "❌ ERROR: Failed to push branch to remote"
  exit 1
fi

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
  echo "⚠️ GitHub CLI (gh) is not installed."
  echo "📋 Please create PR manually"
  exit 0
fi

# Create the pull request
echo "🔄 Creating pull request..."
PR_BODY="## Summary

Implementation of Clean Architecture layers for __FEATURE_NAME_PASCAL_CASE__ feature.

### Changes included:
- Domain layer with use case interfaces
- Domain errors
- Test helpers and mocks

### Architecture Compliance:
- ✅ Clean Architecture principles
- ✅ No dependency violations
- ✅ All tests passing
- ✅ Lint checks passed
- ✅ RLHF score: +2 (PERFECT)

### Generated by:
- Template: TEMPLATE_REFACTORED.yaml
- Date: $(date +%Y-%m-%d)

---
🤖 Generated with spec-kit-clean-architecture"

gh pr create \
  --base main \
  --head feat/__FEATURE_NAME_KEBAB_CASE__ \
  --title "feat(__FEATURE_NAME_KEBAB_CASE__): implement clean architecture layers" \
  --body "$PR_BODY" \
  --assignee @me

if [ $? -eq 0 ]; then
  echo "✅ Pull request created successfully!"
  PR_URL=$(gh pr view --json url -q .url)
  echo "📎 Pull Request URL: $PR_URL"
  gh pr view --web
else
  echo "⚠️ Could not create PR automatically. Please create manually."
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
