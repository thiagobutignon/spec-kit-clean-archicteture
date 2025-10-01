---
title: "Validate Generated Code"
description: "Run architectural validation tools on generated code to calculate actual RLHF score and compare with estimated score"
category: "layer"
stage: "validation"
priority: 7
tags:
  - code-validation
  - quality-assurance
  - rlhf-scoring
  - eslint
  - dependency-cruiser
  - architectural-validation
parameters:
  input:
    type: "path"
    description: "Directory containing generated code"
    required: true
  estimated_score:
    type: "number"
    description: "Estimated RLHF score from /04-reflect-layer-lessons"
    range: "-2 to +2"
    required: false
  output:
    type: "json"
    format: '{"status": "PASSED|FAILED", "actual_rlhf_score": number, "estimated_rlhf_score": number, "violations": [], "comparison": "string"}'
validation_tools:
  - "ESLint (code style and boundaries)"
  - "dependency-cruiser (architectural rules)"
  - "TypeScript compiler (type safety)"
timing:
  runs_after: "/06-execute-layer-steps"
  phase: "Post-Execution Validation"
  prerequisite: "Generated code must exist"
previous_command: "/06-execute-layer-steps"
next_command: "/08-fix-layer-errors (if validation fails)"
---

# Task: Validate Generated Code

## 🎯 Objective

Run architectural validation tools on the **generated code** (after `/06` execution) to:
1. Calculate the **actual RLHF score** based on code quality
2. Compare **estimated** (from `/04`) vs **actual** score
3. Detect architectural violations, style issues, and type errors
4. Provide actionable feedback for improvements

## ⏰ Timing & Context

| Phase | Command | What Exists | Validation Type |
|-------|---------|-------------|-----------------|
| Phase 4 | `/04-reflect-layer-lessons` | **YAML only** | Reflective analysis (estimated score) |
| Phase 6 | `/06-execute-layer-steps` | **Code generated** | Execution phase |
| **Phase 7** | **`/07-validate-generated-code`** | **Generated code** | **Actual validation** |

**Key Insight**: This command validates **generated code**, not YAML files.

## 1. Prerequisites Check

Before running validation tools, verify:

### 1.1 Check if Generated Code Exists

```bash
# Verify the target directory has generated files
if [ ! -d "src/features/__FEATURE__/__LAYER__" ]; then
  echo "❌ ERROR: No generated code found"
  echo "   Run /06-execute-layer-steps first"
  exit 1
fi

echo "✅ Generated code exists"
```

### 1.2 Check if Validation Scripts Exist

```bash
# Check if validation tools are configured
if ! npm run --silent 2>&1 | grep -q "lint"; then
  echo "⚠️ WARNING: npm run lint not configured"
  LINT_AVAILABLE=false
else
  LINT_AVAILABLE=true
fi

if ! npm run --silent 2>&1 | grep -q "arch:validate"; then
  echo "⚠️ WARNING: npm run arch:validate not configured"
  ARCH_AVAILABLE=false
else
  ARCH_AVAILABLE=true
fi
```

## 2. Run Validation Tools

### 2.1 ESLint Validation (Code Style & Boundaries)

```bash
if [ "$LINT_AVAILABLE" = true ]; then
  echo "🔍 Running ESLint..."

  # Run ESLint and capture output
  if npm run lint -- --format json > eslint-results.json 2>&1; then
    LINT_VIOLATIONS=0
    echo "✅ ESLint: 0 violations"
  else
    LINT_VIOLATIONS=$(cat eslint-results.json | jq '[.[] | .messages | length] | add // 0')
    echo "❌ ESLint: $LINT_VIOLATIONS violations"

    # Show violations
    cat eslint-results.json | jq -r '.[] | .messages[] | "  • \(.ruleId): \(.message) (\(.line):\(.column))"'
  fi
else
  echo "⏭️ ESLint: Skipped (not configured)"
  LINT_VIOLATIONS=0
fi
```

### 2.2 Dependency Cruiser Validation (Architecture)

```bash
if [ "$ARCH_AVAILABLE" = true ]; then
  echo "🏗️ Running dependency-cruiser..."

  # Run dependency-cruiser
  if npm run arch:validate 2>&1 | tee arch-results.txt; then
    ARCH_VIOLATIONS=0
    echo "✅ Dependency Cruiser: 0 violations"
  else
    ARCH_VIOLATIONS=$(grep -c "error" arch-results.txt || echo "0")
    echo "❌ Dependency Cruiser: $ARCH_VIOLATIONS violations"

    # Show violations
    grep "error" arch-results.txt || true
  fi
else
  echo "⏭️ Dependency Cruiser: Skipped (not configured)"
  ARCH_VIOLATIONS=0
fi
```

