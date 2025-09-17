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

**File**: `tests/data/usecases/{prefix}-{use-case-name}.spec.ts`

```typescript
import { {Prefix}{UseCaseName} } from '@/data/usecases'
import { mock{DomainMethod}Params, throwError } from '@/tests/domain/mocks'
import { {DependencySpy1}, {DependencySpy2} } from '@/tests/data/mocks'

type SutTypes = {
  sut: {Prefix}{UseCaseName}
  {dependency1}Spy: {Dependency1}Spy
  {dependency2}Spy: {Dependency2}Spy
}

const makeSut = (): SutTypes => {
  const {dependency1}Spy = new {Dependency1}Spy()
  const {dependency2}Spy = new {Dependency2}Spy()
  const sut = new {Prefix}{UseCaseName}({dependency1}Spy, {dependency2}Spy)
  return {
    sut,
    {dependency1}Spy,
    {dependency2}Spy
  }
}

describe('{Prefix}{UseCaseName} Usecase', () => {
  test('Should call {Dependency1} with correct values', async () => {
    const { sut, {dependency1}Spy } = makeSut()
    const params = mock{DomainMethod}Params()

    await sut.{method}(params)

    expect({dependency1}Spy.{property}).toBe(params.{field})
  })

  test('Should throw if {Dependency1} throws', async () => {
    const { sut, {dependency1}Spy } = makeSut()
    jest.spyOn({dependency1}Spy, '{method}').mockImplementationOnce(throwError)

    const promise = sut.{method}(mock{DomainMethod}Params())

    await expect(promise).rejects.toThrow()
  })

  test('Should return correct value on success', async () => {
    const { sut } = makeSut()

    const result = await sut.{method}(mock{DomainMethod}Params())

    expect(result).toBe({expectedValue})
  })
})
```

### Step 2: Create Mock/Spy Implementations

**File**: `tests/data/mocks/mock-{category}.ts`

```typescript
import { {Protocol} } from '@/data/protocols'
import faker from 'faker'

export class {Protocol}Spy implements {Protocol} {
  // Store call parameters for assertion
  {parameter}: {Type}

  // Control return value for testing
  result = {defaultMockValue}

  async {method} ({parameter}: {Type}): Promise<{ReturnType}> {
    this.{parameter} = {parameter}
    return this.result
  }
}
```

### Step 3: Create Protocol Interfaces

**File**: `src/data/protocols/{category}/{protocol-name}.ts`

```typescript
export interface {ProtocolName} {
  {method}: ({param}: {ParamType}) => Promise<{ReturnType}>
}
```

#### Common Protocol Categories:

##### Database Protocols (`db/`)
```typescript
// Repository pattern
export interface {Entity}Repository {
  add: (data: {Entity}Data) => Promise<boolean>
  loadById: (id: string) => Promise<{Entity}>
  update: (id: string, data: Partial<{Entity}Data>) => Promise<boolean>
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

**File**: `src/data/usecases/{prefix}-{use-case-name}.ts`

```typescript
import { {DomainUseCase} } from '@/domain/usecases'
import { {Protocol1}, {Protocol2} } from '@/data/protocols'

export class {Prefix}{UseCaseName} implements {DomainUseCase} {
  constructor (
    private readonly {dependency1}: {Protocol1},
    private readonly {dependency2}: {Protocol2}
  ) {}

  async {method} (params: {DomainUseCase}.Params): Promise<{DomainUseCase}.Result> {
    // Implementation following test specifications
    const result = await this.{dependency1}.{method}(params)

    // Business logic
    if (!result) {
      throw new Error()
    }

    return result
  }
}

// Namespace for type exports
export namespace {Prefix}{UseCaseName} {
  export type Params = {DomainUseCase}.Params
  export type Result = {DomainUseCase}.Result
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
- Test file: `{prefix}-{use-case-kebab-case}.spec.ts`
- Mock class: `{Protocol}Spy`
- Factory function: `makeSut()`
- Mock data function: `mock{Entity}Params()`

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
async execute (params: Params): Promise<Result> {
  try {
    const result = await this.dependency.method(params)
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
  async execute (params: Params): Promise<Result> {
    // Step 1: Validate
    const exists = await this.checkRepository.check(params.id)
    if (!exists) {
      return false
    }

    // Step 2: Transform
    const hashedData = await this.hasher.hash(params.data)

    // Step 3: Persist
    return await this.saveRepository.save({
      ...params,
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
export const mockEntity = (): Entity => ({
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
    const addAccountParams = mockAddAccountParams()
    await sut.add(addAccountParams)
    expect(hasherSpy.plaintext).toBe(addAccountParams.password)
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
export class DbAddAccount implements AddAccount {
  constructor (
    private readonly hasher: Hasher,
    private readonly addAccountRepository: AddAccountRepository
  ) {}

  async add (accountData: AddAccount.Params): Promise<AddAccount.Result> {
    const hashedPassword = await this.hasher.hash(accountData.password)
    return await this.addAccountRepository.add({
      ...accountData,
      password: hashedPassword
    })
  }
}
```

---

**Remember**: ALWAYS write tests first. The test defines the contract, the implementation fulfills it.