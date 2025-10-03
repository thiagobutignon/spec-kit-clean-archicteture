    # =============================================================================

    # ABSOLUTE PRIORITY INSTRUCTIONS - READ THIS FIRST

    # =============================================================================

    #

    # CRITICAL: This YAML contains architectural patterns extracted from a

    # production codebase. You MUST follow these patterns EXACTLY.

    #

    # OUTPUT FORMAT REQUIRED:

    # You MUST respond with VALID YAML in this EXACT structure:

    #

    # steps:

    # - id: step-1

    # type: create_file  # REQUIRED: create_file, refactor_file, delete_file, validation, or test

    # layer: domain

    # description: "What this step does"

    # path: "src/domain/models/example.ts"

    # template: |

    # [actual TypeScript code here]

    # - id: step-2

    # type: create_file

    # layer: data

    # path: "src/data/protocols/example.ts"

    # template: |

    # [actual TypeScript code here]

    # ...

    #

    # DO NOT:

    # - Generate microservices architecture

    # - Generate MVC pattern

    # - Use markdown code blocks (```)

    # - Add explanatory text outside YAML structure

    # - Use generic HttpRequest<T> (use namespace Request types)

    # - Skip any mandatory patterns

    # - Forget to add 'type' field in each step

    #

    # DO:

    # - Return ONLY valid YAML

    # - Follow patterns DOM001-MAIN006 exactly

    # - Generate complete, working code in each file

    # - Use exact naming conventions (Db prefix, Repository suffix)

    # - Include ALL files needed for each step

    # - Always add 'type' field: create_file, refactor_file, delete_file, validation, or test

    #

    # =============================================================================

    metadata:
    generated: 2025-10-02T00:00:00.000Z
    source: clean-ts-api/src
    tool: The Regent Pattern Extractor
    version: 2.0.0
    description: Extracted patterns with step-by-step YAML output
    strictMode: true
    overrideTrainingData: true
    outputFormat: yaml

    outputInstructions:
    format: |
    Your response MUST be valid YAML with this structure:

        metadata:
        feature: "Feature name"
        domain: "Business domain"
        estimatedFiles: number

        steps:
        - id: "step-1-domain-models"
            type: "create_file"
            layer: "domain"
            description: "Create domain models"
            path: "src/domain/models/model-name.ts"
            template: |
            [complete TypeScript code]
            validation:
            patterns: ["DOM004"]
            command: "tsc --noEmit"

        - id: "step-2-domain-usecases"
            type: "create_file"
            layer: "domain"
            description: "Create use case interfaces"
            path: "src/domain/usecases/use-case.ts"
            template: |
            [complete TypeScript code]
            validation:
            patterns: ["DOM001", "DOM002"]
            command: "tsc --noEmit && yarn lint"

        dependencies:
        npm:
            - "express@^4.18.0"
            - "typescript@^5.0.0"

    rules: - "Output MUST be valid YAML only" - "NO markdown code blocks" - "NO explanatory text outside YAML" - "Each step MUST have validation patterns"
    - "Each step creates ONE file using 'path' and 'template' fields"
    - "Use 'path' field for file location, 'template' field for file content"
    - "Each template MUST have complete code"
    - "Follow layer execution order: domain → data → infra → presentation → main"

    validationRules:
    beforeGeneration: - "Confirm you will output ONLY valid YAML" - "Confirm you understand step-by-step structure required" - "Confirm you will NOT use microservices architecture" - "Confirm each step will have a 'type' field"

    afterGeneration: - "Verify output is valid YAML" - "Verify all steps follow layer order" - "Verify all steps have 'type' field" - "Verify all mandatory patterns are applied" - "Verify each file has complete working code"
    patterns:
    domain: - id: DOM001
    name: use-case-single-method-interface
    regex: export interface \w+\s*\{[\s\S]*?(?:execute|add|load|save|check|auth):\s*\([^)]*\)\s*=>\s*Promise<
    severity: high
    description: Use cases must be interfaces with a single method that returns a Promise
    examples: - violation: |
    export interface AddAccount {
    add: (account: any) => any
    }
    fix: |
    export interface AddAccount {
    add: (account: AddAccount.Params) => Promise<AddAccount.Result>
    }

        - id: DOM002
        name: use-case-namespace-for-types
        regex: export namespace \w+\s*\{[\s\S]*?export type (Params|Result)
        severity: medium
        description: Use cases should use namespaces to define Params and Result types
        examples:
            - violation: |
                export interface AddAccount {
                add: (account: { name: string }) => Promise<boolean>
                }
            fix: |
                export interface AddAccount {
                add: (account: AddAccount.Params) => Promise<AddAccount.Result>
                }
                export namespace AddAccount {
                export type Params = { name: string }
                export type Result = boolean
                }

        - id: DOM003
        name: no-external-dependencies
        regex: from ['"](?!@/domain)
        severity: critical
        description: Domain layer must not import from other layers (data, infra, presentation, validation)
        examples:
            - violation: |
                import { Repository } from '@/data/protocols'
            fix: |
                // Domain should only import from @/domain

        - id: DOM004
        name: model-as-type-not-class
        regex: export type \w+Model\s*=\s*\{
        severity: medium
        description: Domain models should be defined as types, not classes
        examples:
            - violation: |
                export class SurveyModel {
                id: string
                }
            fix: |
                export type SurveyModel = {
                id: string
                }

    data: - id: DAT001
    name: use-case-implementation-class
    regex: export class Db\w+\s+implements\s+\w+\s\*\{
    severity: high
    description: Data layer use case implementations should be prefixed with Db and implement domain interfaces
    examples: - violation: |
    export class AddAccount implements AddAccount {
    fix: |
    export class DbAddAccount implements AddAccount {

        - id: DAT002
        name: constructor-dependency-injection
        regex: constructor\s*\([^)]*private readonly
        severity: high
        description: Data layer classes must use constructor dependency injection with private readonly
        examples:
            - violation: |
                constructor(hasher: Hasher) {
                this.hasher = hasher
                }
            fix: |
                constructor(
                private readonly hasher: Hasher
                ) {}

        - id: DAT003
        name: protocol-interface-in-data
        regex: export interface \w+(Repository|Hasher|Encrypter|Decrypter|Comparer)\s*\{
        severity: medium
        description: Data layer protocols should use Repository, Hasher, Encrypter, Decrypter, or Comparer suffixes
        examples:
            - violation: |
                export interface AccountData {
            fix: |
                export interface AccountRepository {

        - id: DAT004
        name: repository-namespace-types
        regex: export namespace \w+Repository\s*\{[\s\S]*?export type (Params|Result)
        severity: medium
        description: Repository interfaces should use namespaces for Params and Result types
        examples:
            - violation: |
                export interface AddAccountRepository {
                add: (data: any) => Promise<boolean>
                }
            fix: |
                export interface AddAccountRepository {
                add: (data: AddAccountRepository.Params) => Promise<AddAccountRepository.Result>
                }
                export namespace AddAccountRepository {
                export type Params = AddAccount.Params
                export type Result = boolean
                }

        - id: DAT005
        name: no-presentation-imports
        regex: from ['"]@/presentation
        severity: critical
        description: Data layer must not import from presentation layer
        examples:
            - violation: |
                import { Controller } from '@/presentation/protocols'
            fix: |
                // Remove presentation imports from data layer

    infra: - id: INF001
    name: adapter-suffix-naming
    regex: export class \w+Adapter\s+implements
    severity: medium
    description: Infrastructure implementations should use Adapter suffix
    examples: - violation: |
    export class BcryptHasher implements Hasher {
    fix: |
    export class BcryptAdapter implements Hasher {

        - id: INF002
        name: repository-implements-multiple-interfaces
        regex: export class \w+Repository\s+implements\s+\w+Repository(?:,\s*\w+Repository)+
        severity: low
        description: Repository can implement multiple repository interfaces
        examples:
            - violation: |
                export class AccountRepo implements AddAccountRepository {
            fix: |
                export class AccountMongoRepository implements AddAccountRepository, LoadAccountByEmailRepository {

        - id: INF003
        name: external-lib-only-in-infra
        regex: import\s+.+\s+from\s+['"](?!@/)(bcrypt|mongodb|jsonwebtoken|validator)['"]
        severity: high
        description: External library imports (bcrypt, mongodb, etc) should only exist in infra layer
        examples:
            - violation: |
                // In domain or data layer
                import bcrypt from 'bcrypt'
            fix: |
                // In infra layer
                import bcrypt from 'bcrypt'
                export class BcryptAdapter implements Hasher {

        - id: INF004
        name: no-domain-imports-in-infra
        regex: from ['"]@/domain/(?!models)
        severity: medium
        description: Infrastructure should only import domain models, not use cases
        examples:
            - violation: |
                import { AddAccount } from '@/domain/usecases'
            fix: |
                import { SurveyModel } from '@/domain/models'

    presentation: - id: PRE001
    name: controller-implements-interface
    regex: export class \w+Controller\s+implements\s+Controller
    severity: high
    description: Controllers must implement the Controller interface
    examples: - violation: |
    export class SignUpController {
    fix: |
    export class SignUpController implements Controller {

        - id: PRE002
        name: controller-handle-method
        regex: async handle\s*\(request:\s*\w+\):\s*Promise<HttpResponse>
        severity: critical
        description: Controllers must have an async handle method that returns Promise<HttpResponse>
        examples:
            - violation: |
                handle(request: any): any {
            fix: |
                async handle(request: SignUpController.Request): Promise<HttpResponse> {

        - id: PRE003
        name: middleware-implements-interface
        regex: export class \w+Middleware\s+implements\s+Middleware
        severity: high
        description: Middlewares must implement the Middleware interface
        examples:
            - violation: |
                export class AuthMiddleware {
            fix: |
                export class AuthMiddleware implements Middleware {

        - id: PRE004
        name: error-classes-extend-error
        regex: export class \w+Error\s+extends\s+Error
        severity: medium
        description: Custom error classes should extend Error
        examples:
            - violation: |
                export class InvalidParamError {
            fix: |
                export class InvalidParamError extends Error {

        - id: PRE005
        name: no-direct-use-case-calls
        regex: import\s+.*\s+from\s+['"]@/data/usecases['"]
        severity: critical
        description: Presentation layer should import use cases from domain, not data
        examples:
            - violation: |
                import { DbAddAccount } from '@/data/usecases'
            fix: |
                import { AddAccount } from '@/domain/usecases'

    validation: - id: VAL001
    name: validation-implements-interface
    regex: export class \w+Validation\s+implements\s+Validation
    severity: high
    description: Validation classes must implement the Validation interface
    examples: - violation: |
    export class EmailValidation {
    fix: |
    export class EmailValidation implements Validation {

        - id: VAL002
        name: validation-single-validate-method
        regex: validate\s*\(input:\s*any\):\s*Error
        severity: high
        description: Validation classes must have a validate method that returns Error or void
        examples:
            - violation: |
                validate(input: any): boolean {
            fix: |
                validate(input: any): Error {

        - id: VAL003
        name: composite-pattern-for-validations
        regex: export class ValidationComposite\s+implements\s+Validation
        severity: medium
        description: Use composite pattern to combine multiple validations
        examples:
            - violation: |
                // Multiple validation checks in controller
            fix: |
                export class ValidationComposite implements Validation {
                constructor(private readonly validations: Validation[]) {}
                }

        - id: VAL004
        name: validation-errors-from-presentation
        regex: from ['"]@/presentation/errors['"]
        severity: low
        description: Validation layer can import errors from presentation layer
        examples:
            - violation: |
                throw new Error('Invalid param')
            fix: |
                import { InvalidParamError } from '@/presentation/errors'
                return new InvalidParamError(fieldName)

    main: - id: MAIN001
    name: factory-function-returns-interface
    regex: export const make\w+\s*=\s*\([^)]_\):\s_\w+\s\*=>
    severity: high
    description: Factory functions should return domain interfaces, not concrete classes
    examples: - violation: |
    export const makeDbAddAccount = (): DbAddAccount => {
    fix: |
    export const makeDbAddAccount = (): AddAccount => {

        - id: MAIN002
        name: factory-naming-convention
        regex: export const make\w+
        severity: medium
        description: Factory functions should start with 'make' prefix
        examples:
            - violation: |
                export const createAddAccount = () => {
            fix: |
                export const makeAddAccount = () => {

        - id: MAIN003
        name: controller-decorator-pattern
        regex: export class \w+Decorator\s+implements\s+Controller
        severity: medium
        description: Use decorator pattern for cross-cutting concerns like logging
        examples:
            - violation: |
                // Logging inside controller
            fix: |
                export class LogControllerDecorator implements Controller {
                constructor(
                    private readonly controller: Controller,
                    private readonly logErrorRepository: LogErrorRepository
                ) {}
                }

        - id: MAIN004
        name: adapter-pattern-for-frameworks
        regex: export const \w+Adapter\s*=
        severity: high
        description: Use adapter pattern to integrate with external frameworks (Express, Apollo)
        examples:
            - violation: |
                app.post('/signup', (req, res) => {
                const controller = new SignUpController()
            fix: |
                app.post('/signup', expressRouteAdapter(makeSignUpController()))

        - id: MAIN005
        name: middleware-adapter-pattern
        regex: export const \w+MiddlewareAdapter
        severity: medium
        description: Use adapter pattern for middlewares to integrate with frameworks
        examples:
            - violation: |
                app.use((req, res, next) => {
            fix: |
                app.use(expressMiddlewareAdapter(makeAuthMiddleware()))

        - id: MAIN006
        name: dependency-composition-in-main
        regex: export const make\w+\s*=.*new \w+\(
        severity: high
        description: Main layer is responsible for composing all dependencies
        examples:
            - violation: |
                // Dependencies created inside use cases
            fix: |
                export const makeDbAddAccount = (): AddAccount => {
                const hasher = new BcryptAdapter(12)
                const repository = new AccountMongoRepository()
                return new DbAddAccount(hasher, repository)
                }

    crossCuttingConcerns:

    - id: CCC001
    name: path-alias-usage
    regex: from ['"]@/
    severity: low
    description: Use path aliases (@/) instead of relative imports
    applies: all
    examples:

    - violation: |
        import { AddAccount } from '../../../domain/usecases'
        fix: |
        import { AddAccount } from '@/domain/usecases'

    - id: CCC002
    name: barrel-exports
    regex: export \* from ['"]\.
    severity: low
    description: Use barrel exports (index.ts) to simplify imports
    applies: all
    examples:
    - violation: |
        import { AddAccount } from './add-account'
        import { LoadAccount } from './load-account'
        fix: |
        // In index.ts
        export _ from './add-account'
        export _ from './load-account'

    dependencyRules:
    allowed:
    domain: []
    data: - '@/domain'
    infra: - '@/data' - '@/domain/models' - 'external-libs'
    presentation: - '@/domain' - '@/validation'
    validation: - '@/presentation/protocols' - '@/presentation/errors'
    main: - '@/domain' - '@/data' - '@/infra' - '@/presentation' - '@/validation'

    forbidden:
    domain: - '@/data' - '@/infra' - '@/presentation' - '@/validation' - '@/main'
    data: - '@/infra' - '@/presentation' - '@/validation' - '@/main'
    infra: - '@/presentation' - '@/validation' - '@/main'
    presentation: - '@/data' - '@/infra' - '@/main'
    validation: - '@/domain' - '@/data' - '@/infra' - '@/main'
    criticalInstructions:

    - "NEVER use HttpRequest<T> generic syntax"
    - "ALWAYS use namespace Request types in controllers"
    - "NEVER import from @/data in domain layer"
    - "ALWAYS use Db prefix for data layer implementations"
    - "NEVER use microservices folder structure"
    - "ALWAYS use the 5-layer structure: domain/data/infra/presentation/main"

    exampleCodebaseStructure: |
    src/
    ├── domain/ # Pure business logic - NO external dependencies
    ├── data/ # Use case implementations with Db prefix
    ├── infra/ # External adapters (database, http, etc)
    ├── presentation/ # Controllers with namespace Request types
    └── main/ # Factories and dependency injection

    # End of pattern definitions

    executionOrder:
    description: "Steps MUST follow this layer order"
    sequence:
    1: "domain - models and use case interfaces"
    2: "domain - use case interfaces with namespaces"
    3: "data - protocols (repository interfaces)"
    4: "data - use case implementations (Db prefix)"
    5: "infra - adapters for external dependencies"
    6: "presentation - controllers with namespace Request"
    7: "validation - validators and composites"
    8: "main - factories for dependency injection"
    9: "main - server setup and routes"

    exampleOutput: |
    metadata:
    feature: "User Authentication"
    domain: "Authentication"
    estimatedFiles: 12

    steps:
    - id: "step-1-domain-models"
        type: "create_file"
        layer: "domain"
        description: "Create User model as type"
        path: "src/domain/models/user-model.ts"
        template: |
        export type UserModel = {
            id: string
            name: string
            email: string
        }
        validation:
        patterns: ["DOM004"]
        command: "tsc --noEmit"

    - id: "step-2-domain-usecase"
        type: "create_file"
        layer: "domain"
        description: "Create Authentication use case interface"
        path: "src/domain/usecases/authentication.ts"
        template: |
        import { type UserModel } from '@/domain/models'

        export interface Authentication {
            auth: (params: Authentication.Params) => Promise<Authentication.Result>
        }

        export namespace Authentication {
            export type Params = {
            email: string
            password: string
            }
            export type Result = {
            accessToken: string
            user: UserModel
            }
        }
        validation:
        patterns: ["DOM001", "DOM002", "DOM003"]
        command: "tsc --noEmit && yarn lint"

    criticalReminders:

    - "OUTPUT MUST BE VALID YAML ONLY"
    - "NO markdown, NO code blocks, NO explanatory text"
    - "Each step = complete working code"
    - "Each step MUST have 'type' field (create_file, refactor_file, delete_file, validation, or test)"
    - "Follow layer order: domain → data → infra → presentation → main"
    - "Apply ALL mandatory patterns"
    - "Use namespace Request types in controllers"
    - "Never use generic HttpRequest<T>"
