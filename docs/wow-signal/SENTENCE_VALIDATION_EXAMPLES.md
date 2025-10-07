# Architectural Sentence Validation
## Grammatical Analysis of Code Examples

This document demonstrates how to validate "architectural sentences" using grammatical analysis, treating code as language constructs.

---

## Sentence 1: Domain Entity

### Code
```typescript
// src/domain/models/account.ts
export type AccountModel = {
  id: string
  name: string
  email: string
  password: string
}
```

### Grammatical Analysis

**Part of Speech**: NOUN (entity)

**Sentence Structure**:
```
AccountModel = {
  properties...
}
```

**Linguistic Role**: Proper noun definition (subject/object in sentences)

**Validation**:
- ✅ Named with "Model" suffix (grammatical marker)
- ✅ Contains only data (nouns don't act)
- ✅ No methods (behavior belongs to verbs)
- ✅ Located in domain layer (core vocabulary)

**Grammar Rule**: DOM-000 (Model definition)

**Is this grammatically correct?** ✅ YES

**Why**: Properly defined noun in domain vocabulary. Pure data structure with no behavior.

---

## Sentence 2: UseCase Contract

### Code
```typescript
// src/domain/usecases/add-account.ts
export interface AddAccount {
  add: (account: AddAccount.Params) => Promise<AddAccount.Result>
}

export namespace AddAccount {
  export type Params = {
    name: string
    email: string
    password: string
  }
  export type Result = boolean
}
```

### Grammatical Analysis

**Part of Speech**: TRANSITIVE VERB (action requiring object)

**Sentence Structure**:
```
Verb: add
Direct Object: AddAccount.Params
Predicate: AddAccount.Result
```

**English Parallel**:
```
Infinitive: "To add"
Object: "an account (with name, email, password)"
Result: "successfully (boolean)"

Complete: "To add an account → results in success/failure"
```

**Validation**:
- ✅ Has interface (verb signature)
- ✅ Has namespace (parameter definition)
- ✅ Params defined (direct object)
- ✅ Result defined (predicate)
- ✅ Method uses namespace types (grammatical agreement)

**Grammar Rule**: DOM-001 (UseCase Contract Completeness)

**Is this grammatically correct?** ✅ YES

**Why**: Complete transitive verb definition with explicit direct object and predicate. Like a dictionary entry defining a verb completely.

---

## Sentence 3: Incomplete UseCase (Violation)

### Code
```typescript
// ❌ VIOLATION
export interface CreateBooking {
  create: (date: Date) => Promise<void>
}

// Missing namespace!
```

### Grammatical Analysis

**Part of Speech**: INCOMPLETE TRANSITIVE VERB

**Sentence Structure**:
```
Verb: create
Direct Object: ??? (date is a parameter, not structured object)
Predicate: void (no meaningful result)
```

**English Parallel**:
```
Incomplete: "To create... what?"
Missing object specification
No defined outcome
```

**Validation**:
- ✅ Has interface
- ❌ Missing namespace
- ❌ No Params type (loose parameters)
- ❌ No Result type (void is not semantic)
- ❌ Parameters not in namespace

**Grammar Rule**: Violates DOM-001

**Error Message**:
```
Grammar Error: Incomplete verb definition
Explanation: Transitive verb is missing direct object specification.
A complete verb requires:
  1. Action signature (interface) ✅
  2. Direct object (Params) ❌
  3. Predicate (Result) ❌

Suggestion:
export namespace CreateBooking {
  export type Params = {
    date: Date
    // other booking properties
  }
  export type Result = {
    bookingId: string
    status: string
  }
}
```

**Is this grammatically correct?** ❌ NO

**Why**: Incomplete sentence - like saying "I ate" without specifying what was eaten. The verb needs a complete structure.

---

## Sentence 4: Active Voice Implementation

### Code
```typescript
// src/data/usecases/db-add-account.ts
export class DbAddAccount implements AddAccount {
  constructor(
    private readonly hasher: Hasher,
    private readonly addAccountRepository: AddAccountRepository,
    private readonly checkAccountByEmailRepository: CheckAccountByEmailRepository
  ) {}

  async add(accountData: AddAccount.Params): Promise<AddAccount.Result> {
    const exists = await this.checkAccountByEmailRepository.checkByEmail(accountData.email)
    if (exists) return false

    const hashedPassword = await this.hasher.hash(accountData.password)
    const isValid = await this.addAccountRepository.add({
      ...accountData,
      password: hashedPassword
    })
    return isValid
  }
}
```

### Grammatical Analysis

**Part of Speech**: ACTIVE SENTENCE (subject performs verb)

**Sentence Structure**:
```
Subject: DbAddAccount (the system/actor)
Verb: add (action)
Object: accountData (what is being acted upon)
Adverbial phrases:
  - "using hasher" (securely)
  - "via repository" (persistently)
  - "checking email" (cautiously)

Complete sentence:
"DbAddAccount adds account securely via repository after checking email"
```

**English Parallel**:
```
Active voice: "The system adds the account"
Adverbs: "securely" (hasher), "persistently" (repository)
Complete thought with subject, verb, object, manner
```

**Validation**:
- ✅ Implements domain interface (subject fulfills verb contract)
- ✅ Constructor takes protocols (abstract dependencies)
- ✅ No concrete dependencies (depends on "manner" not specific "tool")
- ✅ Method signature matches contract exactly
- ✅ Uses Params and Result types
- ✅ No infrastructure imports (grammatical independence)

**Grammar Rule**: DATA-001 (Implementation Pattern)

**Is this grammatically correct?** ✅ YES

**Why**: Proper active voice sentence. Subject (DbAddAccount) performs action (add) using abstract tools (protocols). Dependencies are abstract adverbs, not concrete implementations.

---

## Sentence 5: Concrete Dependency (Violation)

### Code
```typescript
// ❌ VIOLATION
export class DbAddAccount implements AddAccount {
  constructor(
    private readonly bcrypt: BcryptAdapter,  // ❌ Concrete!
    private readonly mongo: AccountMongoRepository  // ❌ Concrete!
  ) {}

  async add(params: AddAccount.Params): Promise<AddAccount.Result> {
    const hashed = await this.bcrypt.hash(params.password)
    await this.mongo.insert({ ...params, password: hashed })
    return true
  }
}
```

### Grammatical Analysis

**Part of Speech**: SENTENCE WITH HARDCODED ADVERBS

**Sentence Structure**:
```
Subject: DbAddAccount
Verb: add
Adverbs: "using bcrypt" (HARDCODED), "via MongoDB" (HARDCODED)
```

**English Parallel**:
```
Wrong: "To run" is defined as "to run quickly"
Problem: Verb definition is too specific
Cannot later "run slowly" without changing verb definition
```

**Validation**:
- ✅ Implements interface
- ❌ Depends on BcryptAdapter (concrete class)
- ❌ Depends on AccountMongoRepository (concrete class)
- ❌ Cannot swap implementations
- ❌ Tight coupling to specific "manner"

**Grammar Rule**: Violates DATA-001 (Dependency Inversion)

**Error Message**:
```
Grammar Error: Concrete dependency in verb implementation
Explanation: Verb implementation depends on concrete adverb instead of abstract protocol.

Like defining:
  "To add" as "to add using bcrypt and MongoDB"

Problem: The verb is now tied to specific manner of execution.

Should be:
  "To add" using "some hasher" and "some repository"

Suggestion:
constructor(
  private readonly hasher: Hasher,  // Abstract
  private readonly repository: AddAccountRepository  // Abstract
) {}
```

**Is this grammatically correct?** ❌ NO

**Why**: Verb implementation is coupled to specific adverbs. Should depend on abstract "manner" (protocols), not concrete tools.

---

## Sentence 6: Domain Depending on Infrastructure (Violation)

### Code
```typescript
// ❌ VIOLATION: src/domain/usecases/add-user.ts
import { MongoRepository } from '@/infra/db/mongodb'  // ❌ Wrong direction!

export interface AddUser {
  add: (user: AddUser.Params) => Promise<AddUser.Result>
}
```

### Grammatical Analysis

**Part of Speech**: NOUN DEPENDING ON ADVERB (impossible)

**Sentence Structure**:
```
Domain (verb definition) → Infrastructure (concrete tool)
Like: Dictionary definition → Specific accent
```

**English Parallel**:
```
Wrong: The definition of "run" in the dictionary depends on "Nike shoes"
Problem: Abstract concept depending on concrete implementation
Correct: Definition is independent; implementations use it
```

**Validation**:
- ✅ Has interface
- ❌ Imports from infrastructure
- ❌ Domain depends on outer layer
- ❌ Core grammar depends on implementation

**Grammar Rule**: Violates DEP-001 (Domain Independence)

**Error Message**:
```
Grammar Error: Domain depends on Infrastructure
Explanation: Core grammar (nouns and verb definitions) cannot depend on
concrete implementations (adverbs).

Dependency direction:
  Domain ← Data ← Infrastructure  (CORRECT)
  Domain → Infrastructure  (WRONG!)

Like: Dictionary definition depending on specific accent - backwards!

Suggestion: Remove import from infrastructure. Domain should be
completely independent.
```

**Is this grammatically correct?** ❌ NO

**Why**: Grammatical direction violation. Core vocabulary cannot depend on implementation details. Like a dictionary entry depending on a regional accent.

---

## Sentence 7: Controller with Business Logic (Violation)

### Code
```typescript
// ❌ VIOLATION
export class SignUpController implements Controller {
  constructor(private readonly db: MongoDB) {}  // Also wrong!

  async handle(request: SignUpController.Request): Promise<HttpResponse> {
    // ❌ Business logic in controller!
    if (!request.email.includes('@')) {
      return badRequest(new Error('Invalid email'))
    }

    // ❌ Direct hashing in controller!
    const hashedPassword = await bcrypt.hash(request.password, 12)

    // ❌ Direct database access!
    await this.db.collection('users').insertOne({
      name: request.name,
      email: request.email,
      password: hashedPassword
    })

    return ok({ message: 'User created' })
  }
}
```

### Grammatical Analysis

**Part of Speech**: CONTEXT CONTAINING VERB LOGIC (wrong layer)

**Sentence Structure**:
```
Context (controller) performs:
  - Validation (should be separate)
  - Hashing (should be in use case)
  - Database access (should be via repository)

Like: An envelope containing the letter AND writing the letter
```

**English Parallel**:
```
Wrong: "To mail" includes writing the letter, sealing it, and delivering it
Problem: Context (mailing) is doing the work (writing, sealing)
Correct: Context delivers pre-written letter
```

**Validation**:
- ✅ Implements Controller
- ❌ Has validation logic (should use Validation)
- ❌ Has hashing logic (should be in use case)
- ❌ Has database logic (should be via repository)
- ❌ Depends on infrastructure (MongoDB)
- ❌ Too many responsibilities (God Object)

**Grammar Rule**: Violates PRES-001 and PRES-002

**Error Message**:
```
Grammar Error: Context contains business logic
Explanation: Controller (context) should only orchestrate use cases,
not execute business logic.

Violations:
1. Email validation in controller → Use Validation layer
2. Password hashing in controller → Move to AddAccount use case
3. Direct DB access → Use repository via use case
4. Depends on MongoDB → Should depend on domain use cases

Like: A delivery person writing the letter they're delivering.
Wrong level of responsibility!

Suggestion:
export class SignUpController implements Controller {
  constructor(
    private readonly addAccount: AddAccount,
    private readonly validation: Validation
  ) {}

  async handle(request: SignUpController.Request): Promise<HttpResponse> {
    const error = this.validation.validate(request)
    if (error) return badRequest(error)

    const result = await this.addAccount.add(request)
    return ok(result)
  }
}
```

**Is this grammatically correct?** ❌ NO

**Why**: Context (controller) contains verb logic (business rules) and adverbs (infrastructure). Should only orchestrate, not execute.

---

## Sentence 8: Proper Factory Composition

### Code
```typescript
// src/main/factories/usecases/add-account-factory.ts
export const makeDbAddAccount = (): AddAccount => {
  const salt = 12
  const bcryptAdapter = new BcryptAdapter(salt)
  const accountMongoRepository = new AccountMongoRepository()
  return new DbAddAccount(
    bcryptAdapter,
    accountMongoRepository,
    accountMongoRepository
  )
}
```

### Grammatical Analysis

**Part of Speech**: SENTENCE COMPOSER (assembles complete thought)

**Sentence Structure**:
```
Composer: makeDbAddAccount
Returns: AddAccount (abstract interface)
Assembles:
  - Subject: DbAddAccount
  - Adverb 1: BcryptAdapter (securely)
  - Adverb 2: AccountMongoRepository (persistently)

Complete sentence: "Add account securely via MongoDB"
```

**English Parallel**:
```
Factory = Sentence builder
Takes individual words (dependencies) and assembles grammatically correct sentence

Input: Subject, verb, adverbs
Output: Complete, executable sentence
```

**Validation**:
- ✅ Named with "make" prefix
- ✅ Returns interface (AddAccount)
- ✅ Instantiates concrete implementation
- ✅ Injects all dependencies
- ✅ Hides implementation details
- ✅ Complete composition

**Grammar Rule**: MAIN-001 (Factory Pattern)

**Is this grammatically correct?** ✅ YES

**Why**: Proper sentence composition. Assembles all parts (subject, verb, adverbs) into complete thought while exposing only the abstract interface. Like a sentence builder that knows grammar rules.

---

## Sentence 9: Circular Dependency (Unparseable)

### Code
```typescript
// ❌ VIOLATION: Circular dependency

// user-service.ts
export class UserService {
  constructor(private orderService: OrderService) {}

  getUser(id: string) {
    const orders = this.orderService.getUserOrders(id)
    return { user, orders }
  }
}

// order-service.ts
export class OrderService {
  constructor(private userService: UserService) {}

  getUserOrders(userId: string) {
    const user = this.userService.getUser(userId)  // ❌ Circular!
    return user.orders
  }
}
```

### Grammatical Analysis

**Part of Speech**: CIRCULAR DEFINITION (unparseable)

**Sentence Structure**:
```
UserService → OrderService
OrderService → UserService
Infinite loop!
```

**English Parallel**:
```
Wrong: "A bachelor is an unmarried man"
       "An unmarried man is a bachelor"

Problem: Circular definition - no foundational meaning
Cannot parse: Where do you start?
```

**Validation**:
- ❌ Circular dependency detected
- ❌ No dependency hierarchy
- ❌ Cannot instantiate (chicken and egg)
- ❌ Unparseable grammar

**Grammar Rule**: Violates DEP-003 (No Circular Dependencies)

**Error Message**:
```
Grammar Error: Circular dependency
Explanation: Circular dependencies create unparseable grammar, like
circular definitions in a dictionary.

Circular path:
  UserService → OrderService → UserService

Like defining:
  "A = B" and "B = A"
No foundational meaning!

Suggestion: Break the cycle by introducing a third concept or reversing dependency:
  UserService ← OrderService
  (OrderService depends on User, not vice versa)
```

**Is this grammatically correct?** ❌ NO

**Why**: Unparseable. Circular dependencies are like circular definitions - there's no foundation to build upon.

---

## Sentence 10: Complete Valid Architecture

### Code
```typescript
// Domain: Verb contract
export interface SaveSurveyResult {
  save: (params: SaveSurveyResult.Params) => Promise<SaveSurveyResult.Result>
}

export namespace SaveSurveyResult {
  export type Params = {
    surveyId: string
    accountId: string
    answer: string
    date: Date
  }
  export type Result = SurveyResultModel
}

// Data: Protocol
export interface SaveSurveyResultRepository {
  save: (data: SaveSurveyResultRepository.Params) => Promise<void>
}

// Data: Implementation
export class DbSaveSurveyResult implements SaveSurveyResult {
  constructor(
    private readonly saveSurveyResultRepository: SaveSurveyResultRepository,
    private readonly loadSurveyResultRepository: LoadSurveyResultRepository
  ) {}

  async save(params: SaveSurveyResult.Params): Promise<SaveSurveyResult.Result> {
    await this.saveSurveyResultRepository.save(params)
    const surveyResult = await this.loadSurveyResultRepository.loadBySurveyId(params.surveyId)
    return surveyResult
  }
}

// Infrastructure: Adapter
export class SurveyResultMongoRepository implements SaveSurveyResultRepository {
  async save(data: SaveSurveyResultRepository.Params): Promise<void> {
    const collection = MongoHelper.getCollection('surveyResults')
    await collection.insertOne(data)
  }
}

// Presentation: Controller
export class SaveSurveyResultController implements Controller {
  constructor(
    private readonly saveSurveyResult: SaveSurveyResult
  ) {}

  async handle(request: SaveSurveyResultController.Request): Promise<HttpResponse> {
    const result = await this.saveSurveyResult.save(request)
    return ok(result)
  }
}

// Main: Factory
export const makeDbSaveSurveyResult = (): SaveSurveyResult => {
  const repository = new SurveyResultMongoRepository()
  return new DbSaveSurveyResult(repository, repository)
}
```

### Grammatical Analysis

**Complete Architectural Sentence**:

```
Sentence: "The system saves survey results persistently via MongoDB for HTTP clients"

Components:
- Verb: SaveSurveyResult (domain contract)
- Subject: DbSaveSurveyResult (implementation)
- Adverb (abstract): SaveSurveyResultRepository (protocol)
- Adverb (concrete): SurveyResultMongoRepository (MongoDB-specific)
- Context: SaveSurveyResultController (HTTP delivery)
- Composer: makeDbSaveSurveyResult (assembles all parts)

Dependency Flow:
  Domain ← Data ← Infrastructure
  Presentation → Domain
  Main → All
```

**English Parallel**:
```
Complete sentence with all parts:
- Subject: "The system" (DbSaveSurveyResult)
- Verb: "saves" (SaveSurveyResult)
- Object: "survey results" (Params)
- Adverb: "persistently" (Repository)
- Manner: "via MongoDB" (MongoRepository)
- Context: "for HTTP clients" (Controller)
- Result: "successfully" (Result)
```

**Validation**:
- ✅ Domain contract complete (interface + namespace)
- ✅ Implementation depends on abstractions
- ✅ Infrastructure implements protocols
- ✅ Controller orchestrates (no business logic)
- ✅ Factory assembles properly
- ✅ Dependency direction correct
- ✅ No circular dependencies
- ✅ All layers separated

**Grammar Rules**: Follows ALL patterns
- DOM-001 ✅
- DATA-001 ✅
- INFRA-001 ✅
- PRES-001 ✅
- MAIN-001 ✅

**Is this grammatically correct?** ✅ YES

**Why**: Complete, grammatically correct architectural sentence. All parts present, properly structured, following all grammar rules. Dependencies flow correctly. Each layer has proper role. Like a perfectly constructed English sentence with subject, verb, object, adverbs, and proper punctuation.

---

## Summary: Grammar Validation Checklist

When reviewing code, ask these grammatical questions:

### 1. Is this a complete sentence?
- [ ] Does use case have interface AND namespace?
- [ ] Are Params and Result defined?
- [ ] Does implementation fulfill the contract?

### 2. Are parts of speech correct?
- [ ] Domain = Nouns and Verbs (definitions)
- [ ] Data = Active sentences (implementations)
- [ ] Infrastructure = Concrete adverbs (specific tools)
- [ ] Presentation = Context (delivery)

### 3. Do dependencies flow correctly?
- [ ] Domain doesn't depend on anything
- [ ] Data depends on Domain
- [ ] Infrastructure depends on Data protocols
- [ ] Presentation depends on Domain
- [ ] No circular dependencies

### 4. Is each layer doing its job?
- [ ] Domain: Defines vocabulary
- [ ] Data: Implements business logic
- [ ] Infrastructure: Provides tools
- [ ] Presentation: Provides context
- [ ] Validation: Checks correctness
- [ ] Main: Assembles everything

### 5. Are there grammar violations?
- [ ] No concrete dependencies in implementations
- [ ] No business logic in controllers
- [ ] No infrastructure in domain
- [ ] No God Objects (run-on sentences)
- [ ] Proper naming conventions

---

**Use this guide to validate code like a grammar checker validates English!**
