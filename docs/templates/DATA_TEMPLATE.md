---
title: "__FEATURE_NAME_PASCAL_CASE__ Data Layer Implementation"
description: "TDD implementation of use cases for __FEATURE_NAME_LOWER_CASE__ feature following Clean Architecture principles."
version: "3.0.0"
source: "DATA_TEMPLATE_REFACTORED.yaml"
lastUpdated: "__CURRENT_DATE__"
layers:
  - data
tdd_principles:
  - "Test First - Never write implementation before tests"
  - "Red-Green-Refactor cycle"
  - "Tests define the contract"
  - "Mock all external dependencies"
template_type: data
---

# __FEATURE_NAME_PASCAL_CASE__ Data Layer Implementation

> TDD implementation of use cases for __FEATURE_NAME_LOWER_CASE__ feature following Clean Architecture principles.

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
**Source:** DATA_TEMPLATE_REFACTORED.yaml
**Last Updated:** __CURRENT_DATE__

### Ubiquitous Language

| Term | Definition |
|------|------------|
| __PROTOCOL_NAME__ | __PROTOCOL_BUSINESS_PURPOSE__ |
| __USE_CASE_IMPLEMENTATION__ | __IMPLEMENTATION_BUSINESS_RESPONSIBILITY__ |
| __EXTERNAL_DEPENDENCY__ | __DEPENDENCY_ABSTRACTION_PURPOSE__ |

## Architecture

### Dependency Rules

#### data
- **Can import from:** domain
- **Cannot import from:** infrastructure, presentation, external
- **Must use protocols:** true

### Architecture Principles
- Implementation: Business logic implementation through abstract protocols
- TDD: Tests first, implementation last - NO EXCEPTIONS
- Protocols: All external dependencies abstracted through interfaces
- Independence: No direct imports of external libraries or frameworks

## Required Protocols

### DB
- __ENTITY__Repository
- Check__ENTITY__Repository

### HTTP
- HttpClient

### CRYPTOGRAPHY
- Hasher
- HashComparer
- Encrypter
- Decrypter

### CACHE
- SetStorage
- GetStorage

## Structure

**Base Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__`

### Data Layer
- `protocols/db`
- `protocols/http`
- `protocols/cache`
- `protocols/cryptography`
- `usecases`
- `models`

### Test Structure
**Base Path:** `tests/features/__FEATURE_NAME_KEBAB_CASE__`
- `data/mocks`
- `data/usecases`

## Implementation Steps

Total steps: 10

### Step 1: Create a new feature branch for __FEATURE_NAME_PASCAL_CASE__ data layer

**ID:** `create-feature-branch`
**Type:** `branch`
**Status:** PENDING

#### References
- **internal_guideline**: Following git branching best practices for data layer development.
  - Source: GIT_WORKFLOW.md

#### Action
```yaml
{
  branch_name: feat/__FEATURE_NAME_KEBAB_CASE__-data-layer
}
```

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🌿 Creating data layer feature branch..."
# Check if we are on a clean state
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Warning: You have uncommitted changes. Stashing them..."
  git stash save "Auto-stash before creating data layer branch for __FEATURE_NAME_KEBAB_CASE__"
fi

# Create and checkout new feature branch
BRANCH_NAME="feat/__FEATURE_NAME_KEBAB_CASE__-data-layer"

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
```

</details>

---

### Step 2: Create data layer folder structure

**ID:** `create-data-structure`
**Type:** `folder`
**Status:** PENDING

#### References
- **internal_guideline**: Following feature-based data layer structure.
  - Source: ARCHITECTURE.md

#### Action
```yaml
{
  create_folders: {
    basePath: src/features/__FEATURE_NAME_KEBAB_CASE__/data,
    folders: [
      protocols/db,
      protocols/http,
      protocols/cache,
      protocols/cryptography,
      usecases,
      models
    ]
  }
}
```

