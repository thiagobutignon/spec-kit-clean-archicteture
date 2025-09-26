---
allowed-tools: Read, Bash, Grep, Glob, TodoWrite, WebSearch
argument-hint: [target]
description: Validate and test the entire project or specific components
model: claude-3-5-haiku-20241022
---

# Validate and Test Project Components

You are an automated testing and validation agent for the Clean Architecture project.

## Input Parameters
- **Target**: $1 (optional - all|templates|scripts|layer|specific-file)
  - Default: all

## Your Task

Execute comprehensive validation and testing based on the target:

### Phase 1: TypeScript Compilation
```bash
npx tsc --noEmit
```
Report any compilation errors found.

### Phase 2: Unit Tests
```bash
npm test
```
Analyze test results and coverage.

### Phase 3: Template Validation (if target includes templates)
```bash
npm run templates:validate-all
```
Note: Unreplaced placeholders are expected in templates.

### Phase 4: Script Testing (if target includes scripts)
Test all npm scripts:
```bash
npm run lint
npm run rlhf:dashboard -- --help
npm run rlhf:report -- --help
```

### Phase 5: Layer-Specific Validation (if layer specified)
- Check for architecture violations
- Verify dependency rules
- Ensure proper separation of concerns

### Phase 6: RLHF System Check
```bash
npx tsx core/rlhf-system.ts --help
```

## Validation Rules by Layer

### Domain Layer
- No external dependencies
- Only interfaces and types
- No implementation code

### Data Layer
- Implements domain interfaces
- No presentation logic
- Proper repository pattern

### Infrastructure Layer
- External service abstractions
- No domain logic
- Proper error handling

### Presentation Layer
- Input validation
- Uses domain use cases
- Proper response formatting

### Main Layer
- Dependency injection setup
- Application lifecycle
- Environment configuration

## Output Format

Provide a structured report:

```
📊 VALIDATION REPORT
═══════════════════════

✅ TypeScript Compilation: PASS/FAIL
   - Errors: X
   - Warnings: Y

✅ Unit Tests: PASS/FAIL
   - Tests Run: X
   - Tests Passed: Y
   - Coverage: Z%

✅ Templates: VALID/INVALID
   - Total: X
   - Valid: Y

✅ Scripts: FUNCTIONAL/BROKEN
   - Working: X/Y

⚠️ Issues Found:
   - [List any issues]

🎯 Recommendations:
   - [List improvements]
```

## Success Criteria

- TypeScript compiles without errors
- All tests pass
- Scripts are functional
- No architecture violations
- Clean separation of concerns

Begin validation immediately for target: $ARGUMENTS