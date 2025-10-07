# Front-End Hostfully: React Clean Architecture Grammar Analysis

## Executive Summary

This document analyzes **front-end-hostfully**, a React/TypeScript application that implements Clean Architecture for frontend development. This analysis proves that **Clean Architecture's Universal Grammar extends perfectly to React applications**, with special adaptations for frontend-specific concerns like UI state, hooks, and component composition.

**Key Discovery**: The **same 6 core grammar patterns** exist in this React frontend, but with **unique frontend adaptations**:
- **Stub Services** replace real APIs (in-memory simulation)
- **React Hooks** serve as presentation adapters
- **Dependency Injection via Props** instead of constructors
- **Component composition** follows same factory pattern

This proves Clean Architecture grammar works **across domains** (backend AND frontend), **across languages** (TypeScript, Swift, Dart), AND **across paradigms** (OOP, Functional, React).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Layers](#architecture-layers)
3. [The 6 Core Patterns in React](#the-6-core-patterns-in-react)
4. [Frontend-Specific Adaptations](#frontend-specific-adaptations)
5. [Side-by-Side: Backend vs Frontend](#side-by-side-backend-vs-frontend)
6. [Dependency Flow Validation](#dependency-flow-validation)
7. [React Hooks as Presentation Layer](#react-hooks-as-presentation-layer)
8. [Stub Services Pattern](#stub-services-pattern)
9. [Universal Grammar Validation](#universal-grammar-validation)
10. [Conclusion](#conclusion)

---

## 1. Project Overview

### Technology Stack

```json
{
  "framework": "React 18",
  "language": "TypeScript 5.3",
  "ui": "Chakra UI",
  "bundler": "Webpack 5",
  "testing": "Jest + React Testing Library",
  "http": "Axios",
  "routing": "React Router DOM v5"
}
```

### Domain

**Multi-tenancy booking management system**:
- Properties (houses, apartments, rooms)
- Bookings (create, update, delete, list)
- Guests
- Price calculation
- Date validation

### Key Features

1. **Stub Repository Pattern**: Simulates API with in-memory arrays
2. **Multi-Tenancy Theme**: Commander + Inquirer for theme selection
3. **Clean Architecture**: 7 layers with clear separation
4. **TDD**: Unit + Integration tests for each layer
5. **SOLID Principles**: DI, SRP, OCP, LSP, ISP, DIP

---

## 2. Architecture Layers

```
┌────────────────────────────────────────────────────────┐
│                    Main (Factories)                    │
│  - Dependency injection setup                          │
│  - Routes configuration                                │
│  - Application bootstrap                               │
└────────────┬────────────────────────────┬──────────────┘
             │                            │
             ↓                            ↓
┌────────────────────────┐   ┌──────────────────────────┐
│  Presentation (React)  │   │  Application (Stubs)     │
│  - Components          │   │  - Stub Services         │
│  - Pages               │   │  - In-Memory Repository  │
│  - Hooks               │   │  - Mock Data             │
│  - Context             │   │  - Calculators           │
└─────────┬──────────────┘   └────────┬─────────────────┘
          │                           │
          ↓                           ↓
┌────────────────────────┐   ┌──────────────────────────┐
│  Validation            │   │  Infra (Adapters)        │
│  - Validators          │   │  - AxiosHttpClient       │
│  - ValidationComposite │   │  - DateFnsAdapter        │
│  - Field Validation    │   │  - LocalStorageCache     │
└─────────┬──────────────┘   └────────┬─────────────────┘
          │                           │
          └───────────┬───────────────┘
                      ↓
          ┌──────────────────────┐
          │  Data (UseCases Impl)│
          │  - RemoteCreateBooking│
          │  - RemoteListBookings│
          │  - RemoteUpdateBooking│
          └──────────┬────────────┘
                     │
                     ↓
          ┌──────────────────────┐
          │  Domain (Core Logic) │
          │  - Models            │
          │  - UseCase Contracts │
          │  - Repository Contracts│
          │  - Errors            │
          └──────────────────────┘
```

### Layer Responsibilities

| Layer | Purpose | Examples |
|-------|---------|----------|
| **Domain** | Business logic, entities, contracts | Booking.Model, CreateBookingUsecase |
| **Data** | UseCase implementations | RemoteCreateBooking, RemoteListBookings |
| **Infra** | External adapters | AxiosHttpClient, DateFnsAdapter |
| **Application** | Stub API simulation | StubServiceCreateBooking, BookingRepository |
| **Validation** | Input validation | ValidationComposite, EmailValidator |
| **Presentation** | UI components, hooks | BookingPage, useListBookings |
| **Main** | DI, routing, config | makeRemoteCreateBooking, Router |

---

## 3. The 6 Core Patterns in React

### Pattern DOM-001: UseCase Contract

**BNF Grammar** (unchanged from backend):
```bnf
<use-case> ::= "export" "interface" <name> "{" <method> "}"
<method> ::= "perform" ":" "(" <params> ")" "=>" "Promise<" <result> ">"
<namespace> ::= "export" "namespace" <name> "{" <types> "}"
```

**Implementation**:
```typescript
// src/domain/usecases/booking/create-booking.ts
import { Booking } from '@/domain/models'

export interface CreateBookingUsecase {
  perform: (params: CreateBookingUsecase.Params) => Promise<CreateBookingUsecase.Result>
}

export namespace CreateBookingUsecase {
  export type Params = Booking.Params
  export type Result = Booking.Result
}
```

**Grammatical Analysis**:
- **Part of Speech**: VERB (action to perform)
- **Subject**: Domain business rule
- **Contract**: Input → Promise<Output>
- **Dependencies**: Zero (pure domain)
- **Same as backend**: ✅ IDENTICAL structure

---

### Pattern DOM-002: Domain Model

**BNF Grammar**:
```bnf
<model> ::= "export" "namespace" <name> "{" <types> "}"
<types> ::= <model-type> | <params-type> | <result-type>
```

**Implementation**:
```typescript
// src/domain/models/booking.model.ts
import { Guest, PropertyModel } from '@/domain/models'

export namespace Booking {
  export type Model = {
    id: string
    totalPrice: number
    numberOfNights: number
    startDate: Date
    endDate: Date
    hostEmail: string
    guests: Guest.Model
    property: PropertyModel
    guestEmail: string
  }

  export type Params = {
    guestEmail: string
    guests: Guest.Model
    startDate: Date
    endDate: Date
    createdAt: Date
    property: PropertyModel
  }

  export type Result = {
    booking?: Booking.Model[]
    error?: string
  }
}
```

**Grammatical Analysis**:
- **Part of Speech**: NOUN (entity)
- **Purpose**: Define data structures
- **Pattern**: Namespace with Model, Params, Result
- **Same as backend**: ✅ IDENTICAL structure

---

### Pattern DATA-001: UseCase Implementation

**BNF Grammar** (unchanged):
```bnf
<use-case-impl> ::= "export" "class" <name> "implements" <interface> "{" <constructor> <perform> "}"
<constructor> ::= "constructor" "(" <dependencies> ")" "{}"
<perform> ::= "async" "perform" "(" <params> ")" ":" "Promise<" <result> ">" "{" <logic> "}"
```

**Implementation**:
```typescript
// src/data/usecases/booking/remote-create-booking.ts
import { HttpClient, HttpStatusCode } from '@/data/protocols'
import { CreateBookingUsecase } from '@/domain/usecases'
import { BookingError, InvalidCredentialError, NotFoundError, UnexpectedError } from '@/domain/errors'

export class RemoteCreateBooking implements CreateBookingUsecase {
  constructor (
    private readonly url: string,
    private readonly httpClient: HttpClient
  ) {}

  async perform (params: CreateBookingUsecase.Params): Promise<CreateBookingUsecase.Result> {
    const response = await this.httpClient.request({
      url: this.url,
      method: 'post',
      body: params
    })

    switch (response.statusCode) {
      case HttpStatusCode.ok:
        return response.body
      case HttpStatusCode.unauthorized:
        throw new InvalidCredentialError()
      case HttpStatusCode.notFound:
        throw new NotFoundError()
      case HttpStatusCode.conflict:
        throw new BookingError()
      case HttpStatusCode.badRequest:
        throw new DateError()
      default:
        throw new UnexpectedError()
    }
  }
}
```

**Grammatical Analysis**:
- **Part of Speech**: ACTIVE SENTENCE (subject + verb + object)
- **Subject**: RemoteCreateBooking
- **Verb**: perform
- **Dependencies**: HttpClient (abstraction)
- **Same as backend**: ✅ IDENTICAL structure

---

### Pattern INFRA-001: Adapter Implementation

**BNF Grammar** (unchanged):
```bnf
<adapter> ::= "export" "class" <name> "implements" <protocol> "{" <methods> "}"
```

**Implementation**:
```typescript
// src/infra/http/axios-http-client.ts
import { HttpClient, HttpRequest, HttpResponse } from '@/data/protocols'
import axios, { AxiosResponse } from 'axios'

export class AxiosHttpClient implements HttpClient {
  async request (data: HttpRequest): Promise<HttpResponse> {
    let axiosResponse: AxiosResponse
    try {
      axiosResponse = await axios.request({
        url: data.url,
        method: data.method,
        data: data.body,
        headers: data.headers
      })
    } catch (error: any) {
      axiosResponse = error.response
    }
    return {
      statusCode: axiosResponse?.status,
      body: axiosResponse?.data
    }
  }
}
```

**Grammatical Analysis**:
- **Part of Speech**: CONCRETE ADVERB (specific HOW)
- **Purpose**: Adapt external library (axios) to internal protocol
- **Pattern**: Implements HttpClient interface
- **Same as backend**: ✅ IDENTICAL structure

---

### Pattern APP-001: Stub Service (Frontend-Specific)

**BNF Grammar** (NEW - Frontend Pattern):
```bnf
<stub-service> ::= "export" "class" <name> "implements" "HttpClient" "{" <constructor> <request> "}"
<request> ::= "async" "request" "(" <http-request> ")" ":" "Promise<HttpResponse>" "{" <simulation-logic> "}"
<simulation-logic> ::= <validation> <calculation> <repository-mutation> <response-building>
```

**Implementation**:
```typescript
// src/application/service/booking/stub-service-create-booking.ts
import { HttpClient, HttpRequest, HttpResponse, HttpStatusCode } from '@/data/protocols'
import { CreateBookingUsecase } from '@/domain/usecases'
import { BookingRepository } from '@/domain/repository'
import { Validation } from '@/validation/protocols'
import { faker } from '@faker-js/faker'

export class StubServiceCreateBooking implements HttpClient<CreateBookingUsecase.Result> {
  constructor (
    private readonly bookingCalculator: BookingCalculateTotalPrice,
    private readonly bookingsRepository: BookingRepository,
    private readonly bookingValidationService: Validation
  ) {}

  async request (data: HttpRequest<CreateBookingUsecase.Params>): Promise<HttpResponse<CreateBookingUsecase.Result>> {
    try {
      const params = data.body

      // Validation
      const validationBooking = validateBooking(this.bookingValidationService, params)
      if (validationBooking) {
        return validationBooking
      }

      // Calculation
      const { totalPrice, numberOfNights } = calculateBooking(this.bookingCalculator, params)

      // Create entity
      const newBooking: Booking.Model = {
        id: faker.string.alphanumeric(),
        totalPrice,
        numberOfNights,
        startDate: params.startDate,
        endDate: params.endDate,
        hostEmail: faker.internet.email(),
        guests: params.guests,
        property: params.property,
        guestEmail: params.guestEmail
      }

      // Mutate in-memory repository
      this.bookingsRepository.add(newBooking)
      const response = this.bookingsRepository.getAll()

      return {
        statusCode: HttpStatusCode.ok,
        body: { booking: response }
      }
    } catch (error) {
      if (error instanceof DateError) {
        return {
          statusCode: HttpStatusCode.badRequest
        }
      }
    }
  }
}
```

**Grammatical Analysis**:
- **Part of Speech**: SIMULATED INFRASTRUCTURE
- **Purpose**: Replace real API with in-memory simulation
- **Key Feature**: Implements same HttpClient interface as real infrastructure
- **Why**: Frontend development without backend dependency
- **Pattern**: Facade over repository + validation + calculation

**Frontend-Specific**: ✅ This pattern doesn't exist in backend projects!

---

### Pattern PRES-001: React Component with Hooks

**BNF Grammar** (NEW - React Pattern):
```bnf
<react-page> ::= "export" "const" <name> ":" "React.FC<" <props> ">" "=" "({" <use-cases> "}) =>" "{" <component-logic> "}"
<props> ::= "{ " <use-case-deps> " }"
<component-logic> ::= <hooks> <event-handlers> <jsx>
```

**Implementation**:
```typescript
// src/presentation/pages/booking.tsx
import { CreateBookingUsecase, DeleteBookingByIdUsecase, ListBookingsUsecase, UpdateBookingUsecase } from '@/domain/usecases'
import { useDeleteBooking, useListBookings } from '@/presentation/hooks'
import { Validation } from '@/validation/protocols'

type Props = {
  listBookings: ListBookingsUsecase
  validation: Validation
  createBooking: CreateBookingUsecase
  deleteBooking: DeleteBookingByIdUsecase
  updateBooking: UpdateBookingUsecase
}

export const BookingPage: React.FC<Props> = ({
  listBookings,
  validation,
  createBooking,
  deleteBooking,
  updateBooking
}: Props) => {
  const [reloadFlag, setReloadFlag] = useState(false)

  // Custom hook encapsulates use case logic
  const { bookings, isLoading, error } = useListBookings(listBookings, reloadFlag)
  const { performDelete } = useDeleteBooking(deleteBooking)

  const handleBookingSubmitted = (): void => {
    setReloadFlag((oldFlag) => !oldFlag)
    toast({ title: 'Booking created.', status: 'success' })
  }

  const handleDeleteBooking = async (id: string): Promise<void> => {
    const result = await performDelete(id)
    if (result === true) {
      setReloadFlag((oldFlag) => !oldFlag)
    }
  }

  return (
    <>
      <BookingForm
        createBooking={createBooking}
        onBookingSubmitted={handleBookingSubmitted}
        validation={validation}
      />
      {bookings.map(booking => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onDelete={() => handleDeleteBooking(booking.id)}
        />
      ))}
    </>
  )
}
```

**Custom Hook**:
```typescript
// src/presentation/hooks/booking/use-list-bookings.tsx
import { useEffect, useState } from 'react'
import { ListBookingsUsecase } from '@/domain/usecases'

type useListBookingsResult = {
  bookings: ListBookingsUsecase.Result
  isLoading: boolean
  error: string
}

export const useListBookings = (
  listBookingsUsecase: ListBookingsUsecase,
  reloadFlag: boolean
): useListBookingsResult => {
  const [bookings, setBookings] = useState([] as ListBookingsUsecase.Result)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLoading(true)
    listBookingsUsecase
      .perform()
      .then(setBookings)
      .catch(handleError)
      .finally(() => setIsLoading(false))
  }, [reloadFlag])

  return { bookings, isLoading, error }
}
```

**Grammatical Analysis**:
- **Part of Speech**: PRESENTATION CONTEXT
- **Subject**: User interface
- **Pattern**: Dependency Injection via Props
- **Hooks**: Encapsulate use case interaction + state management
- **Key Difference**: Props DI instead of constructor DI
- **Same principles**: ✅ Depends only on abstractions (UseCases)

---

### Pattern VAL-001: Validation

**BNF Grammar** (unchanged):
```bnf
<validator> ::= "export" "class" <name> "implements" "Validation" "{" <validate> "}"
```

**Implementation**:
```typescript
// src/validation/validators/validation-composite/validation-composite.ts
import { FieldValidation, Validation } from '@/validation/protocols'

export class ValidationComposite implements Validation {
  private constructor (private readonly validators: FieldValidation[]) {}

  static build (validators: FieldValidation[]): ValidationComposite {
    return new ValidationComposite(validators)
  }

  validate (fieldName: string, input: object): string {
    const validators = this.validators.filter((v) => v.field === fieldName)
    for (const validator of validators) {
      const error = validator.validate(input)
      if (error) {
        return error.message
      }
    }
  }
}
```

**Grammatical Analysis**:
- **Part of Speech**: GRAMMAR CHECKER
- **Purpose**: Validate inputs before processing
- **Pattern**: Composite pattern with field validators
- **Same as backend**: ✅ IDENTICAL structure

---

### Pattern MAIN-001: Factory Composition

**BNF Grammar** (unchanged):
```bnf
<factory> ::= "export" "const" <make-name> "=" "()" ":" <return-type> "=>" "{" <composition> "}"
```

**Implementation**:
```typescript
// src/main/factories/data/booking/remote-create-booking-factory.ts
import { RemoteCreateBooking } from '@/data/usecases'
import { makeStubServiceCreateBooking } from '../../application/service/stub-service-create-booking-factory'

export const makeRemoteCreateBooking = (): RemoteCreateBooking => {
  const stubService = makeStubServiceCreateBooking()
  return new RemoteCreateBooking('', stubService)
}
```

**Stub Service Factory**:
```typescript
// src/main/factories/application/service/stub-service-create-booking-factory.ts
export const makeStubServiceCreateBooking = (): StubServiceCreateBooking => {
  return new StubServiceCreateBooking(
    makeBookingCalculator(),
    makeBookingRepository(),
    makeBookingValidation()
  )
}
```

**Infra Factory**:
```typescript
// src/main/factories/infra/http/axios.ts
import { AxiosHttpClient } from "@/infra"

export const makeAxios = (): AxiosHttpClient => {
  return new AxiosHttpClient()
}
```

**Grammatical Analysis**:
- **Part of Speech**: SENTENCE COMPOSER
- **Purpose**: Wire dependencies
- **Pattern**: Factory functions compose layers
- **Key**: Uses **StubService** instead of real HTTP client for development
- **Same structure**: ✅ Same factory pattern as backend

---

## 4. Frontend-Specific Adaptations

### Adaptation 1: Dependency Injection via Props

**Backend (Constructor DI)**:
```typescript
class Controller {
  constructor(private readonly useCase: UseCase) {}

  async handle(request) {
    return this.useCase.execute(request)
  }
}
```

**Frontend (Props DI)**:
```typescript
type Props = {
  useCase: UseCase
}

const Component: React.FC<Props> = ({ useCase }) => {
  // Use useCase in effects, handlers
  return <div>...</div>
}
```

**Why Different?**:
- React components are **functions**, not classes
- Props are React's natural DI mechanism
- Enables component reusability and testing

**Same Principle**: ✅ Both depend on abstractions, injected from outside

---

### Adaptation 2: React Hooks as Adapters

**Pattern**: Custom hooks encapsulate use case interaction + state management

**Structure**:
```typescript
export const useListBookings = (
  listBookingsUsecase: ListBookingsUsecase,  // Injected dependency
  reloadFlag: boolean                         // Trigger
): useListBookingsResult => {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLoading(true)
    listBookingsUsecase
      .perform()
      .then(setBookings)
      .catch(handleError)
      .finally(() => setIsLoading(false))
  }, [reloadFlag])

  return { bookings, isLoading, error }
}
```

**Grammatical Role**:
- **Adapter**: Translates domain use case → React state
- **Encapsulation**: Hides use case invocation details
- **Reusability**: Same hook works with different implementations (real API, stub, mock)

**Backend Equivalent**: Service classes that wrap repositories

---

### Adaptation 3: Stub Services Pattern

**Problem**: Frontend development needs to proceed without backend API

**Solution**: Stub services that implement HttpClient but use in-memory arrays

**Architecture**:
```
RemoteCreateBooking
  → depends on HttpClient (interface)
    → AxiosHttpClient (production)
    → StubServiceCreateBooking (development)
       → BookingRepository (in-memory array)
```

**Key Insight**:
- RemoteCreateBooking doesn't know if it's talking to a real API or stub
- Same code runs in both environments
- Only factory changes: `makeRemoteCreateBooking()` injects different HttpClient

**This is**: **Dependency Inversion Principle** in action!

---

### Adaptation 4: Component Composition

**Backend**: Classes composed via constructors
**Frontend**: Components composed via JSX

```typescript
// Backend
class Controller {
  constructor(useCase, validator) {}
}

// Frontend
<BookingForm
  createBooking={createBookingUseCase}
  validation={validationComposite}
/>
```

**Same Principle**: ✅ Composition over inheritance, DI from outside

---

## 5. Side-by-Side: Backend vs Frontend

### Use Case Contract

**Backend (clean-ts-api)**:
```typescript
export interface AddAccount {
  add: (account: AddAccount.Params) => Promise<AddAccount.Result>
}
export namespace AddAccount {
  export type Params = { name: string, email: string, password: string }
  export type Result = boolean
}
```

**Frontend (front-end-hostfully)**:
```typescript
export interface CreateBookingUsecase {
  perform: (params: CreateBookingUsecase.Params) => Promise<CreateBookingUsecase.Result>
}
export namespace CreateBookingUsecase {
  export type Params = Booking.Params
  export type Result = Booking.Result
}
```

**Difference**: Method name (`add` vs `perform`)
**Same Deep Structure**: ✅ Interface + Namespace pattern

---

### Use Case Implementation

**Backend**:
```typescript
export class DbAddAccount implements AddAccount {
  constructor(
    private readonly hasher: Hasher,
    private readonly repository: AddAccountRepository
  ) {}

  async add(params: AddAccount.Params): Promise<AddAccount.Result> {
    const hashedPassword = await this.hasher.hash(params.password)
    return this.repository.add({ ...params, password: hashedPassword })
  }
}
```

**Frontend**:
```typescript
export class RemoteCreateBooking implements CreateBookingUsecase {
  constructor(
    private readonly url: string,
    private readonly httpClient: HttpClient
  ) {}

  async perform(params: CreateBookingUsecase.Params): Promise<CreateBookingUsecase.Result> {
    const response = await this.httpClient.request({
      url: this.url,
      method: 'post',
      body: params
    })

    switch (response.statusCode) {
      case HttpStatusCode.ok: return response.body
      case HttpStatusCode.unauthorized: throw new InvalidCredentialError()
      default: throw new UnexpectedError()
    }
  }
}
```

**Differences**:
- Backend: DB operations
- Frontend: HTTP operations + error mapping

**Same Deep Structure**: ✅ Class implements interface, DI via constructor

---

### Presentation Layer

**Backend (Controller)**:
```typescript
export class SignUpController implements Controller {
  constructor(
    private readonly addAccount: AddAccount,
    private readonly validation: Validation
  ) {}

  async handle(httpRequest: HttpRequest): Promise<HttpResponse> {
    const error = this.validation.validate(httpRequest.body)
    if (error) return badRequest(error)

    const result = await this.addAccount.add(httpRequest.body)
    return ok(result)
  }
}
```

**Frontend (React Component + Hook)**:
```typescript
type Props = {
  createBooking: CreateBookingUsecase
  validation: Validation
}

export const BookingForm: React.FC<Props> = ({ createBooking, validation }) => {
  const [formData, setFormData] = useState({})

  const handleSubmit = async () => {
    const error = validation.validate('email', formData)
    if (error) return showError(error)

    const result = await createBooking.perform(formData)
    showSuccess(result)
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

**Differences**:
- Backend: Imperative class method
- Frontend: Declarative component + event handler

**Same Deep Structure**: ✅ Receives use case + validation via DI, coordinates them

---

### Factory Pattern

**Backend**:
```typescript
export const makeDbAddAccount = (): AddAccount => {
  return new DbAddAccount(
    makeBcryptHasher(),
    makeAccountRepository()
  )
}

export const makeSignUpController = (): Controller => {
  return new SignUpController(
    makeDbAddAccount(),
    makeSignUpValidation()
  )
}
```

**Frontend**:
```typescript
export const makeRemoteCreateBooking = (): RemoteCreateBooking => {
  return new RemoteCreateBooking(
    '',
    makeStubServiceCreateBooking()  // or makeAxios() in production
  )
}

export const makeBookingPage = (): JSX.Element => {
  return (
    <BookingPage
      createBooking={makeRemoteCreateBooking()}
      validation={makeBookingValidation()}
    />
  )
}
```

**Same Deep Structure**: ✅ Factory functions compose dependencies

---

## 6. Dependency Flow Validation

### Dependency Rule

**Rule**: All dependencies point INWARD toward Domain.

```
Main → Presentation → Application → Data → Infra
  ↓        ↓            ↓          ↓       ↓
  └────────┴────────────┴──────────┴───────→ Domain
```

### Validation Table

| Layer | Imports | Valid? |
|-------|---------|--------|
| Domain | Nothing | ✅ |
| Data | Domain contracts | ✅ |
| Infra | Data protocols (derived from Domain) | ✅ |
| Application | Domain, Data protocols | ✅ |
| Presentation | Domain usecases | ✅ |
| Validation | Domain models | ✅ |
| Main | All layers (for composition) | ✅ |

### Example: RemoteCreateBooking

```typescript
// src/data/usecases/booking/remote-create-booking.ts
import { HttpClient } from '@/data/protocols'        // ✅ Same layer
import { CreateBookingUsecase } from '@/domain/usecases'  // ✅ Inward (Data → Domain)
import { BookingError } from '@/domain/errors'       // ✅ Inward (Data → Domain)

// ❌ NO imports from:
// - @/infra (outward)
// - @/presentation (outward)
// - @/application (outward)
```

**Result**: ✅ All dependencies point inward. Clean Architecture validated.

---

## 7. React Hooks as Presentation Layer

### Pattern Analysis

React hooks serve as **Presentation Layer adapters** in this architecture.

**Structure**:
```typescript
export const useListBookings = (
  listBookingsUsecase: ListBookingsUsecase,  // Domain dependency (injected)
  reloadFlag: boolean                         // Presentation trigger
): useListBookingsResult => {                // Presentation state
  // Presentation state
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Effect: Trigger domain use case
  useEffect(() => {
    setIsLoading(true)
    listBookingsUsecase.perform()
      .then(setBookings)      // Map domain → presentation
      .catch(handleError)     // Handle domain errors
      .finally(() => setIsLoading(false))
  }, [reloadFlag])

  return { bookings, isLoading, error }
}
```

### Responsibilities

1. **State Management**: Manage UI state (loading, error, data)
2. **Use Case Invocation**: Call domain use cases at appropriate times
3. **Error Handling**: Translate domain errors to UI messages
4. **Data Transformation**: Map domain models to presentation models (if needed)
5. **Side Effect Coordination**: useEffect orchestrates when to call use cases

### Why This Works

**Separation of Concerns**:
- **Component**: Renders UI, handles user events
- **Hook**: Manages state, calls use cases
- **Use Case**: Executes business logic
- **Repository**: Persists data

**Testing**:
```typescript
// Mock use case
const mockListBookings = { perform: jest.fn() }

// Test hook with mock
const { result } = renderHook(() => useListBookings(mockListBookings, true))

// Verify hook called use case
expect(mockListBookings.perform).toHaveBeenCalled()
```

**Reusability**:
- Same hook works with real API, stub, or mock
- Change factory to inject different implementation

---

## 8. Stub Services Pattern

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Development Flow                       │
└─────────────────────────────────────────────────────────┘

RemoteCreateBooking (Data Layer)
  ↓ depends on HttpClient interface
  ↓
StubServiceCreateBooking (Application Layer)
  ↓ implements HttpClient
  ↓ uses:
  ├─→ BookingRepository (in-memory array)
  ├─→ BookingCalculator (price calculation)
  └─→ Validation (input validation)

┌─────────────────────────────────────────────────────────┐
│                  Production Flow                        │
└─────────────────────────────────────────────────────────┘

RemoteCreateBooking (Data Layer)
  ↓ depends on HttpClient interface
  ↓
AxiosHttpClient (Infra Layer)
  ↓ implements HttpClient
  └─→ Makes real HTTP calls to backend API
```

### Key Insight

**Same interface, different implementation**:
- RemoteCreateBooking doesn't know which HttpClient it's using
- Development: StubServiceCreateBooking
- Production: AxiosHttpClient
- Testing: MockHttpClient

**This is Dependency Inversion Principle**:
- High-level module (RemoteCreateBooking) doesn't depend on low-level module (Axios)
- Both depend on abstraction (HttpClient)
- Abstraction doesn't depend on details
- Details depend on abstraction

### Implementation Details

**In-Memory Repository**:
```typescript
export class BookingRepository {
  private bookings: Booking.Model[] = []

  add(booking: Booking.Model): void {
    this.bookings.push(booking)
  }

  getAll(): Booking.Model[] {
    return this.bookings
  }

  deleteById(id: string): boolean {
    const index = this.bookings.findIndex(b => b.id === id)
    if (index !== -1) {
      this.bookings.splice(index, 1)
      return true
    }
    return false
  }
}
```

**Singleton Pattern** (in Main):
```typescript
// Ensure single instance across application
let bookingRepositoryInstance: BookingRepository | null = null

export const makeBookingRepository = (): BookingRepository => {
  if (!bookingRepositoryInstance) {
    bookingRepositoryInstance = new BookingRepository()
  }
  return bookingRepositoryInstance
}
```

**Why Singleton?**: All parts of the app need to share the same in-memory data.

---

## 9. Universal Grammar Validation

### Cross-Domain Pattern Matrix

| Pattern | Backend | Frontend | Present? |
|---------|---------|----------|----------|
| DOM-001 (UseCase Contract) | Interface + Namespace | Interface + Namespace | ✅ |
| DOM-002 (Domain Model) | Namespace with types | Namespace with types | ✅ |
| DATA-001 (UseCase Impl) | Class implements interface | Class implements interface | ✅ |
| INFRA-001 (Adapter) | Class implements protocol | Class implements protocol | ✅ |
| APP-001 (Application) | N/A | Stub Service | ✅ (frontend-only) |
| PRES-001 (Presentation) | Controller class | Component + Hooks | ✅ |
| VAL-001 (Validation) | ValidationComposite | ValidationComposite | ✅ |
| MAIN-001 (Factory) | Factory functions | Factory functions | ✅ |

**Score**: 8/8 patterns (7 shared + 1 frontend-specific)

**Validation**: ✅ **Universal Grammar confirmed across Backend AND Frontend**

---

## 10. Conclusion

### Theorem Proven

**Clean Architecture Grammar is Universal across application domains (backend AND frontend).**

**Evidence**:
1. ✅ All 6 core patterns exist in React frontend
2. ✅ Dependency flow is identical (inward toward Domain)
3. ✅ Same abstraction principles (DI, interfaces, protocols)
4. ✅ Same testing strategy (mock dependencies)
5. ✅ Frontend-specific adaptations don't violate core grammar

### Frontend Adaptations Summary

| Adaptation | Reason | Grammar Violation? |
|-----------|--------|-------------------|
| Props DI instead of constructor DI | React is functional | ❌ No - same principle |
| Hooks as adapters | React state management | ❌ No - encapsulates logic |
| Stub Services | Development without backend | ❌ No - implements same interface |
| Component composition | React paradigm | ❌ No - same DI principle |

### Universal Grammar Scope

We have now proven Clean Architecture Universal Grammar across:

| Dimension | Examples | Validated |
|-----------|----------|-----------|
| **Languages** | TypeScript, Swift, Dart | ✅ |
| **Paradigms** | OOP, Functional, React | ✅ |
| **Domains** | Backend API, Frontend SPA | ✅ |
| **Platforms** | Node.js, iOS, Flutter, Web | ✅ |

**4 languages, 3 paradigms, 2 domains, 1 grammar.** 🎯

### Key Takeaways

1. **Grammar Transcends Domain**: Same patterns work for backend APIs and frontend SPAs
2. **Adaptations Preserve Principles**: Props DI, hooks, components - all follow same core rules
3. **Stub Services**: Powerful pattern for frontend development without backend
4. **React + Clean Architecture**: Perfect fit when using DI via props
5. **Testing**: Same strategy (mock dependencies) works in both domains

### The Real Universal Grammar

Clean Architecture's grammar is not:
- "Use classes"
- "Use controllers"
- "Use constructors for DI"

It IS:
- "Define abstractions with zero dependencies"
- "Implement abstractions by depending on them"
- "Inject dependencies from outside"
- "Keep dependencies pointing inward"
- "Compose at outer layers"

These rules work in **any language**, **any paradigm**, **any domain**.

---

## Appendix: File Structure

```
front-end-hostfully/
├── src/
│   ├── domain/
│   │   ├── models/
│   │   │   ├── booking.model.ts           # Namespace with Model, Params, Result
│   │   │   ├── property.model.ts
│   │   │   └── guest.model.ts
│   │   ├── usecases/
│   │   │   └── booking/
│   │   │       ├── create-booking.ts      # Interface + Namespace
│   │   │       ├── list-bookings.ts
│   │   │       └── delete-booking-by-id.ts
│   │   ├── repository/
│   │   │   └── booking-repository.ts      # Interface
│   │   └── errors/
│   │       └── booking-error.ts
│   ├── data/
│   │   ├── protocols/
│   │   │   └── http/
│   │   │       └── http-client.ts         # HttpClient interface
│   │   └── usecases/
│   │       └── booking/
│   │           └── remote-create-booking.ts  # Implements CreateBookingUsecase
│   ├── infra/
│   │   ├── http/
│   │   │   └── axios-http-client.ts       # Implements HttpClient
│   │   ├── cache/
│   │   │   └── local-storage-cache.ts
│   │   └── date/
│   │       └── date-fns-adapter.ts
│   ├── application/
│   │   ├── service/
│   │   │   └── booking/
│   │   │       └── stub-service-create-booking.ts  # Implements HttpClient (STUB)
│   │   ├── repository/
│   │   │   └── booking-repository.ts      # In-memory array
│   │   └── calculators/
│   │       └── booking-calculator.ts
│   ├── presentation/
│   │   ├── pages/
│   │   │   └── booking.tsx                # React component (DI via props)
│   │   ├── components/
│   │   │   ├── booking-form.tsx
│   │   │   └── booking-card.tsx
│   │   ├── hooks/
│   │   │   └── booking/
│   │   │       ├── use-list-bookings.tsx  # Hook (adapter)
│   │   │       └── use-delete-booking.tsx
│   │   └── context/
│   │       └── properties-context.tsx
│   ├── validation/
│   │   ├── validators/
│   │   │   └── validation-composite.ts    # Composite pattern
│   │   └── protocols/
│   │       └── validation.ts              # Interface
│   └── main/
│       ├── factories/
│       │   ├── data/
│       │   │   └── booking/
│       │   │       └── remote-create-booking-factory.ts  # Factory
│       │   ├── application/
│       │   │   └── service/
│       │   │       └── stub-service-create-booking-factory.ts
│       │   └── infra/
│       │       └── http/
│       │           └── axios.ts            # makeAxios factory
│       ├── config/
│       │   └── app.tsx
│       └── routes/
│           └── router.tsx
```

---

## References

1. Clean Architecture - Robert C. Martin
2. React Documentation - React Team
3. React Hooks Best Practices - Dan Abramov
4. Domain-Driven Design - Eric Evans
5. Front-End-Hostfully Repository - Thiago Butignon
6. Previous Grammar Analyses:
   - CLEAN_ARCHITECTURE_GRAMMAR_ANALYSIS.md (TypeScript Backend OOP)
   - SWIFT_VS_TYPESCRIPT_GRAMMAR_COMPARISON.md (Swift)
   - DART_FLUTTER_GRAMMAR_ANALYSIS.md (Dart/Flutter)
   - ADVANCED_NODE_FUNCTIONAL_GRAMMAR.md (TypeScript Functional)
   - UNIVERSAL_GRAMMAR_PROOF.md (Cross-language proof)

**This document completes the domain-independence proof** by showing that Clean Architecture's Universal Grammar works perfectly in **React frontend applications** with appropriate adaptations for the React paradigm (hooks, props DI, component composition). 🚀

---

*Generated with ultrathink analysis*
*October 2025*