<details>
<summary>📋 Validation Script</summary>

```bash
BASE_PATH="src/features/__FEATURE_NAME_KEBAB_CASE__/data"
FOLDERS="$BASE_PATH/protocols/db $BASE_PATH/protocols/http $BASE_PATH/protocols/cache $BASE_PATH/protocols/cryptography $BASE_PATH/usecases $BASE_PATH/models"
echo "✅ Verifying folder structure..."
for folder in $FOLDERS; do
  if [ ! -d "$folder" ]; then
    echo "❌ ERROR: Folder $folder was not created."
    exit 1
  fi
done
echo "✅ All folders exist."
```

</details>

---

### Step 3: Create test folder structure for data layer

**ID:** `create-test-structure`
**Type:** `folder`
**Status:** PENDING

#### References
- **internal_guideline**: Following TDD structure for data layer tests.
  - Source: TESTING.md

#### Action
```yaml
{
  create_folders: {
    basePath: tests/features/__FEATURE_NAME_KEBAB_CASE__/data,
    folders: [
      mocks,
      usecases
    ]
  }
}
```

<details>
<summary>📋 Validation Script</summary>

```bash
BASE_PATH="tests/features/__FEATURE_NAME_KEBAB_CASE__/data"
FOLDERS="$BASE_PATH/mocks $BASE_PATH/usecases"
echo "✅ Verifying folder structure..."
for folder in $FOLDERS; do
  if [ ! -d "$folder" ]; then
    echo "❌ ERROR: Folder $folder was not created."
    exit 1
  fi
done
echo "✅ All folders exist."
```

</details>

---

### Step 4: TDD Step 1: Create test file for __PREFIX____USE_CASE_NAME__ use case

**ID:** `create-test-__PREFIX__-__USE_CASE_NAME_KEBAB__`
**Type:** `create_file`
**Status:** PENDING

#### References
- **external_pattern**: Following TDD red-green-refactor cycle.
  - Source: context7
  - Query: `test driven development best practices`
  - URL: https://github.com/...
- **internal_code_analysis**: Consistent with existing test patterns.
  - Source: serena
  - Query: `*.spec.ts`

**Path:** `tests/features/__FEATURE_NAME_KEBAB_CASE__/data/usecases/__PREFIX__-__USE_CASE_NAME_KEBAB__.spec.ts`

#### Template
```typescript
import { __PREFIX____USE_CASE_NAME__ } from '@/features/__FEATURE_NAME_KEBAB_CASE__/data/usecases'
import { mock__USE_CASE__Input, throwError } from '@/tests/features/__FEATURE_NAME_KEBAB_CASE__/domain/mocks'
import { __DEPENDENCY_1__Spy, __DEPENDENCY_2__Spy } from '@/tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks'
import { describe, test, expect, vi } from 'vitest'

type SutTypes = {
  sut: __PREFIX____USE_CASE_NAME__
  __DEPENDENCY_1_CAMEL__Spy: __DEPENDENCY_1__Spy
  __DEPENDENCY_2_CAMEL__Spy: __DEPENDENCY_2__Spy
}

const makeSut = (): SutTypes => {
  const __DEPENDENCY_1_CAMEL__Spy = new __DEPENDENCY_1__Spy()
  const __DEPENDENCY_2_CAMEL__Spy = new __DEPENDENCY_2__Spy()
  const sut = new __PREFIX____USE_CASE_NAME__(__DEPENDENCY_1_CAMEL__Spy, __DEPENDENCY_2_CAMEL__Spy)
  return {
    sut,
    __DEPENDENCY_1_CAMEL__Spy,
    __DEPENDENCY_2_CAMEL__Spy
  }
}

describe('__PREFIX____USE_CASE_NAME__ Usecase', () => {
  test('Should call __DEPENDENCY_1__ with correct values', async () => {
    const { sut, __DEPENDENCY_1_CAMEL__Spy } = makeSut()
    const input = mock__USE_CASE__Input()

    await sut.execute(input)

    expect(__DEPENDENCY_1_CAMEL__Spy.__PROPERTY__).toBe(input.__FIELD__)
  })

  test('Should throw if __DEPENDENCY_1__ throws', async () => {
    const { sut, __DEPENDENCY_1_CAMEL__Spy } = makeSut()
    vi.spyOn(__DEPENDENCY_1_CAMEL__Spy, '__DEPENDENCY_METHOD__').mockImplementationOnce(throwError)

    const promise = sut.execute(mock__USE_CASE__Input())

    await expect(promise).rejects.toThrow()
  })

  test('Should return correct value on success', async () => {
    const { sut } = makeSut()

    const result = await sut.execute(mock__USE_CASE__Input())

    expect(result).toBe(__EXPECTED_VALUE__)
  })
})
```

