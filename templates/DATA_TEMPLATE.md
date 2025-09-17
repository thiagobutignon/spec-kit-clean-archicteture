# Data Layer Template - Test-Driven Development (TDD)

## Overview

The Data Layer implements the use cases defined in the Domain Layer. This layer contains the business rules implementation and depends on abstract protocols/interfaces for external dependencies.

## ⚠️ CRITICAL: TDD Execution Order

**THIS IS NON-NEGOTIABLE TO PREVENT HALLUCINATIONS:**

1. **FIRST**: Generate test files (`.spec.ts`)
2. **SECOND**: Generate mock/spy implementations
3. **THIRD**: Generate protocol interfaces
4. **FOURTH**: Generate use case implementations

**NEVER generate implementation before tests. Tests define the contract.**

## Architecture Rules

### Data Layer Can Import From:
- ✅ Domain layer (interfaces and types)
- ✅ Data protocols (abstract interfaces)
- ❌ NO direct external library imports
- ❌ NO infrastructure implementations
- ❌ NO presentation layer
- ❌ NO framework-specific code

### Data Layer Exports:
- Use case implementations
- Protocol interfaces
- Data models (when needed)

## Directory Structure (Feature-Based)

```
src/features/__FEATURE_NAME_KEBAB_CASE__/
├── domain/               # Domain layer (interfaces only)
│   ├── errors/
│   ├── use-cases/
│   └── test/
├── data/                 # Data layer (implementations)
│   ├── protocols/        # Abstract interfaces for external dependencies
│   │   ├── db/           # Database protocol interfaces
│   │   ├── http/         # HTTP client protocol interfaces
│   │   ├── cache/        # Cache protocol interfaces
│   │   └── cryptography/ # Cryptography protocol interfaces
│   ├── usecases/         # Use case implementations
│   └── models/           # Data-specific models (optional)
│
tests/features/__FEATURE_NAME_KEBAB_CASE__/
└── data/
    ├── mocks/            # Mock implementations for testing
    └── usecases/         # Use case tests
```

## TDD Steps for Each Use Case

### Step 1: Create Test File FIRST

**File**: `tests/features/__FEATURE_NAME_KEBAB_CASE__/data/usecases/__PREFIX__-__USE_CASE_NAME_KEBAB__.spec.ts`

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

### Step 2: Create Mock/Spy Implementations

**File**: `tests/features/__FEATURE_NAME_KEBAB_CASE__/data/mocks/mock-__CATEGORY__.ts`

```typescript
import { __PROTOCOL__ } from '@/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols'

/**
 * Mock implementation of __PROTOCOL__ for testing purposes.
 * Implements spy pattern to track method calls and control return values.
 */
export class __PROTOCOL__Spy implements __PROTOCOL__ {
  /** Stores the parameter passed to the method for assertion */
  __PARAMETER__: __TYPE__

  /** Controls the return value for testing different scenarios */
  result = __DEFAULT_MOCK_VALUE__

  /**
   * Mock implementation of the __METHOD__ method.
   * @param __PARAMETER__ - The parameter to be processed
   * @returns Promise resolving to the controlled test result
   */
  async __METHOD__ (__PARAMETER__: __TYPE__): Promise<__RETURN_TYPE__> {
    this.__PARAMETER__ = __PARAMETER__
    return this.result
  }
}
```

### Step 3: Create Protocol Interfaces

**File**: `src/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols/__CATEGORY__/__PROTOCOL_NAME_KEBAB__.ts`

```typescript
/**
 * Protocol interface for __PROTOCOL_NAME__ operations.
 * Defines the contract for external dependency implementations.
 */
export interface __PROTOCOL_NAME__ {
  /**
   * __METHOD__ operation.
   * @param __PARAM__ - The input parameter for the operation
   * @returns Promise resolving to __RETURN_TYPE__
   */
  __METHOD__: (__PARAM__: __PARAM_TYPE__) => Promise<__RETURN_TYPE__>
}
```

#### Common Protocol Categories:

