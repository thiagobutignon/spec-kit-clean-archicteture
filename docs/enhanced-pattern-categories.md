# Enhanced Pattern Extraction Categories

## Overview

The pattern extractor now analyzes **11 comprehensive categories** covering Clean Architecture, TDD, SOLID, DRY, Design Patterns, KISS/YAGNI, and Cross-Cutting Concerns.

## Pattern Categories

### 1. Clean Architecture Layers (5 categories)

#### Domain Layer (`domain`)
- Layer boundary violations
- Use case patterns
- Entity immutability
- No external dependencies
- Namespace patterns

#### Data Layer (`data`)
- Repository implementations
- Data source abstractions
- Layer isolation
- Naming conventions

#### Infrastructure Layer (`infra`)
- Adapter patterns
- Dependency injection
- External integrations
- Framework isolation

#### Presentation Layer (`presentation`)
- Controller patterns
- Request validation
- HTTP handling
- Single responsibility

#### Main Layer (`main`)
- Composition root
- Factory patterns
- Dependency wiring
- Application entry points

### 2. TDD Patterns (`tdd`)

**Test Structure:**
```yaml
- id: TDD001
  name: test-aaa-structure
  regex: 'describe\(.*\{[^}]*(?:const|let).*(?:expect|assert)'
  severity: medium
  description: 'Tests should follow AAA pattern (Arrange, Act, Assert)'
  examples:
    - violation: |
        test('should work', () => {
          expect(doSomething()).toBe(true) // Missing arrange
        })
    - fix: |
        test('should work', () => {
          // Arrange
          const sut = makeSut()
          const input = 'test'

          // Act
          const result = sut.execute(input)

          // Assert
          expect(result).toBe(expected)
        })
```

**Patterns Detected:**
- AAA (Arrange, Act, Assert) structure
- Test naming conventions (`should`, `describe`)
- Mock/Spy/Stub usage
- Test isolation
- Setup/Teardown patterns

### 3. SOLID Principles (`solid`)

#### Single Responsibility Principle (SRP)
```yaml
- id: SOL001
  name: class-multiple-responsibilities
  regex: 'class\s+\w+\s*\{[^}]*(?:save|update|delete|validate|send|log)'
  severity: high
  description: 'Class has multiple responsibilities (violates SRP)'
```

#### Open/Closed Principle (OCP)
```yaml
- id: SOL002
  name: switch-case-type-checking
  regex: 'switch\s*\([^)]*\.type\)|if\s*\([^)]*instanceof'
  severity: medium
  description: 'Type checking suggests OCP violation - use polymorphism'
```

#### Liskov Substitution (LSP)
```yaml
- id: SOL003
  name: interface-contract-violation
  regex: 'throw\s+new\s+(?:Error|Exception)\([^)]*not\s+implemented'
  severity: high
  description: 'Interface contract violation (LSP)'
```

#### Interface Segregation (ISP)
```yaml
- id: SOL004
  name: fat-interface
  regex: 'interface\s+\w+\s*\{(?:[^}]*\n){10,}'
  severity: medium
  description: 'Fat interface with too many methods (ISP violation)'
```

#### Dependency Inversion (DIP)
```yaml
- id: SOL005
  name: concrete-dependency
  regex: 'constructor\([^)]*:\s*(?!I)[A-Z]\w+(?:Service|Repository|Adapter)'
  severity: high
  description: 'Depending on concrete class instead of abstraction (DIP)'
```

### 4. DRY Violations (`dry`)

```yaml
- id: DRY001
  name: duplicated-validation-logic
  regex: 'if\s*\(!.*\.email.*@.*\)'
  severity: medium
  description: 'Duplicated email validation logic - extract to validator'

- id: DRY002
  name: repeated-error-handling
  regex: 'catch\s*\([^)]*\)\s*\{[^}]*console\.(error|log)'
  severity: low
  description: 'Repeated error handling pattern - centralize'
```

**Patterns Detected:**
- Code duplication
- Repeated validation
- Similar functions
- Copy-paste code blocks