<details>
<summary>📋 Validation Script</summary>

```bash
FILE_PATH="tests/features/__FEATURE_NAME_KEBAB_CASE__/data/usecases/__PREFIX__-__USE_CASE_NAME_KEBAB__.spec.ts"
echo "🔍 Verifying file creation..."
if [ ! -f "$FILE_PATH" ]; then
  echo "❌ ERROR: File was not created at $FILE_PATH"
  exit 1
fi
echo "✅ File created successfully at $FILE_PATH"

COMMIT_MESSAGE="test(__FEATURE_NAME_KEBAB_CASE__): add __PREFIX__-__USE_CASE_NAME_KEBAB__ test file (TDD Step 1: red phase)"
echo "📦 Staging file..."
git add "$FILE_PATH"
echo "💾 Committing..."
git commit -m "$COMMIT_MESSAGE"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
  exit 1
fi
echo "✅ Committed successfully"
echo "✅ TDD Step 1 completed successfully"
```

</details>

---

### Step 5: TDD Step 2: Create all mock implementations for protocols

**ID:** `create-all-mocks`
**Type:** `create_multiple_files`
**Status:** PENDING

#### References
- **external_pattern**: Following spy pattern for all dependency mocking.
  - Source: context7
  - Query: `spy pattern testing mocks`

#### Files
##### File 1: tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/mock-db-repository.ts
```typescript
import { __ENTITY__Repository, Check__ENTITY__ByEmailRepository } from '@/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols'

/**
 * Mock implementation of __ENTITY__Repository for testing purposes.
 * Implements spy pattern to track method calls and control return values.
 */
export class __ENTITY__RepositorySpy implements __ENTITY__Repository {
  params: __ENTITY__Repository.AddParams
  result = true
  callCount = 0
  paramHistory: __ENTITY__Repository.AddParams[] = []

  async add (data: __ENTITY__Repository.AddParams): Promise<boolean> {
    this.callCount++
    this.params = data
    this.paramHistory.push(data)
    return this.result
  }
}

/**
 * Mock implementation for checking entity existence by email.
 */
export class Check__ENTITY__ByEmailRepositorySpy {
  email: string
  result = false
  callCount = 0
  emailHistory: string[] = []

  async checkByEmail (email: string): Promise<boolean> {
    this.callCount++
    this.email = email
    this.emailHistory.push(email)
    return this.result
  }
}
```

##### File 2: tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/mock-http-client.ts
```typescript
import { HttpClient } from '@/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols'

/**
 * Mock implementation of HttpClient for testing purposes.
 */
export class HttpClientSpy<T = any> implements HttpClient<T> {
  url: string
  method: string
  body?: any
  headers?: Record<string, string>
  response: HttpClient.Result<T> = {
    statusCode: 200,
    body: {} as T
  }
  callCount = 0
  requestHistory: HttpClient.Params[] = []

  async request (data: HttpClient.Params): Promise<HttpClient.Result<T>> {
    this.callCount++
    this.url = data.url
    this.method = data.method
    this.body = data.body
    this.headers = data.headers
    this.requestHistory.push({ ...data })
    return this.response
  }
}
```