### 2.3 TypeScript Compilation (Type Safety)

```bash
echo "📘 Checking TypeScript compilation..."

# Check if tsconfig exists
if [ -f "tsconfig.json" ]; then
  if npx tsc --noEmit 2>&1 | tee ts-results.txt; then
    TS_ERRORS=0
    echo "✅ TypeScript: 0 errors"
  else
    TS_ERRORS=$(grep -c "error TS" ts-results.txt || echo "0")
    echo "❌ TypeScript: $TS_ERRORS errors"

    # Show first 5 errors
    grep "error TS" ts-results.txt | head -5 || true
  fi
else
  echo "⏭️ TypeScript: Skipped (no tsconfig.json)"
  TS_ERRORS=0
fi
```

## 3. Calculate Actual RLHF Score

Based on validation results, calculate the actual RLHF score:

```typescript
function calculateActualRLHFScore(
  lintViolations: number,
  archViolations: number,
  tsErrors: number
): number {
  let score = 2; // Start with perfect score

  // Catastrophic errors (RLHF -2)
  if (archViolations > 0) {
    return -2; // Architecture violations are catastrophic
  }

  // Runtime errors (RLHF -1)
  if (tsErrors > 0) {
    return -1; // Type errors prevent runtime
  }

  // Style violations (reduce score)
  if (lintViolations > 10) {
    score = 0; // Many violations = low confidence
  } else if (lintViolations > 3) {
    score = 1; // Some violations = good but not perfect
  } else if (lintViolations > 0) {
    score = 1; // Minor violations = still good
  }

  return score;
}
```

### Score Interpretation

| Score | Level | Meaning | Violations |
|-------|-------|---------|------------|
| **+2** | PERFECT | Excellent code quality | 0 violations across all tools |
| **+1** | GOOD | Minor issues only | 1-3 lint violations |
| **0** | LOW_CONFIDENCE | Needs improvement | 4-10 lint violations |
| **-1** | RUNTIME_ERROR | Type errors present | TypeScript compilation fails |
| **-2** | CATASTROPHIC | Architecture violated | External deps in domain, etc. |

## 4. Compare Estimated vs Actual

```bash
# Read estimated score from /04 output (if available)
ESTIMATED_SCORE=${ESTIMATED_SCORE:-null}
ACTUAL_SCORE=$(calculate_actual_score $LINT_VIOLATIONS $ARCH_VIOLATIONS $TS_ERRORS)

echo ""
echo "📊 RLHF Score Comparison:"
echo "   Estimated (from /04): $ESTIMATED_SCORE"
echo "   Actual (from validation): $ACTUAL_SCORE"

if [ "$ESTIMATED_SCORE" != "null" ]; then
  DIFF=$((ACTUAL_SCORE - ESTIMATED_SCORE))

  if [ $DIFF -eq 0 ]; then
    echo "   ✅ Perfect prediction!"
  elif [ $DIFF -gt 0 ]; then
    echo "   📈 Better than estimated (+$DIFF)"
  else
    echo "   📉 Worse than estimated ($DIFF)"
  fi
fi
```

## 5. Generate Validation Report

Your deliverable is a JSON report:

### ✅ Validation Passed

```json
{
  "status": "PASSED",
  "actual_rlhf_score": 2,
  "estimated_rlhf_score": 2,
  "comparison": "Perfect prediction - estimated and actual scores match",
  "violations": {
    "eslint": 0,
    "dependency_cruiser": 0,
    "typescript": 0
  },
  "tools_run": {
    "eslint": true,
    "dependency_cruiser": true,
    "typescript": true
  },
  "summary": "All validation tools passed. Code is production-ready.",
  "next_step": "Code is ready for PR/merge"
}
```

### ❌ Validation Failed

```json
{
  "status": "FAILED",
  "actual_rlhf_score": -1,
  "estimated_rlhf_score": 2,
  "comparison": "Worse than estimated (-3 difference) - TypeScript errors detected",
  "violations": {
    "eslint": 3,
    "dependency_cruiser": 0,
    "typescript": 5
  },
  "tools_run": {
    "eslint": true,
    "dependency_cruiser": true,
    "typescript": true
  },
  "details": [
    "❌ TypeScript: 5 errors",
    "  • src/features/user/domain/models/user.ts:12:5 - Type 'string | undefined' is not assignable to type 'string'",
    "  • src/features/user/domain/use-cases/create-user.ts:23:10 - Property 'id' does not exist on type 'User'",
    "⚠️ ESLint: 3 violations",
    "  • @typescript-eslint/no-unused-vars: 'userId' is defined but never used (45:7)",
    "  • @typescript-eslint/explicit-function-return-type: Missing return type (78:12)"
  ],
  "summary": "TypeScript compilation failed. Fix type errors before proceeding.",
  "next_step": "/08-fix-layer-errors to correct violations"
}
```

