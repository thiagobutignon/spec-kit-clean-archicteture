# /implement Command

## Purpose
Executes a task by transforming it from spec-kit documentation to YAML workflow and running it through execute-steps.ts.

## Usage
```bash
/implement T001
```

## Implementation

This command uses the SpecToYamlTransformer created in Issue #77 (PR #80) to:

1. Read task from `.specify/tasks/TASK-LIST-SPEC-001-cli.md`
2. Transform to YAML workflow with GitFlow steps
3. Save to `.regent/workflows/{taskId}-workflow.yaml`
4. Execute via `../../execute-steps.ts`

## Code Integration

```javascript
import { implementCommand } from './packages/cli/src/commands/implement.js';

// Execute task
await implementCommand('T001');
```

## Workflow Steps Generated

- Create feature branch
- Create directories
- Create implementation files
- Create test files
- Run validation (test, lint, typecheck)
- Commit changes
- Create pull request

## Related Issues

- Fixes: #76
- Depends on: #77 (SpecToYamlTransformer - completed)
- Uses: execute-steps.ts (existing in project root)