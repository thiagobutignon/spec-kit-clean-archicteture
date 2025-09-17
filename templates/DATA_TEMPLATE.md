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

## Directory Structure

```
src/
├── data/
│   ├── protocols/        # Abstract interfaces for external dependencies
│   │   ├── db/           # Database protocol interfaces
│   │   ├── http/         # HTTP client protocol interfaces
│   │   ├── cache/        # Cache protocol interfaces
│   │   └── cryptography/ # Cryptography protocol interfaces
│   ├── usecases/         # Use case implementations
│   └── models/           # Data-specific models (optional)
tests/
└── data/
    ├── mocks/            # Mock implementations for testing
    └── usecases/         # Use case tests
```

## TDD Steps for Each Use Case

### Step 1: Create Test File FIRST

**File**: `tests/data/usecases/__PREFIX__-__USE_CASE_NAME_KEBAB__.spec.ts`

```typescript
import { __PREFIX____USE_CASE_NAME__ } from '@/data/usecases'
import { mock__DOMAIN_METHOD__Input, throwError } from '@/tests/domain/mocks'
import { __DEPENDENCY_1__Spy, __DEPENDENCY_2__Spy } from '@/tests/data/mocks'

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
    const input = mock__DOMAIN_METHOD__Input()

    await sut.__METHOD__(input)

    expect(__DEPENDENCY_1_CAMEL__Spy.__PROPERTY__).toBe(input.__FIELD__)
  })

  test('Should throw if __DEPENDENCY_1__ throws', async () => {
    const { sut, __DEPENDENCY_1_CAMEL__Spy } = makeSut()
    jest.spyOn(__DEPENDENCY_1_CAMEL__Spy, '__METHOD__').mockImplementationOnce(throwError)

    const promise = sut.__METHOD__(mock__DOMAIN_METHOD__Input())

    await expect(promise).rejects.toThrow()
  })

  test('Should return correct value on success', async () => {
    const { sut } = makeSut()

    const result = await sut.__METHOD__(mock__DOMAIN_METHOD__Input())

    expect(result).toBe(__EXPECTED_VALUE__)
  })
})
```

### Step 2: Create Mock/Spy Implementations

**File**: `tests/data/mocks/mock-__CATEGORY__.ts`

```typescript
import { __PROTOCOL__ } from '@/data/protocols'
import faker from 'faker'

export class __PROTOCOL__Spy implements __PROTOCOL__ {
  // Store call parameters for assertion
  __PARAMETER__: __TYPE__

  // Control return value for testing
  result = __DEFAULT_MOCK_VALUE__

  async __METHOD__ (__PARAMETER__: __TYPE__): Promise<__RETURN_TYPE__> {
    this.__PARAMETER__ = __PARAMETER__
    return this.result
  }
}
```

### Step 3: Create Protocol Interfaces

**File**: `src/data/protocols/__CATEGORY__/__PROTOCOL_NAME_KEBAB__.ts`

```typescript
export interface __PROTOCOL_NAME__ {
  __METHOD__: (__PARAM__: __PARAM_TYPE__) => Promise<__RETURN_TYPE__>
}
```

#### Common Protocol Categories:

##### Database Protocols (`db/`)
```typescript
// Repository pattern
export interface __ENTITY__Repository {
  add: (data: __ENTITY__Data) => Promise<boolean>
  loadById: (id: string) => Promise<__ENTITY__>
  update: (id: string, data: Partial<__ENTITY__Data>) => Promise<boolean>
  delete: (id: string) => Promise<boolean>
}
```

##### HTTP Protocols (`http/`)
```typescript
export interface HttpClient<R = any> {
  request: (data: HttpRequest) => Promise<HttpResponse<R>>
}

export type HttpRequest = {
  url: string
  method: HttpMethod
  body?: any
  headers?: any
}

export type HttpResponse<T = any> = {
  statusCode: HttpStatusCode
  body?: T
}
```

##### Cryptography Protocols (`cryptography/`)
```typescript
export interface Hasher {
  hash: (plaintext: string) => Promise<string>
}

export interface HashComparer {
  compare: (plaintext: string, digest: string) => Promise<boolean>
}

export interface Encrypter {
  encrypt: (plaintext: string) => Promise<string>
}

export interface Decrypter {
  decrypt: (ciphertext: string) => Promise<string>
}
```

##### Cache Protocols (`cache/`)
```typescript
export interface SetStorage {
  set: (key: string, value: object) => void
}

export interface GetStorage {
  get: <T = any>(key: string) => T
}
```

### Step 4: Create Use Case Implementation

**File**: `src/data/usecases/__PREFIX__-__USE_CASE_NAME_KEBAB__.ts`

```typescript
import type { __DOMAIN_USE_CASE__, __DOMAIN_USE_CASE__Input, __DOMAIN_USE_CASE__Output } from '@/domain/usecases'
import { __PROTOCOL_1__, __PROTOCOL_2__ } from '@/data/protocols'

export class __PREFIX____USE_CASE_NAME__ implements __DOMAIN_USE_CASE__ {
  constructor (
    private readonly __DEPENDENCY_1_CAMEL__: __PROTOCOL_1__,
    private readonly __DEPENDENCY_2_CAMEL__: __PROTOCOL_2__
  ) {}

  async __METHOD__ (input: __DOMAIN_USE_CASE__Input): Promise<__DOMAIN_USE_CASE__Output> {
    // Implementation following test specifications
    const result = await this.__DEPENDENCY_1_CAMEL__.__METHOD__(input)

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
export class DbUseCase implements DomainUseCase {
  constructor (
    private readonly repository: Repository,
    private readonly hasher: Hasher
  ) {}
}
```

### Error Handling Pattern
```typescript
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
export class DbUseCase implements DomainUseCase {
  async execute (input: DomainUseCaseInput): Promise<DomainUseCaseOutput> {
    // Step 1: Validate
    const exists = await this.checkRepository.check(input.id)
    if (!exists) {
      return false
    }

    // Step 2: Transform
    const hashedData = await this.hasher.hash(input.data)

    // Step 3: Persist
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
// Mock factory
export const mock__ENTITY__ = (): __ENTITY__ => ({
  id: faker.datatype.uuid(),
  name: faker.name.findName(),
  email: faker.internet.email()
})

// Error helper
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
export class HasherSpy implements Hasher {
  digest = faker.datatype.uuid()
  plaintext: string

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
import type { AddAccount, AddAccountInput, AddAccountOutput } from '@/domain/usecases'
import { Hasher, AddAccountRepository } from '@/data/protocols'

export class DbAddAccount implements AddAccount {
  constructor (
    private readonly hasher: Hasher,
    private readonly addAccountRepository: AddAccountRepository
  ) {}

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