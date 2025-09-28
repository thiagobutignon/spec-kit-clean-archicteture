---
title: "Execute Implementation"
description: "Orchestrates proper workflow for task implementation"
category: "implementation"
stage: "execution"
priority: 5
tags:
  - implementation
  - orchestrator
  - workflow
parameters:
  task_id:
    type: "string"
    description: "Task ID to implement"
    required: true
next_command: "Automatically calls /01-plan-layer-features"
---

# /implement Command - Workflow Orchestrator

## ⚠️ Issue #76 Fix

This command orchestrates the proper workflow. It does NOT execute directly.

## When you receive: `/implement T001`

Execute these commands IN ORDER:

1. **First**: `/01-plan-layer-features for task: T001`
   - Generates JSON plan

2. **Second**: `/02-validate-layer-plan`
   - Validates architecture

3. **Third**: `/03-generate-layer-code`
   - Generates YAML workflow

4. **Fourth**: `/06-execute-layer-steps`
   - Executes with RLHF scoring

## DO NOT:
- Use SpecToYamlTransformer directly
- Call execute-steps.ts directly
- Skip any step above
- Create files without workflow

## Why This Workflow:
Issue #76 identified that /implement was bypassing validation.
This ensures proper Clean Architecture validation at each step.