### 5. Design Patterns (`design_patterns`)

#### Factory Pattern
```yaml
- id: DP001
  name: factory-method-pattern
  regex: 'make\w+(?:Controller|UseCase|Repository)'
  severity: low
  description: 'Factory method pattern usage'
```

#### Strategy Pattern
```yaml
- id: DP002
  name: strategy-pattern
  regex: 'interface\s+\w+Strategy\s*\{[^}]*execute'
  severity: low
  description: 'Strategy pattern implementation'
```

#### Repository Pattern
```yaml
- id: DP003
  name: repository-pattern
  regex: 'interface\s+\w+Repository\s*\{[^}]*(?:find|save|update|delete)'
  severity: medium
  description: 'Repository pattern for data access'
```

#### Observer Pattern
```yaml
- id: DP004
  name: observer-pattern
  regex: '(?:addEventListener|on|subscribe|emit)'
  severity: low
  description: 'Observer/Event pattern usage'
```

#### Singleton (Anti-pattern)
```yaml
- id: DP005
  name: singleton-antipattern
  regex: 'private\s+static\s+instance:|getInstance\(\)'
  severity: medium
  description: 'Singleton pattern detected - consider dependency injection'
```

#### God Object (Anti-pattern)
```yaml
- id: DP006
  name: god-object-antipattern
  regex: 'class\s+\w+\s*\{(?:[^}]*\n){50,}'
  severity: high
  description: 'God object detected - class too large (>50 lines)'
```

### 6. KISS/YAGNI (`kiss_yagni`)

```yaml
- id: KISS001
  name: unnecessary-complexity
  regex: '(?:abstract\s+class.*extends.*implements)|(?:class.*<T.*extends.*>)'
  severity: low
  description: 'Unnecessary abstraction - keep it simple'

- id: YAGNI001
  name: unused-method
  regex: 'private\s+\w+\([^)]*\)\s*\{(?:[^}]*\n){5,}\s*\}'
  severity: low
  description: 'Large private method possibly unused (YAGNI)'

- id: KISS002
  name: premature-optimization
  regex: '(?:memoize|cache|debounce|throttle)'
  severity: low
  description: 'Possible premature optimization - measure first'
```

**Patterns Detected:**
- Over-engineering
- Unnecessary abstractions
- Dead code
- Unused imports
- Premature optimization

### 7. Cross-Cutting Concerns (`cross_cutting`)

#### Logging
```yaml
- id: CC001
  name: inconsistent-logging
  regex: 'console\.(log|error|warn)'
  severity: low
  description: 'Direct console usage - use logging abstraction'
```

#### Error Handling
```yaml
- id: CC002
  name: generic-error-catch
  regex: 'catch\s*\(\s*(?:error|err|e)\s*\)\s*\{\s*\}'
  severity: high
  description: 'Empty catch block - handle errors properly'
```

#### Validation
```yaml
- id: CC003
  name: inline-validation
  regex: 'if\s*\(!.*\)\s*throw\s+new\s+Error'
  severity: medium
  description: 'Inline validation - extract to validator'
```

#### Security
```yaml
- id: CC004
  name: hardcoded-credentials
  regex: '(?:password|secret|key)\s*[:=]\s*["\'][^"\']{8,}'
  severity: critical
  description: 'Hardcoded credentials detected'

- id: CC005
  name: sql-injection-risk
  regex: '`SELECT.*\$\{.*\}`|"SELECT.*"\s*\+\s*'
  severity: critical
  description: 'SQL injection risk - use parameterized queries'
```

#### Performance
```yaml
- id: CC006
  name: missing-cache
  regex: 'fetch\(|axios\.|http\.'
  severity: low
  description: 'HTTP call without caching - consider caching strategy'

- id: CC007
  name: n-plus-one-query
  regex: 'for\s*\([^)]*\)\s*\{[^}]*(?:find|get|fetch)'
  severity: medium
  description: 'Possible N+1 query problem'
```

