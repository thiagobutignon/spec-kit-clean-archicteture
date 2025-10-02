---
title: "Extract Clean Architecture Patterns from Codebase"
description: "Automatically analyze existing code and generate validation patterns"
category: "automation"
stage: "analysis"
priority: 10
tags:
  - patterns
  - automation
  - serena-mcp
  - analysis
parameters:
  target_directory:
    type: "path"
    description: "Directory to analyze"
    default: "./src"
  output_file:
    type: "path"
    description: "Output patterns file"
    default: ".regent/patterns/auto-generated.yaml"
  layers:
    type: "array"
    description: "Layers to analyze"
    default: ["domain", "data", "infra", "presentation", "main"]
---

# Task: Extract Clean Architecture Patterns from Codebase

## 1. Objective

Analyze existing codebase using Serena MCP and automatically generate validation patterns in YAML format.

## 2. Execution Flow

```mermaid
graph TD
    A[Start] --> B[Use Serena to list files]
    B --> C[Group by layer]
    C --> D[Analyze patterns per layer]
    D --> E[Generate YAML rules]
    E --> F[Validate output]
    F --> G[Save to .regent/patterns/]
    G --> H[Report summary]
```

## 3. Implementation

Execute this command:

```bash
npx tsx .regent/scripts/extract-patterns.ts --target=./src --output=.regent/patterns/auto-generated.yaml
```

## 4. Expected Output

```yaml
# Auto-generated patterns from codebase analysis
# Generated: 2025-01-02T10:30:00Z
# Files analyzed: 47

patterns:
  domain:
    - id: "DOM001"
      name: "use-case-single-method"
      regex: "export interface \\w+.*execute.*Promise"
      severity: "high"

  data:
    - id: "DAT001"
      name: "repository-pattern"
      regex: "class \\w+Repository implements"
      severity: "medium"

  # ... more patterns
```

## 5. Next Steps

After extraction:

```bash
# Validate patterns
npx tsx .regent/scripts/validate-patterns.ts

# Apply to new code generation
/03-generate-layer-code --use-patterns=auto-generated
```
