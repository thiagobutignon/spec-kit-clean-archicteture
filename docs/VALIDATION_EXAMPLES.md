# Validation Examples

## Schema Validation Examples

### 1. Successful Validation

```yaml
version: "1.0.0"
metadata:
  title: "User Authentication Feature"
  description: "Implements user authentication with JWT"
  source: "auth.template.yaml"
  lastUpdated: "2024-01-15"
  layers:
    - domain
    - data
```

**Result:** ✅ All fields valid

### 2. Failed Validation - Unreplaced Placeholders

```yaml
version: "1.0.0"
metadata:
  title: "__FEATURE_NAME__ Implementation"  # ❌ Unreplaced placeholder
  description: "Implements __FEATURE_NAME__"  # ❌ Unreplaced placeholder
  source: "template.yaml"
  lastUpdated: "__CURRENT_DATE__"  # ❌ Invalid date format
```

**Validation Output:**
```
❌ Template validation failed!

❌ Errors:
  Unreplaced placeholders detected:
    - metadata.title: __FEATURE_NAME__
    - metadata.description: __FEATURE_NAME__
    - metadata.lastUpdated: __CURRENT_DATE__
  Invalid date format: __CURRENT_DATE__. Use YYYY-MM-DD format.

⚠️ Please replace all placeholders before executing the template.
```

### 3. Step Dependencies Example

```yaml
steps:
  - id: "create-domain-models"
    type: "create_file"
    description: "Create domain models"
    # No dependencies - can run immediately

  - id: "create-use-cases"
    type: "create_file"
    description: "Create use case interfaces"
    depends_on: ["create-domain-models"]  # Waits for models

  - id: "create-tests"
    type: "create_file"
    description: "Create unit tests"
    depends_on:
      - "create-domain-models"
      - "create-use-cases"  # Waits for both

  - id: "run-tests"
    type: "validation"
    description: "Run all tests"
    depends_on: ["create-tests"]  # Sequential dependency
```

**Execution Order:**
1. `create-domain-models` (no dependencies)
2. `create-use-cases` (after models complete)
3. `create-tests` (after both models and use-cases)
4. `run-tests` (after tests are created)

### 4. Error Handling with Rollback Example

```yaml
steps:
  - id: "create-database"
    type: "create_file"
    description: "Create database schema"
    error_handling:
      retry_count: 2
      retry_delay: 1000
      fallback_strategy: "rollback"
      rollback_steps: []  # Nothing to rollback

  - id: "seed-data"
    type: "create_file"
    description: "Seed initial data"
    depends_on: ["create-database"]
    error_handling:
      retry_count: 3
      retry_delay: 2000
      fallback_strategy: "rollback"
      rollback_steps: ["create-database"]  # Rollback database on failure
      on_rollback_failure: "alert"  # Alert if rollback fails

  - id: "create-api"
    type: "create_file"
    description: "Create API endpoints"
    depends_on: ["seed-data"]
    error_handling:
      retry_count: 1
      retry_delay: 500
      fallback_strategy: "rollback"
      rollback_steps:
        - "seed-data"
        - "create-database"  # Rollback in LIFO order
      on_rollback_failure: "stop"
```

**Failure Scenario:**
- If `create-api` fails after retries:
  1. Execute rollback for `seed-data` (LIFO - most recent first)
  2. Execute rollback for `create-database`
  3. If any rollback fails with `on_rollback_failure: "stop"`, halt process

### 5. Semantic Version Validation

**Valid Versions:**
- ✅ `1.0.0` - Standard version
- ✅ `2.1.3` - Major.Minor.Patch
- ✅ `1.0.0-alpha` - Pre-release
- ✅ `1.0.0-beta.1` - Pre-release with version
- ✅ `1.0.0+20130313144700` - Build metadata
- ✅ `1.0.0-alpha+001` - Pre-release + build

**Invalid Versions:**
- ❌ `1.0` - Missing patch version
- ❌ `01.0.0` - Leading zeros
- ❌ `1.0.0.0` - Too many components
- ❌ `v1.0.0` - No 'v' prefix allowed

### 6. Date Format Validation

**Valid Dates:**
- ✅ `2024-01-15` - Standard format
- ✅ `2023-12-31` - End of year
- ✅ `2024-02-29` - Leap year

**Invalid Dates:**
- ❌ `2024/01/15` - Wrong separator
- ❌ `15-01-2024` - Wrong order
- ❌ `2024-1-15` - Missing leading zeros
- ❌ `2024-13-01` - Invalid month
- ❌ `2024-02-30` - Invalid day for February

### 7. Layer Rules Validation

```yaml
rules:
  domain:
    allowed:
      - "Type definitions"
      - "Use case interfaces"
    forbidden:
      - "HTTP operations"
      - "Database queries"
    use_case:
      must:
        - "Have single execute() method"
      must_not:
        - "Have multiple methods"

  data:  # ✅ Required fields present
    must:
      - "Implement domain interfaces"
    must_not:
      - "Import from infrastructure"

  # ❌ Missing required fields - will fail validation
  infra:
    must: []  # ❌ Empty array (minItems: 1)
```

### 8. Pre-execution Validation Output Example

Running: `npm run validate templates/user-auth.regent`

**Success Output:**
```
📋 Validating template: templates/user-auth.regent
✅ All placeholders have been replaced successfully.
✅ Template validation successful!
```

**Failure Output:**
```
📋 Validating template: templates/incomplete.regent

❌ Validation Failed: Unreplaced placeholders found

Found 3 unique placeholder(s):
  - __FEATURE_NAME__
  - __USE_CASE__
  - __CURRENT_DATE__

Locations:

📍 metadata.title:
   Value: "__FEATURE_NAME__ Clean Architecture Implementation"
   Placeholders: __FEATURE_NAME__

📍 metadata.lastUpdated:
   Value: "__CURRENT_DATE__"
   Placeholders: __CURRENT_DATE__

📍 steps[0].path:
   Value: "src/features/__FEATURE_NAME__/domain/use-cases/__USE_CASE__.ts"
   Placeholders: __FEATURE_NAME__, __USE_CASE__

⚠️ Please replace all placeholders before executing the template.

❌ Errors:
  Invalid semantic version: 1.0
  Invalid date format: __CURRENT_DATE__. Use YYYY-MM-DD format.
  Step 2 is missing 'id' field
  Layer 'validation' declared in metadata but not defined in structure

⚠️ Warnings:
  Step 3 (create-tests) is missing description
  Dependency validation requires code analysis (not implemented)
```

## Validation Command Examples

```bash
# Basic validation
npm run validate templates/my-template.regent

# Verbose output
npm run validate templates/my-template.regent --verbose

# Validate specific checks only
npm run validate templates/my-template.regent --check-placeholders
npm run validate templates/my-template.regent --check-schema
npm run validate templates/my-template.regent --check-dependencies

# Validate all templates in directory
npm run validate:all templates/
```

## Integration with CI/CD

```yaml
# .github/workflows/validate-templates.yml
name: Validate Templates

on:
  pull_request:
    paths:
      - 'templates/**/*.regent'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Validate templates
        run: npm run validate:all templates/

      - name: Report validation results
        if: failure()
        run: |
          echo "❌ Template validation failed!"
          echo "Please fix validation errors before merging."
```