##### File 3: tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/mock-cryptography.ts
```typescript
import { Hasher, HashComparer } from '@/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols'

/**
 * Mock implementation of Hasher for testing purposes.
 */
export class HasherSpy implements Hasher {
  digest = 'hashed_password'
  plaintext: string
  callCount = 0
  plaintextHistory: string[] = []

  async hash (plaintext: string): Promise<string> {
    this.callCount++
    this.plaintext = plaintext
    this.plaintextHistory.push(plaintext)
    return this.digest
  }
}

/**
 * Mock implementation of HashComparer for testing purposes.
 */
export class HashComparerSpy implements HashComparer {
  plaintext: string
  digest: string
  result = true
  callCount = 0
  comparisonHistory: Array<{ plaintext: string; digest: string }> = []

  async compare (plaintext: string, digest: string): Promise<boolean> {
    this.callCount++
    this.plaintext = plaintext
    this.digest = digest
    this.comparisonHistory.push({ plaintext, digest })
    return this.result
  }
}
```

##### File 4: tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/mock-cache-storage.ts
```typescript
import { SetStorage, GetStorage } from '@/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols'

/**
 * Mock implementation of SetStorage for testing purposes.
 */
export class SetStorageSpy implements SetStorage {
  key: string
  value: any
  callCount = 0
  setHistory: Array<{ key: string; value: any }> = []

  async set (key: string, value: any): Promise<void> {
    this.callCount++
    this.key = key
    this.value = value
    this.setHistory.push({ key, value })
  }
}

/**
 * Mock implementation of GetStorage for testing purposes.
 */
export class GetStorageSpy implements GetStorage {
  key: string
  value: any = 'cached_value'
  callCount = 0
  getHistory: string[] = []

  async get<T = any> (key: string): Promise<T> {
    this.callCount++
    this.key = key
    this.getHistory.push(key)
    return this.value as T
  }
}
```

##### File 5: tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/index.ts
```typescript
// Export all mock implementations for easy import
export * from './mock-db-repository'
export * from './mock-http-client'
export * from './mock-cryptography'
export * from './mock-cache-storage'
```

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🔍 TDD Step 2: Validating all mock creations..."
MOCK_FILES=(
  "tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/mock-db-repository.ts"
  "tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/mock-http-client.ts"
  "tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/mock-cryptography.ts"
  "tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/mock-cache-storage.ts"
  "tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/index.ts"
)

for file in "${MOCK_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ ERROR: Mock file $file was not created."
    exit 1
  fi
done
echo "✅ All mock files created successfully."

echo "📦 Staging all mock files..."
git add tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/

echo "💾 Committing TDD Step 2..."
git commit -m "test(__FEATURE_NAME_KEBAB_CASE__): add all mock implementations (TDD Step 2: spy pattern)"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
  exit 1
fi
echo "✅ TDD Step 2 completed successfully"
```

</details>

---

### Step 6: TDD Step 3: Create all protocol interfaces

**ID:** `create-all-protocols`
**Type:** `create_multiple_files`
**Status:** PENDING

#### References
- **external_pattern**: Following protocol abstraction patterns.
  - Source: context7
  - Query: `clean architecture protocol interfaces`

#### Files
##### File 1: src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/db/__ENTITY_KEBAB__-repository.ts
```typescript
/**
 * Repository pattern interface for __ENTITY__ data operations.
 * Provides abstraction for database operations.
 */
export interface __ENTITY__Repository {
  add: (data: __ENTITY__Repository.AddParams) => Promise<boolean>
}

export namespace __ENTITY__Repository {
  export type AddParams = {
    name: string
    email: string
    password: string
  }
}

export interface Check__ENTITY__ByEmailRepository {
  checkByEmail: (email: string) => Promise<boolean>
}
```

##### File 2: src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/http/http-client.ts
```typescript
/**
 * HTTP client protocol interface.
 * Provides abstraction for HTTP operations.
 */
