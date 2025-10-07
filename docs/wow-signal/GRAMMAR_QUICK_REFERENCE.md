# Clean Architecture Grammar - Quick Reference

## Linguistic Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLEAN ARCHITECTURE GRAMMAR                    │
├─────────────────┬───────────────────────┬───────────────────────┤
│ Layer           │ Linguistic Role       │ Natural Language      │
├─────────────────┼───────────────────────┼───────────────────────┤
│ Domain/Models   │ NOUN (Subject/Object) │ "User", "Survey"      │
│ Domain/UseCases │ VERB (Action)         │ "Add", "Authenticate" │
│ Data/Protocols  │ ADVERB (Abstract)     │ "Manner of action"    │
│ Data/UseCases   │ SENTENCE (Active)     │ "System adds account" │
│ Infrastructure  │ ADVERB (Concrete)     │ "Via MongoDB"         │
│ Presentation    │ CONTEXT               │ "To HTTP client"      │
│ Validation      │ GRAMMAR CHECKER       │ "Correctness rules"   │
│ Main/Factories  │ SENTENCE COMPOSER     │ "Assembles thought"   │
└─────────────────┴───────────────────────┴───────────────────────┘
```

## Core Patterns (Cheat Sheet)

### 1. UseCase Contract (DOM-001)

```typescript
export interface <UseCaseName> {
  <verb>: (params: <UseCaseName>.Params) => Promise<<UseCaseName>.Result>
}

export namespace <UseCaseName> {
  export type Params = { ... }
  export type Result = ...
}
```

**Grammar**: `Verb + Direct Object (Params) + Predicate (Result)`

### 2. Implementation (DATA-001)

```typescript
export class Db<UseCaseName> implements <UseCaseName> {
  constructor(
    private readonly protocol1: Protocol1,
    private readonly protocol2: Protocol2
  ) {}

  async <verb>(params: <UseCaseName>.Params): Promise<<UseCaseName>.Result> {
    // Use protocols (abstract adverbs)
  }
}
```

**Grammar**: `Subject + Verb + Adverbial Phrases (dependencies)`

### 3. Adapter (INFRA-001)

```typescript
export class <Technology>Adapter implements <Protocol> {
  constructor(private readonly config: Config) {}

  async <method>(params: Type): Promise<Result> {
    return <externalLib>.method(params)
  }
}
```

**Grammar**: `Concrete Adverb (specific manner of action)`

### 4. Controller (PRES-001)

```typescript
export class <Context>Controller implements Controller {
  constructor(private readonly useCase: UseCase) {}

  async handle(request: <Context>Controller.Request): Promise<HttpResponse> {
    const result = await this.useCase.execute(request)
    return ok(result)
  }
}

export namespace <Context>Controller {
  export type Request = { ... }
}
```

**Grammar**: `Context + Verb Execution`

### 5. Factory (MAIN-001)

```typescript
export const make<Component> = (): <Interface> => {
  const dep1 = new ConcreteDep1()
  const dep2 = new ConcreteDep2()
  return new Implementation(dep1, dep2)
}
```

**Grammar**: `Sentence Assembly (all parts → complete thought)`

## Dependency Flow (Grammar Direction)

```
Domain (Core)
  ↑
  │ implements
  │
Data (Use Cases)
  ↑
  │ implements
  │
Infrastructure (Adapters)

Presentation → Domain (uses)

Main → All (composes)
```

**Rule**: Dependencies point INWARD (toward domain)
**Linguistic**: Core grammar is independent; implementations depend on grammar

## Common Violations (Grammar Errors)

| Violation | Grammar Error | Fix |
|-----------|---------------|-----|
| Domain → Infrastructure | Noun depends on adverb | Remove import |
| Missing UseCase.Params | Transitive verb without object | Add namespace |
| Controller has business logic | Context contains verb | Move to use case |
| Concrete dependency in constructor | Depends on concrete adverb | Use interface |
| Circular dependency | Unparseable grammar | Break cycle |

## Validation Checklist

- [ ] Every use case has Interface + Namespace
- [ ] Every namespace has Params + Result
- [ ] Every implementation depends only on interfaces
- [ ] No circular dependencies
- [ ] Domain imports only from Domain
- [ ] Data imports from Domain or Data
- [ ] Infrastructure imports from Data protocols
- [ ] Presentation imports from Domain
- [ ] Factories return interfaces
- [ ] Controllers don't have business logic

## Pattern Recognition (Quick Test)

**Is this valid?**

```typescript
// ❌ NO - Domain depends on Infrastructure
import { MongoDB } from '@/infra/db'

export interface AddAccount {
  add: (db: MongoDB) => Promise<void>
}
```

**Why?** Verb definition includes concrete adverb (MongoDB). Should be abstract.

---

```typescript
// ✅ YES - Proper abstraction
export interface AddAccount {
  add: (params: AddAccount.Params) => Promise<AddAccount.Result>
}

export namespace AddAccount {
  export type Params = { name: string, email: string }
  export type Result = boolean
}
```

**Why?** Abstract verb with explicit parameters and result.

---

```typescript
// ❌ NO - Implementation depends on concrete
export class DbAddAccount implements AddAccount {
  constructor(private readonly mongo: MongoAdapter) {}  // Concrete!
}
```

**Why?** Should depend on `AddAccountRepository` interface, not `MongoAdapter`.

---

```typescript
// ✅ YES - Depends on abstraction
export class DbAddAccount implements AddAccount {
  constructor(private readonly repository: AddAccountRepository) {}
}
```

**Why?** Depends on abstract protocol (adverbial phrase), not concrete adapter.

## Quick Command Reference

```bash
# Validate grammar (dependencies)
npx depcruise --config .dependency-cruiser.js src

# Check types (surface structure)
npm run type-check

# Run tests (semantic validation)
npm test

# Lint code (syntax)
npm run lint
```

## Manguinho's Key Contributions

1. **Namespace Pattern**: Co-locates Params and Result with interface
2. **Protocol Segregation**: Small, focused interfaces in Data layer
3. **Factory Pattern**: Composition root isolates dependencies
4. **Controller Simplicity**: Controllers only orchestrate, no logic
5. **Validation Layer**: Separate concern for input correctness

## Universal Grammar (Language-Agnostic)

These patterns work in **any language**:

| Principle | TypeScript | Python | Go |
|-----------|-----------|--------|-----|
| Abstract Contract | `interface` | `Protocol` | `interface` |
| Dependency Injection | Constructor params | `__init__` | `New()` function |
| Namespace Types | `namespace` | Nested classes | Package structs |

**Deep Structure** = Architecture principles (universal)
**Surface Structure** = Language syntax (varies)

---

**Use this guide** as a quick reference when writing or reviewing code to ensure grammatical correctness!
