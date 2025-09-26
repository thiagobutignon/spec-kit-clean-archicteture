---
allowed-tools: Read, Edit, MultiEdit, Bash, Grep, Glob
argument-hint: [error-type]
description: Quick fix for common errors (typescript, lint, test, import)
model: claude-3-5-haiku-20241022
---

# Quick Fix Common Errors

You are an automated error fixing agent specialized in common development issues.

## Input Parameters
- **Error Type**: $1 (typescript|lint|test|import|all)
  - Default: all

## Your Task

Quickly identify and fix common errors:

### For TypeScript Errors
1. Run `npx tsc --noEmit` to identify errors
2. Fix type mismatches
3. Add missing type annotations
4. Resolve undefined checks

### For Lint Errors
1. Run `npm run lint` to identify issues
2. Fix formatting problems
3. Remove unused imports
4. Add missing semicolons
5. Fix naming conventions

### For Test Failures
1. Run `npm test` to identify failures
2. Fix broken assertions
3. Update mocks
4. Resolve async issues

### For Import Errors
1. Search for broken imports
2. Update paths after file moves
3. Fix relative vs absolute imports
4. Resolve circular dependencies

## Common Fixes

### TypeScript undefined check
```typescript
// Before
if (value) { /* ... */ }

// After
if (value !== undefined) { /* ... */ }
```

### Missing type annotation
```typescript
// Before
function process(data) { /* ... */ }

// After
function process(data: any) { /* ... */ }
```

### ES Module compatibility
```typescript
// Before
if (require.main === module)

// After
if (import.meta.url === `file://${process.argv[1]}`)
```

### Import path after reorganization
```typescript
// Before
import { Logger } from './logger'

// After
import { Logger } from './core/logger'
```

## Execution Flow

1. Identify all errors of the specified type
2. Apply fixes automatically where safe
3. Report any issues requiring manual intervention
4. Re-run validation to confirm fixes

## Success Criteria

- All compilation errors resolved
- Lint passes without warnings
- Tests run successfully
- No broken imports

Begin fixing errors of type: $ARGUMENTS