export interface HttpClient<R = any> {
  request: (data: HttpClient.Params) => Promise<HttpClient.Result<R>>
}

export namespace HttpClient {
  export type Params = {
    url: string
    method: 'get' | 'post' | 'put' | 'delete'
    body?: any
    headers?: Record<string, string>
  }

  export type Result<T = any> = {
    statusCode: number
    body?: T
  }
}

export enum HttpStatusCode {
  ok = 200,
  noContent = 204,
  badRequest = 400,
  unauthorized = 401,
  forbidden = 403,
  notFound = 404,
  serverError = 500
}
```

##### File 3: src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/cryptography/hasher.ts
```typescript
/**
 * Hasher protocol interface for cryptographic operations.
 */
export interface Hasher {
  hash: (plaintext: string) => Promise<string>
}

/**
 * Hash comparer protocol interface.
 */
export interface HashComparer {
  compare: (plaintext: string, digest: string) => Promise<boolean>
}
```

##### File 4: src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/cache/storage.ts
```typescript
/**
 * Set storage protocol interface for cache operations.
 */
export interface SetStorage {
  set: (key: string, value: any) => Promise<void>
}

/**
 * Get storage protocol interface for cache operations.
 */
export interface GetStorage {
  get: <T = any>(key: string) => Promise<T>
}
```

##### File 5: src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/index.ts
```typescript
// Database protocols
export * from './db/__ENTITY_KEBAB__-repository'

// HTTP protocols
export * from './http/http-client'

// Cryptography protocols
export * from './cryptography/hasher'

// Cache protocols
export * from './cache/storage'
```

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🔍 TDD Step 3: Validating all protocol creations..."
PROTOCOL_FILES=(
  "src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/db/__ENTITY_KEBAB__-repository.ts"
  "src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/http/http-client.ts"
  "src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/cryptography/hasher.ts"
  "src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/cache/storage.ts"
  "src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/index.ts"
)

for file in "${PROTOCOL_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ ERROR: Protocol file $file was not created."
    exit 1
  fi
done
echo "✅ All protocol files created successfully."

echo "📦 Staging all protocol files..."
git add src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/

echo "💾 Committing TDD Step 3..."
git commit -m "feat(__FEATURE_NAME_KEBAB_CASE__): add all protocol interfaces (TDD Step 3: abstractions)"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
  exit 1
fi
echo "✅ TDD Step 3 completed successfully"
```

</details>

---

### Step 7: TDD Step 4: Create __PREFIX____USE_CASE_NAME__ implementation (GREEN PHASE)

**ID:** `create-usecase-__PREFIX__-__USE_CASE_NAME_KEBAB__`
**Type:** `create_file`
**Status:** PENDING

#### References
- **external_pattern**: Following Clean Architecture use case implementation.
  - Source: context7
  - Query: `clean architecture use case implementation`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/data/usecases/__PREFIX__-__USE_CASE_NAME_KEBAB__.ts`

#### Template
```typescript
import type { Add__ENTITY__ } from '@/features/__FEATURE_NAME_KEBAB_CASE__/domain/use-cases'
import { __ENTITY__Repository, Check__ENTITY__ByEmailRepository, Hasher } from '@/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols'

/**
 * Implementation of Add__ENTITY__ use case for data layer.
 * Handles __ENTITY__ creation with password hashing and duplicate email validation.
 * Follows TDD implementation pattern with protocol abstractions.
 */
export class DbAdd__ENTITY__ implements Add__ENTITY__ {
  constructor (
    private readonly hasher: Hasher,
    private readonly add__ENTITY__Repository: __ENTITY__Repository,
    private readonly check__ENTITY__ByEmailRepository: Check__ENTITY__ByEmailRepository
  ) {}