### ⚠️ Graceful Degradation (Tools Not Available)

```json
{
  "status": "SKIPPED",
  "actual_rlhf_score": null,
  "estimated_rlhf_score": 2,
  "comparison": "Cannot compare - validation tools not configured",
  "violations": {
    "eslint": "N/A",
    "dependency_cruiser": "N/A",
    "typescript": "N/A"
  },
  "tools_run": {
    "eslint": false,
    "dependency_cruiser": false,
    "typescript": false
  },
  "summary": "Validation tools not configured. Install ESLint and dependency-cruiser.",
  "recommendation": "Run `npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin dependency-cruiser`",
  "next_step": "Proceed with caution - code not validated"
}
```

## 6. Common Validation Scenarios

### Scenario 1: Perfect Code ✅

```
Validation Results:
✅ ESLint: 0 violations
✅ Dependency Cruiser: 0 violations
✅ TypeScript: 0 errors

RLHF Score: +2 (PERFECT)
Status: PASSED
Next Step: Code ready for PR/merge
```

### Scenario 2: Minor Lint Issues ⚠️

```
Validation Results:
⚠️ ESLint: 2 violations
  • Missing semicolon (user.ts:45)
  • Unused variable 'temp' (create-user.ts:78)
✅ Dependency Cruiser: 0 violations
✅ TypeScript: 0 errors

RLHF Score: +1 (GOOD)
Status: PASSED (with warnings)
Next Step: Fix lint issues for +2 score
```

### Scenario 3: Type Errors ❌

```
Validation Results:
✅ ESLint: 0 violations
✅ Dependency Cruiser: 0 violations
❌ TypeScript: 3 errors
  • Type mismatch in user.ts:23
  • Missing property 'email' in create-user.ts:56
  • Cannot find module './user-repo' in get-user.ts:12

RLHF Score: -1 (RUNTIME_ERROR)
Status: FAILED
Next Step: /08-fix-layer-errors
```

### Scenario 4: Architecture Violation 🚨

```
Validation Results:
⚠️ ESLint: 1 violation
❌ Dependency Cruiser: 2 violations
  • External dependency 'axios' in domain layer (user-service.ts:5)
  • Invalid import from presentation to domain (user-controller.ts:12)
✅ TypeScript: 0 errors

RLHF Score: -2 (CATASTROPHIC)
Status: FAILED
Next Step: /08-fix-layer-errors - Remove violations
```

## 7. Graceful Degradation

If validation tools are not available, provide helpful guidance:

```bash
echo "⚠️ Validation Tools Not Configured"
echo ""
echo "To enable code validation, install:"
echo ""
echo "  npm install --save-dev \\"
echo "    eslint \\"
echo "    @typescript-eslint/parser \\"
echo "    @typescript-eslint/eslint-plugin \\"
echo "    dependency-cruiser"
echo ""
echo "Then configure in package.json:"
echo "  \"scripts\": {"
echo "    \"lint\": \"eslint .\","
echo "    \"arch:validate\": \"depcruise src --config .dependency-cruiser.cjs\""
echo "  }"
echo ""
echo "For now, proceeding without validation (use with caution)"
```

## 8. Integration with Other Commands

### After /06 Success

```mermaid
graph LR
    A[/06 Execute] --> B{Success?}
    B -->|Yes| C[/07 Validate Code]
    B -->|No| D[/08 Fix Errors]
    C --> E{Validation Pass?}
    E -->|Yes| F[Continue to PR]
    E -->|No| D
    D --> A
    style C fill:#90EE90
    style D fill:#FFB6C1
```

### Command Flow

1. `/06-execute-layer-steps` - Generates code
2. **`/07-validate-generated-code`** - Validates code quality
3. If validation fails → `/08-fix-layer-errors`
4. If validation passes → Continue to PR/merge

## 📍 Next Steps

### If Validation Passes ✅

```bash
# Code is ready - proceed with PR
gh pr create --title "feat: implement [layer] for [feature]" \
  --body "RLHF Score: +2 (PERFECT) - All validations passed"
```

### If Validation Fails ❌

```bash
# Fix errors first
/08-fix-layer-errors from yaml: <implementation.yaml>
```

> 💡 **Pro Tip**: This command provides **objective quality metrics** that complement the **subjective reflection** from `/04`. Use both together for the complete quality picture!

## 🎯 Success Criteria

- ✅ All validation tools executed (if available)
- ✅ Actual RLHF score calculated
- ✅ Comparison with estimated score provided
- ✅ Detailed violation report generated
- ✅ Actionable next steps recommended
- ✅ Graceful degradation if tools unavailable