##### Database Protocols (`db/`)
```typescript
/**
 * Repository pattern interface for __ENTITY__ data operations.
 * Provides abstraction for database operations.
 */
export interface __ENTITY__Repository {
  /**
   * Adds a new __ENTITY__ to the repository.
   * @param data - The __ENTITY__ data to be added
   * @returns Promise resolving to true if successful
   */
  add: (data: __ENTITY__Data) => Promise<boolean>

  /**
   * Loads an __ENTITY__ by its unique identifier.
   * @param id - The unique identifier of the __ENTITY__
   * @returns Promise resolving to the __ENTITY__ if found
   */
  loadById: (id: string) => Promise<__ENTITY__>

  /**
   * Updates an existing __ENTITY__ with partial data.
   * @param id - The unique identifier of the __ENTITY__
   * @param data - The partial data to update
   * @returns Promise resolving to true if successful
   */
  update: (id: string, data: Partial<__ENTITY__Data>) => Promise<boolean>

  /**
   * Deletes an __ENTITY__ from the repository.
   * @param id - The unique identifier of the __ENTITY__
   * @returns Promise resolving to true if successful
   */
  delete: (id: string) => Promise<boolean>
}
```

##### HTTP Protocols (`http/`)
```typescript
/**
 * HTTP client interface for making HTTP requests.
 * @template R - The expected response body type
 */
export interface HttpClient<R = any> {
  /**
   * Performs an HTTP request.
   * @param data - The request configuration
   * @returns Promise resolving to the HTTP response
   */
  request: (data: HttpRequest) => Promise<HttpResponse<R>>
}

/**
 * HTTP request configuration.
 */
export type HttpRequest = {
  /** The URL to send the request to */
  url: string
  /** The HTTP method to use */
  method: HttpMethod
  /** The request body (optional) */
  body?: any
  /** The request headers (optional) */
  headers?: any
}

/**
 * HTTP response structure.
 * @template T - The response body type
 */
export type HttpResponse<T = any> = {
  /** The HTTP status code */
  statusCode: HttpStatusCode
  /** The response body (optional) */
  body?: T
}
```

##### Cryptography Protocols (`cryptography/`)
```typescript
/**
 * Interface for hashing operations.
 * Used for one-way encryption of sensitive data like passwords.
 */
export interface Hasher {
  /**
   * Hashes a plaintext string.
   * @param plaintext - The string to be hashed
   * @returns Promise resolving to the hashed string
   */
  hash: (plaintext: string) => Promise<string>
}

/**
 * Interface for comparing hashed values.
 * Used for password verification.
 */
export interface HashComparer {
  /**
   * Compares a plaintext string with a hash.
   * @param plaintext - The plaintext string to compare
   * @param digest - The hashed string to compare against
   * @returns Promise resolving to true if they match
   */
  compare: (plaintext: string, digest: string) => Promise<boolean>
}

/**
 * Interface for encryption operations.
 * Used for two-way encryption of data.
 */
export interface Encrypter {
  /**
   * Encrypts a plaintext string.
   * @param plaintext - The string to be encrypted
   * @returns Promise resolving to the encrypted string
   */
  encrypt: (plaintext: string) => Promise<string>
}

/**
 * Interface for decryption operations.
 * Used for decrypting encrypted data.
 */
export interface Decrypter {
  /**
   * Decrypts an encrypted string.
   * @param ciphertext - The encrypted string to decrypt
   * @returns Promise resolving to the decrypted plaintext
   */
  decrypt: (ciphertext: string) => Promise<string>
}
```

##### Cache Protocols (`cache/`)
```typescript
/**
 * Interface for setting values in storage.
 * Used for caching and local storage operations.
 */
export interface SetStorage {
  /**
   * Sets a value in storage.
   * @param key - The storage key
   * @param value - The value to store
   */
  set: (key: string, value: object) => void
}

/**
 * Interface for retrieving values from storage.
 * Used for caching and local storage operations.
 */
export interface GetStorage {
  /**
   * Gets a value from storage.
   * @template T - The expected type of the stored value
   * @param key - The storage key
   * @returns The stored value
   */
  get: <T = any>(key: string) => T
}
```

### Step 4: Create Use Case Implementation

**File**: `src/features/__FEATURE_NAME_KEBAB_CASE__/data/usecases/__PREFIX__-__USE_CASE_NAME_KEBAB__.ts`