  async add (input: Add__ENTITY__.Params): Promise<Add__ENTITY__.Result> {
    // Step 1: Check if email already exists (business rule)
    const emailExists = await this.check__ENTITY__ByEmailRepository.checkByEmail(input.email)
    if (emailExists) {
      return false
    }

    // Step 2: Hash the password (security requirement)
    const hashedPassword = await this.hasher.hash(input.password)

    // Step 3: Save to repository with hashed password
    const __ENTITY_CAMEL__Data = {
      name: input.name,
      email: input.email,
      password: hashedPassword
    }

    const isAdded = await this.add__ENTITY__Repository.add(__ENTITY_CAMEL__Data)
    return isAdded
  }
}
```

<details>
<summary>📋 Validation Script</summary>

```bash
FILE_PATH="src/features/__FEATURE_NAME_KEBAB_CASE__/data/usecases/__PREFIX__-__USE_CASE_NAME_KEBAB__.ts"
echo "🔍 Verifying file creation..."
if [ ! -f "$FILE_PATH" ]; then
  echo "❌ ERROR: File was not created at $FILE_PATH"
  exit 1
fi
echo "✅ File created successfully at $FILE_PATH"

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

COMMIT_MESSAGE="feat(__FEATURE_NAME_KEBAB_CASE__): implement __PREFIX____USE_CASE_NAME__ use case (TDD Step 4: green phase)"
echo "📦 Staging file..."
git add "$FILE_PATH"
echo "💾 Committing..."
git commit -m "$COMMIT_MESSAGE"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
  exit 1
fi
echo "✅ Committed successfully"
echo "✅ TDD Step 4 completed successfully - Full TDD cycle complete!"
```

</details>

---

### Step 8: Refactor __FILE_TO_MODIFY_PASCAL_CASE__ to incorporate new logic

**ID:** `refactor-__FILE_TO_MODIFY_KEBAB_CASE__`
**Type:** `refactor_file`
**Status:** PENDING

#### References
- **internal_code_analysis**: Refactoring this file because it is a primary consumer of the changed `__SYMBOL__` interface.
  - Source: serena
  - Query: `__SYMBOL_BEING_CHANGED__`

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/data/path/to/__FILE_TO_MODIFY_KEBAB_CASE__.ts`

#### Template
```typescript
<<<REPLACE>>>
// Old code that AI identified to be replaced
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

FILE_PATH="."
COMMIT_MESSAGE="refactor(__FEATURE_NAME_KEBAB_CASE__): update __FILE_TO_MODIFY_KEBAB_CASE__"
echo "📦 Staging file..."
git add "$FILE_PATH"
echo "💾 Committing..."
git commit -m "$COMMIT_MESSAGE"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
  exit 1
fi
echo "✅ Committed successfully"
```

</details>

---

### Step 9: Delete file __FILE_TO_DELETE_PASCAL_CASE__ due to generation error

**ID:** `delete-file-__FILE_TO_DELETE_KEBAB_CASE__`
**Type:** `delete_file`
**Status:** PENDING

#### References
- **internal_correction**: Deleting artifact from failed step.
  - Source: self

**Path:** `src/features/__FEATURE_NAME_KEBAB_CASE__/data/path/to/__FILE_TO_DELETE_KEBAB_CASE__.ts`

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🗑️ Verifying file deletion..."
if [ -f "src/features/__FEATURE_NAME_KEBAB_CASE__/data/path/to/__FILE_TO_DELETE_KEBAB_CASE__.ts" ]; then
  echo "❌ ERROR: File was not deleted."
  exit 1
fi
echo "✅ File successfully deleted."
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

FILE_PATH="."
COMMIT_MESSAGE="chore(__FEATURE_NAME_KEBAB_CASE__): delete broken artifact"
echo "📦 Staging file..."
git add "$FILE_PATH"
echo "💾 Committing..."
git commit -m "$COMMIT_MESSAGE"
if [ $? -ne 0 ]; then
  echo "❌ COMMIT FAILED"
  exit 1
