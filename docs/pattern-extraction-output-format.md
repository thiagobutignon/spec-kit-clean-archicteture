# Pattern Extraction Output Format

## Overview

This document describes the output format of the pattern extraction script.

## Execution

```bash
npx tsx .regent/scripts/extract-patterns.ts ./src .regent/patterns/auto-generated.yaml
```

## Terminal Output

```
🚀 Clean Architecture Pattern Extractor
📁 Target: ./src
💾 Output: .regent/patterns/auto-generated.yaml

📂 Analyzing domain layer...
   Found 23 files (15 src, 8 tests)
   🤖 Analyzing with Claude...
   ✅ Extracted 3 patterns

📂 Analyzing data layer...
   Found 18 files (12 src, 6 tests)
   🤖 Analyzing with Claude...
   ✅ Extracted 2 patterns

📂 Analyzing infra layer...
   Found 31 files (20 src, 11 tests)
   🤖 Analyzing with Claude...
   ✅ Extracted 2 patterns

📂 Analyzing presentation layer...
   Found 14 files (9 src, 5 tests)
   🤖 Analyzing with Claude...
   ✅ Extracted 2 patterns

📂 Analyzing main layer...
   Found 8 files (6 src, 2 tests)
   🤖 Analyzing with Claude...
   ✅ Extracted 2 patterns

✅ Pattern extraction complete!
📊 Summary:
   Domain: 3 patterns
   Data: 2 patterns
   Infra: 2 patterns
   Presentation: 2 patterns
   Main: 2 patterns

💾 Saved to: .regent/patterns/auto-generated.yaml
```

## YAML Output Structure

### File: `.regent/patterns/auto-generated.yaml`