```typescript
import type { __DOMAIN_USE_CASE__, __DOMAIN_USE_CASE__Input, __DOMAIN_USE_CASE__Output } from '@/features/__FEATURE_NAME_KEBAB_CASE__/domain/use-cases'
import { __PROTOCOL_1__, __PROTOCOL_2__ } from '@/features/__FEATURE_NAME_KEBAB_CASE__/data/protocols'

/**
 * Implementation of __DOMAIN_USE_CASE__ use case.
 * Handles __USE_CASE_DESCRIPTION__.
 */
export class __PREFIX____USE_CASE_NAME__ implements __DOMAIN_USE_CASE__ {
  /**
   * Creates an instance of __PREFIX____USE_CASE_NAME__.
   * @param __DEPENDENCY_1_CAMEL__ - Protocol for __DEPENDENCY_1_DESCRIPTION__
   * @param __DEPENDENCY_2_CAMEL__ - Protocol for __DEPENDENCY_2_DESCRIPTION__
   */
  constructor (
    private readonly __DEPENDENCY_1_CAMEL__: __PROTOCOL_1__,
    private readonly __DEPENDENCY_2_CAMEL__: __PROTOCOL_2__
  ) {}

  /**
   * Executes the use case.
   * @param input - The input data for the use case
   * @returns Promise resolving to the use case output
   * @throws {Error} When __ERROR_CONDITION__
   */
  async execute (input: __DOMAIN_USE_CASE__Input): Promise<__DOMAIN_USE_CASE__Output> {
    // Implementation following test specifications
    const result = await this.__DEPENDENCY_1_CAMEL__.__DEPENDENCY_METHOD__(input)

    // Business logic
    if (!result) {
      throw new Error()
    }

    return result
  }
}
```

## Naming Conventions

### Prefixes by Context

#### Backend Services
- **Db** prefix for database operations
  - `DbAddAccount`
  - `DbAuthentication`
  - `DbLoadSurveys`

#### Frontend/API Clients
- **Remote** prefix for HTTP operations
  - `RemoteAuthentication`
  - `RemoteLoadSurveyList`
  - `RemoteSaveSurveyResult`

#### Local Storage Operations
- **Local** prefix for cache/storage
  - `LocalSaveAccessToken`
  - `LocalLoadCurrentAccount`

### Test Naming
- Test file: `__PREFIX__-__USE_CASE_KEBAB_CASE__.spec.ts`
- Mock class: `__PROTOCOL__Spy`
- Factory function: `makeSut()`
- Mock data function: `mock__ENTITY__Input()`

## Common Patterns

### Dependency Injection Pattern
```typescript
/**
 * Database use case implementation following dependency injection pattern.
 */
export class DbUseCase implements DomainUseCase {
  /**
   * Creates an instance with injected dependencies.
   * @param repository - The repository for data persistence
   * @param hasher - The hasher for password encryption
   */
  constructor (
    private readonly repository: Repository,
    private readonly hasher: Hasher
  ) {}
}
```

### Error Handling Pattern
```typescript
/**
 * Executes the use case with proper error handling.
 * @param input - The use case input
 * @returns Promise resolving to the use case output
 * @throws {CustomError} When the operation fails
 * @throws {DomainError} When domain rules are violated
 * @throws {UnexpectedError} When infrastructure errors occur
 */
async execute (input: DomainUseCaseInput): Promise<DomainUseCaseOutput> {
  try {
    const result = await this.dependency.method(input)
    if (!result) {
      throw new CustomError()
    }
    return result
  } catch (error) {
    // Re-throw domain errors
    if (error instanceof DomainError) {
      throw error
    }
    // Wrap infrastructure errors
    throw new UnexpectedError()
  }
}
```

### Composite Pattern
```typescript
/**
 * Composite use case implementation with multiple steps.
 */
export class DbUseCase implements DomainUseCase {
  /**
   * Executes the use case with validation, transformation, and persistence.
   * @param input - The use case input
   * @returns Promise resolving to true if successful, false otherwise
   */
  async execute (input: DomainUseCaseInput): Promise<DomainUseCaseOutput> {
    // Step 1: Validate existence
    const exists = await this.checkRepository.check(input.id)
    if (!exists) {
      return false
    }

    // Step 2: Transform data
    const hashedData = await this.hasher.hash(input.data)

    // Step 3: Persist to database
    return await this.saveRepository.save({
      ...input,
      data: hashedData
    })
  }
}
```

## Testing Guidelines

### Test Structure
1. **Arrange**: Setup test data and mocks
2. **Act**: Execute the method under test
3. **Assert**: Verify the behavior

### What to Test
- ✅ Correct parameters passed to dependencies
- ✅ Correct order of dependency calls
- ✅ Return values
- ✅ Error propagation
- ✅ Edge cases and boundaries
- ✅ Conditional logic branches