fi
echo "✅ Committed successfully"
```

</details>

---

### Step 10: Create pull request for __FEATURE_NAME_PASCAL_CASE__ data layer implementation

**ID:** `create-pull-request`
**Type:** `pull_request`
**Status:** PENDING

#### References
- **internal_guideline**: Following PR process for data layer integration.
  - Source: GIT_WORKFLOW.md

#### Action
```yaml
{
  target_branch: staging,
  source_branch: feat/__FEATURE_NAME_KEBAB_CASE__-data-layer,
  title: feat(__FEATURE_NAME_KEBAB_CASE__): implement data layer with TDD
}
```

<details>
<summary>📋 Validation Script</summary>

```bash
echo "🚀 Preparing to create pull request for data layer..."

# Push the current branch to remote
echo "📤 Pushing branch to remote..."
git push --set-upstream origin feat/__FEATURE_NAME_KEBAB_CASE__-data-layer
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

Implementation of Data Layer for __FEATURE_NAME_PASCAL_CASE__ feature following strict TDD principles.

### TDD Execution Order Followed:
1. ✅ **Test First** - Created comprehensive test files (.spec.ts)
2. ✅ **Mock/Spy** - Implemented spy pattern for all dependencies
3. ✅ **Protocols** - Created abstract interfaces for external dependencies
4. ✅ **Implementation** - Implemented use cases making tests pass

### Changes included:
- Data layer with use case implementations
- Protocol abstractions for external dependencies
- Comprehensive test coverage with spy pattern
- Feature-based architecture structure

### Architecture Compliance:
- ✅ Clean Architecture principles
- ✅ TDD Red-Green-Refactor cycle
- ✅ Protocol abstractions (no direct external imports)
- ✅ All tests passing
- ✅ Lint checks passed
- ✅ RLHF score: +2 (PERFECT)

### Generated by:
- Template: DATA_TEMPLATE_REFACTORED.yaml
- Date: $(date +%Y-%m-%d)

---
🤖 Generated with spec-kit-clean-architecture"

gh pr create \
  --base staging \
  --head feat/__FEATURE_NAME_KEBAB_CASE__-data-layer \
  --title "feat(__FEATURE_NAME_KEBAB_CASE__): implement data layer with TDD" \
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

### Data Layer Rules

#### Tdd Execution Order
```yaml
{
  1: Generate test files (.spec.ts) - FIRST AND MANDATORY,
  2: Generate mock/spy implementations - SECOND,
  3: Generate protocol interfaces - THIRD,
  4: Generate use case implementations - FOURTH AND LAST
}
```

#### Forbidden Violations
- NEVER generate implementation before tests
- NEVER import external libraries directly
- NEVER skip the spy/mock generation step
- NEVER create protocols without corresponding mocks

#### Allowed
- Use case implementations following domain contracts
- Protocol interfaces for external dependencies
- Mock/Spy implementations for testing
- Data models for transformation (when needed)

#### Forbidden
- Direct imports from axios, fetch, bcrypt, jwt, etc.
- Framework-specific code (React, Express, etc.)
- Business logic in domain layer (that belongs here)
- Implementation before tests (TDD violation)

## Use Case Rules

### ✅ Should
- Implement domain use case interfaces (not define them)
- Have EXACTLY ONE responsibility (one business operation)
- Use dependency injection for all external dependencies
- Abstract external dependencies through protocols
- Handle errors properly and wrap infrastructure errors
- Be framework agnostic (no React, Express, etc.)
- Follow the execute method pattern
- Have comprehensive test coverage

### ❌ Should NOT
- Import external libraries directly (use protocols)
- Contain framework-specific code
- Import from presentation or infrastructure layers
- Execute multiple use cases in one class
- Expose infrastructure implementation details
- Be implemented before tests are written (TDD violation)

## Error Rules