#### Transactions
```yaml
- id: CC008
  name: missing-transaction
  regex: '(?:save|update|delete).*(?:save|update|delete)'
  severity: high
  description: 'Multiple DB operations without transaction'
```

#### Monitoring
```yaml
- id: CC009
  name: missing-metrics
  regex: 'async\s+\w+\([^)]*\)\s*\{(?![^}]*(?:timer|metric|track))'
  severity: low
  description: 'Async operation without metrics/monitoring'
```

## Output Format

### Enhanced YAML Structure

```yaml
metadata:
  generated: '2025-01-05T15:30:45.123Z'
  source: './src'
  tool: 'The Regent Pattern Extractor'
  version: '2.0.0'

patterns:
  # Clean Architecture
  domain: [...]
  data: [...]
  infra: [...]
  presentation: [...]
  main: [...]

  # Quality Patterns
  tdd: [...]
  solid: [...]
  dry: [...]
  design_patterns: [...]
  kiss_yagni: [...]
  cross_cutting: [...]
```

### Enhanced Console Output

```
🚀 Clean Architecture Pattern Extractor
📁 Target: ./src
💾 Output: .regent/patterns/auto-generated.yaml

📂 Analyzing domain layer...
   Found 23 files (15 src, 8 tests)
   🤖 Analyzing with Claude...
   ✅ Extracted 7 patterns

... (other layers)

🎯 Analyzing quality patterns across codebase...

📊 Analyzing tdd patterns...
   Found 45 files (0 src, 45 tests)
   🤖 Analyzing with Claude...
   ✅ Extracted 12 patterns

📊 Analyzing solid patterns...
   Found 94 files (94 src, 0 tests)
   🤖 Analyzing with Claude...
   ✅ Extracted 15 patterns

📊 Analyzing dry patterns...
   ✅ Extracted 8 patterns

📊 Analyzing design_patterns patterns...
   ✅ Extracted 10 patterns

📊 Analyzing kiss_yagni patterns...
   ✅ Extracted 5 patterns

📊 Analyzing cross_cutting patterns...
   ✅ Extracted 18 patterns

✅ Pattern extraction complete!

📊 Clean Architecture Summary:
   Domain: 7 patterns
   Data: 4 patterns
   Infra: 3 patterns
   Presentation: 2 patterns
   Main: 2 patterns

🎯 Quality Patterns Summary:
   TDD: 12 patterns
   SOLID: 15 patterns
   DRY: 8 patterns
   Design Patterns: 10 patterns
   KISS/YAGNI: 5 patterns
   Cross-Cutting: 18 patterns

📈 Total: 86 patterns extracted

💾 Saved to: .regent/patterns/auto-generated.yaml
```

## Usage Examples

### Extract All Patterns
```bash
npx tsx .regent/scripts/extract-patterns.ts ./src .regent/patterns/comprehensive.yaml
```

### Integration with TheAuditor
```bash
# Extract patterns
npx tsx .regent/scripts/extract-patterns.ts ./src .regent/patterns/auto-generated.yaml

# Use with TheAuditor
aud full --patterns=.regent/patterns/auto-generated.yaml
```

### CI/CD Integration
```yaml
# .github/workflows/quality.yml
- name: Extract patterns
  run: npx tsx .regent/scripts/extract-patterns.ts ./src .patterns.yaml

- name: Validate with patterns
  run: npx tsx .regent/scripts/validate-patterns.ts .patterns.yaml
```

## Benefits

### Comprehensive Coverage
- ✅ 11 different quality dimensions
- ✅ 80+ patterns across all categories
- ✅ Best practices enforcement
- ✅ Anti-pattern detection

### Continuous Improvement
- ✅ Patterns evolve with codebase
- ✅ Team learns from extracted patterns
- ✅ Templates improve based on findings
- ✅ TheAuditor integration for security

### Developer Experience
- ✅ Clear violation examples
- ✅ Actionable fix suggestions
- ✅ Severity-based prioritization
- ✅ Automated enforcement
