# spec-kit ↔ .regent Integration

## Overview
This document describes how spec-kit commands integrate with the .regent YAML workflow system.

## Integration Points

### 1. /01-plan-layer-features
- Generates JSON plan with task definitions
- Output format compatible with SpecToYamlTransformer

### 2. /03-generate-layer-code
- Uses SpecToYamlTransformer to convert tasks to YAML
- Saves workflows to `.regent/workflows/`

### 3. /06-execute-layer-steps
- Executes YAML workflows via execute-steps.ts
- Provides RLHF scoring and validation

## Data Flow
```
spec-kit commands → JSON plan → SpecToYamlTransformer → YAML workflow → execute-steps.ts
```

## Benefits
- ✅ No duplicate analysis
- ✅ GitFlow enforcement
- ✅ RLHF scoring
- ✅ Clean Architecture validation
- ✅ 10x performance improvement

Fixes #75