```yaml
metadata:
  generated: '2025-01-05T15:30:45.123Z'
  source: './src'
  tool: 'The Regent Pattern Extractor'
  version: '1.0.0'

patterns:
  domain:
    # Pattern 1: Use Case Pattern
    - id: DOM001
      name: use-case-single-execute-method
      regex: 'export\s+interface\s+\w+UseCase\s*\{[^}]*execute\s*\([^)]*\)\s*:\s*Promise'
      severity: high
      description: 'Use cases must have a single execute method returning Promise'
      examples:
        - violation: |
            // Bad: Multiple methods in use case
            export interface LoginUseCase {
              login(email: string): Promise<User>;
              logout(): Promise<void>;
            }
          fix: |
            // Good: Single execute method
            export interface LoginUseCase {
              execute(params: LoginParams): Promise<User>;
            }

    # Pattern 2: Layer Isolation
    - id: DOM002
      name: domain-layer-external-imports
      regex: 'import\s+.*\s+from\s+[''"](?:axios|express|fastify|@nestjs)'
      severity: critical
      description: 'Domain layer must not import external frameworks'
      examples:
        - violation: |
            // Bad: Importing HTTP framework in domain
            import { Request } from 'express';
            export class UserEntity {
              validate(req: Request) {}
            }
          fix: |
            // Good: Pure domain logic
            export class UserEntity {
              validate(email: string, password: string) {}
            }

    # Pattern 3: Immutability
    - id: DOM003
      name: entity-immutability
      regex: 'export\s+class\s+\w+Entity\s*\{[^}]*(?:public|private)\s+(?!readonly)\w+:'
      severity: medium
      description: 'Entity properties should be readonly for immutability'
      examples:
        - violation: |
            export class UserEntity {
              public id: string;
              public email: string;
            }
          fix: |
            export class UserEntity {
              public readonly id: string;
              public readonly email: string;
            }

  data:
    # Pattern 1: Repository Pattern
    - id: DAT001
      name: repository-interface-implementation
      regex: 'export\s+class\s+\w+Repository\s+implements\s+\w+Repository'
      severity: high
      description: 'Repository implementations must implement domain interfaces'
      examples:
        - violation: |
            // Bad: No interface
            export class UserRepository {
              async findById(id: string) {}
            }
          fix: |
            // Good: Implements interface
            export class UserRepositoryImpl implements UserRepository {
              async findById(id: string): Promise<User | null> {}
            }

    # Pattern 2: Data Source Abstraction
    - id: DAT002
      name: data-source-abstraction
      regex: 'export\s+interface\s+\w+DataSource'
      severity: medium
      description: 'Data sources should be abstracted as interfaces'
      examples:
        - violation: |
            // Bad: Direct database usage
            export class UserRepository {
              constructor(private db: PostgresClient) {}
            }
          fix: |
            // Good: Abstracted data source
            export interface UserDataSource {
              findById(id: string): Promise<UserModel | null>;
            }

  infra:
    # Pattern 1: Adapter Pattern
    - id: INF001
      name: http-adapter-pattern
      regex: 'export\s+class\s+\w+Adapter\s+implements\s+\w+Client'
      severity: high
      description: 'External HTTP clients should use adapter pattern'
      examples:
        - violation: |
            // Bad: Direct axios usage
            export class PaymentService {
              async pay() {
                const res = await axios.post('/pay');
              }
            }
          fix: |
            // Good: Adapter pattern
            export class HttpPaymentAdapter implements PaymentClient {
              constructor(private http: HttpClient) {}
              async pay(): Promise<PaymentResult> {}
            }

    # Pattern 2: Dependency Injection
    - id: INF002
      name: database-connection-injection
      regex: 'constructor\s*\([^)]*:\s*(?:Knex|Sequelize|TypeORM|Prisma)'
      severity: medium
      description: 'Database connections should be injected, not instantiated'
      examples:
        - violation: |
            export class PostgresAdapter {
              private db = new Knex({...config});
            }
          fix: |
            export class PostgresAdapter {
              constructor(private db: Knex) {}
            }

  presentation:
    # Pattern 1: Controller Pattern
    - id: PRE001
      name: controller-single-responsibility
      regex: 'export\s+class\s+\w+Controller\s*\{[^}]*handle\s*\('
      severity: high
      description: 'Controllers should have single handle method'
      examples:
        - violation: |
            export class UserController {
              create() {}
              update() {}
              delete() {}
            }
          fix: |
            export class CreateUserController {
              constructor(private useCase: CreateUserUseCase) {}
              async handle(request: HttpRequest): Promise<HttpResponse> {
                return this.useCase.execute(request.body);
              }
            }

    # Pattern 2: Request Validation
    - id: PRE002
      name: http-request-validation
      regex: 'async\s+handle\s*\([^)]*request[^)]*\)(?:(?!validate|schema|zod).)*\{'
      severity: medium
      description: 'HTTP handlers should validate request data'
      examples:
        - violation: |
            async handle(request: HttpRequest) {
              const result = await this.useCase.execute(request.body);
            }
          fix: |
            async handle(request: HttpRequest) {
              const validated = this.validator.validate(request.body);
              const result = await this.useCase.execute(validated);
            }

  main:
    # Pattern 1: Factory Pattern
    - id: MAI001
      name: factory-dependency-injection
      regex: 'export\s+(?:const|function)\s+make\w+Factory'
      severity: high
      description: 'Factories should use dependency injection pattern'
      examples:
        - violation: |
            export const makeLoginController = () => {
              const repo = new UserRepository();
              const useCase = new LoginUseCase(repo);
              return new LoginController(useCase);
            }
          fix: |
            export const makeLoginController = (
              repo: UserRepository
            ): LoginController => {
              const useCase = new LoginUseCase(repo);
              return new LoginController(useCase);
            }

    # Pattern 2: Composition Root
    - id: MAI002
      name: composition-root-imports
      regex: 'import\s+.*\s+from\s+[''"]@/(domain|data|infra|presentation)'
      severity: low
      description: 'Main layer should import from all other layers'
      examples:
        - violation: |
            // Missing imports from other layers
            import { SomeHelper } from './utils';
          fix: |
            // Proper composition root
            import { UserEntity } from '@/domain/entities';
            import { UserRepository } from '@/data/repositories';
            import { HttpClient } from '@/infra/http';
            import { UserController } from '@/presentation/controllers';
```

## Pattern Structure

Each pattern contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (e.g., "DOM001") |
| `name` | string | Kebab-case pattern name |
| `regex` | string | Regular expression for detection |
| `severity` | enum | critical \| high \| medium \| low |
| `description` | string | What the pattern detects |
| `examples` | array | Optional violation/fix examples |

## Severity Levels

- **critical**: Must be fixed immediately (e.g., framework imports in domain)
- **high**: Should be fixed soon (e.g., missing interfaces)
- **medium**: Should be improved (e.g., missing readonly)
- **low**: Nice to have (e.g., import organization)

## Integration with TheAuditor

These patterns can be used by TheAuditor for validation:

```yaml
# TheAuditor will load these patterns
theauditor:
  patterns:
    - .regent/patterns/auto-generated.yaml
    - .regent/patterns/custom.yaml
```

## Next Steps

After extraction:

1. **Review patterns** - Check if patterns are accurate
2. **Validate patterns** - Run validation script
3. **Apply to generation** - Use in code generation
4. **Feed to TheAuditor** - Use for security validation

```bash
# Validate extracted patterns
npx tsx .regent/scripts/validate-patterns.ts

# Use in code generation
/03-generate-layer-code --use-patterns=auto-generated

# TheAuditor integration
aud full --patterns=.regent/patterns/auto-generated.yaml
```