### ✅ Should
- Catch and wrap infrastructure errors appropriately
- Re-throw domain errors without modification
- Convert technical errors to domain errors when appropriate
- Use meaningful error messages for business context
- Log errors appropriately without exposing sensitive data
- Handle protocol failures gracefully

### ❌ Should NOT
- Expose infrastructure error details to domain layer
- Swallow errors silently
- Include sensitive information in error messages
- Throw generic errors without context
- Let infrastructure errors bubble up unchanged
- Include HTTP status codes in domain errors

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

## Protocol Rules

### ✅ Should
- Abstract all external dependencies
- Be categorized by concern (db, http, cache, crypto)
- Have corresponding mock implementations
- Use generic interfaces for flexibility
- Be well documented with JSDoc

### ❌ Should NOT
- Expose implementation details
- Import external libraries
- Contain business logic
- Be specific to one implementation

## Usecase Implementation Rules

### ✅ Should
- Implement domain use case interfaces
- Use dependency injection pattern
- Follow error handling patterns
- Have comprehensive test coverage
- Use execute method as standard

### ❌ Should NOT
- Import external libraries directly
- Contain framework-specific code
- Be tested after implementation
- Skip error scenarios in tests

## Test Rules

### ✅ Should
- Use Spy pattern for dependency mocking
- Test all dependency interactions
- Cover error scenarios with throwError helper
- Use makeSut factory pattern
- Test parameter passing and return values
- Use vitest framework only

### ❌ Should NOT
- Make real external calls
- Use Jest (vitest only)
- Test implementation details
- Skip error scenarios

## Troubleshooting

### Tdd Violations
- CRITICAL: Never create implementation before tests
- If implementation exists before tests: Delete implementation, start over
- TDD Order is non-negotiable: Test → Mock → Protocol → Implementation
- Each step must be committed separately for audit trail

### Protocol Issues
- Ensure all external dependencies are abstracted
- Check that mocks implement the same interface as protocols
- Verify no direct imports from external libraries
- Protocol interfaces should be in correct category folders

### Test Failures
- Verify spy implementations match protocol interfaces
- Check that makeSut factory creates all required dependencies
- Ensure throwError helper is imported correctly
- Validate that test scenarios cover all code paths

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

- STRICT TDD: Always write tests first, implementation last - NO EXCEPTIONS
- Always validate before committing: Run lint first, Run tests second, Only commit if both pass
- If generation fails: Identify the specific error, Fix only that error, Re-run validation, Do NOT proceed until fixed
- Follow the principle: One use case = One file = One responsibility
- Protocol abstraction: All external dependencies MUST be abstracted through interfaces
- If tempted to add "And" in a use case name, split it
- When in doubt: Choose simplicity over complexity, Split rather than combine, Ask for clarification rather than assume
- MUST generate different case styles from the input names (e.g., "Add Item To Cart" becomes: PascalCase=AddItemToCart, kebab-case=add-item-to-cart, lower case=add item to cart).
- MUST replace ALL placeholder variables (like __FEATURE_NAME_KEBAB_CASE__) with actual values
- MUST NOT leave any placeholder variables in the final implementation
- MUST NOT replace any [placeholders] found inside documentation sections like refactoring or recovery
- MUST use vitest, NOT jest
- MUST follow TDD order: Test → Mock → Protocol → Implementation
- MUST follow all data layer rules - protocol abstractions, no external dependencies
- MUST follow all Clean Architecture rules
- MUST use REPLACE/WITH format for refactor_file steps
- MUST use spy pattern for all dependency mocking
- MUST commit each TDD step separately for audit trail

## Evaluation Criteria

**Status:** PENDING

### Review Summary
```
- TDD Execution:
  - Test-first approach: ...
  - Mock/Spy quality: ...
  - Protocol abstractions: ...
- Architecture Compliance:
  - Clean Architecture: ...
  - Dependency rules: ...
```