### Test Helpers
```typescript
/**
 * Factory function for creating mock __ENTITY__ objects.
 * @returns A mock __ENTITY__ with test data
 */
export const mock__ENTITY__ = (): __ENTITY__ => ({
  id: 'any_id',
  name: 'any_name',
  email: 'any_email@mail.com'
})

/**
 * Helper function that throws an error for testing error scenarios.
 * @throws {Error} Always throws a generic error
 */
export const throwError = (): never => {
  throw new Error()
}
```

## Anti-Patterns to Avoid

❌ **Direct library imports**
```typescript
// WRONG
import axios from 'axios'
import bcrypt from 'bcrypt'
```

❌ **Business logic in domain layer**
```typescript
// WRONG - Domain should only have interfaces
export class AddAccount {
  async add(data) {
    // Implementation here
  }
}
```

❌ **Tight coupling**
```typescript
// WRONG
import { MongoRepository } from '@/infra/db/mongodb'
```

❌ **Missing error handling**
```typescript
// WRONG
async execute(params) {
  return await this.repository.save(params)
}
```

❌ **Writing implementation before tests**
```typescript
// WRONG - Always write tests first!
export class Implementation {
  // Code written before tests
}
```

## Quality Checklist

Before considering a use case complete:

- [ ] Test file created FIRST with full coverage
- [ ] All dependencies are mocked with Spy pattern
- [ ] Protocol interfaces defined
- [ ] Implementation passes all tests
- [ ] No direct external dependencies
- [ ] Error scenarios handled
- [ ] Namespace exports for types
- [ ] Follows naming conventions
- [ ] makeSut() factory in tests
- [ ] throwError scenarios tested

## RLHF Score Impact

Following this template correctly will result in:
- **+2 PERFECT**: TDD followed, all patterns applied, complete test coverage
- **+1 GOOD**: Implementation works but missing some test scenarios
- **0 LOW CONFIDENCE**: Tests written after implementation
- **-1 RUNTIME ERROR**: Tests failing or implementation before tests
- **-2 CATASTROPHIC**: No tests or direct dependency imports

## Example: Complete Use Case Implementation

### 1. Test First (db-add-account.spec.ts)
```typescript
describe('DbAddAccount Usecase', () => {
  test('Should call Hasher with correct plaintext', async () => {
    const { sut, hasherSpy } = makeSut()
    const addAccountInput = mockAddAccountInput()
    await sut.execute(addAccountInput)
    expect(hasherSpy.plaintext).toBe(addAccountInput.password)
  })
})
```

### 2. Mock Implementation (mock-cryptography.ts)
```typescript
/**
 * Spy implementation of Hasher for testing.
 * Tracks method calls and controls return values.
 */
export class HasherSpy implements Hasher {
  /** The controlled hash result for testing */
  digest = 'hashed_password'
  /** Stores the plaintext passed to hash method */
  plaintext: string

  /**
   * Mock hash implementation.
   * @param plaintext - The string to hash
   * @returns Promise resolving to the controlled digest
   */
  async hash (plaintext: string): Promise<string> {
    this.plaintext = plaintext
    return this.digest
  }
}
```

### 3. Protocol Interface (hasher.ts)
```typescript
export interface Hasher {
  hash: (plaintext: string) => Promise<string>
}
```

### 4. Implementation (db-add-account.ts)
```typescript
import type { AddAccount, AddAccountInput, AddAccountOutput } from '@/features/user-registration/domain/use-cases'
import { Hasher, AddAccountRepository } from '@/features/user-registration/data/protocols'

/**
 * Database implementation of AddAccount use case.
 * Handles user registration with password hashing.
 */
export class DbAddAccount implements AddAccount {
  /**
   * Creates an instance of DbAddAccount.
   * @param hasher - The hasher for password encryption
   * @param addAccountRepository - The repository for persisting accounts
   */
  constructor (
    private readonly hasher: Hasher,
    private readonly addAccountRepository: AddAccountRepository
  ) {}

  /**
   * Executes the account creation process.
   * @param input - The account data to create
   * @returns Promise resolving to the created account
   */
  async execute (input: AddAccountInput): Promise<AddAccountOutput> {
    const hashedPassword = await this.hasher.hash(input.password)
    return await this.addAccountRepository.add({
      ...input,
      password: hashedPassword
    })
  }
}
```

---

**Remember**: ALWAYS write tests first. The test defines the contract, the implementation fulfills it.