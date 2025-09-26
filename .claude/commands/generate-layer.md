---
allowed-tools: Read, Write, Edit, MultiEdit, Bash, Grep, Glob, TodoWrite, SlashCommand
argument-hint: [layer] [feature-description]
description: Generate complete Clean Architecture layer from requirements
model: claude-3-5-sonnet-20241022
---

# Generate Complete Clean Architecture Layer

You are an automated Clean Architecture layer generator that will execute the complete workflow from planning to implementation.

## Input Parameters
- **Layer**: $1 (domain|data|infra|presentation|main)
- **Feature Description**: $2 onwards

## Your Task

Execute the complete layer generation workflow:

### Phase 1: Planning
1. Use `/01-plan-layer-features --layer=$1` to create a JSON plan based on the feature description
2. Save the plan to `spec/[FEATURE_NUMBER]-[FEATURE_NAME]/$1/plan.json`

### Phase 2: Validation
1. Use `/02-validate-layer-plan --layer=$1` with the generated JSON
2. If validation fails, fix issues and re-validate
3. Continue only after successful validation

### Phase 3: Code Generation
1. Use `/03-generate-layer-code --layer=$1` to create YAML implementation
2. Save to `spec/[FEATURE_NUMBER]-[FEATURE_NAME]/$1/implementation.yaml`

### Phase 4: Reflection & Optimization
1. Use `/04-reflect-layer-lessons --layer=$1` to optimize for RLHF score
2. If changes are suggested, update the YAML

### Phase 5: Evaluation
1. Use `/05-evaluate-layer-results --layer=$1` for architectural review
2. If rejected, go back to reflection or planning as needed
3. Continue only with APPROVED status

### Phase 6: Execution
1. Use `/06-execute-layer-steps --layer=$1` to execute the plan
2. Monitor for any failures

### Phase 7: Error Handling (if needed)
1. If execution fails, use `/07-fix-layer-errors --layer=$1`
2. Re-execute with the fixed plan

### Phase 8: Continuous Improvement
1. After successful execution, optionally use `/08-apply-layer-improvements --layer=$1`
2. Generate learning report for future improvements

## Execution Rules

- **Automate completely**: Execute all phases without waiting for user input
- **Handle errors gracefully**: If a step fails, automatically fix and retry
- **Track progress**: Use TodoWrite to track each phase
- **Maintain quality**: Target RLHF score of +2
- **Document decisions**: Explain key architectural choices

## Example Usage

```
/generate-layer domain "User authentication with email and password"
/generate-layer data "Repository implementation for user persistence"
/generate-layer presentation "REST API endpoints for user management"
```

## Success Criteria

- All files generated in correct locations
- RLHF score ≥ +1 (target +2)
- All tests passing
- Clean Architecture principles maintained
- No external dependencies in domain layer
- Proper separation of concerns

Begin execution immediately with the provided parameters.