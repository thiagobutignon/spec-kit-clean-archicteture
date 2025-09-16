# Task: Fix a Failed Step in an Implementation Plan

## 🤖 RLHF Scoring Awareness

When fixing failed steps, understand the RLHF score impact:
- **-2 (CATASTROPHIC)**: Architecture violations, wrong REPLACE/WITH format
- **-1 (RUNTIME ERROR)**: The current failure level - lint/test/git failures
- **0 (LOW CONFIDENCE)**: Missing references or unclear fixes
- **+1 (GOOD)**: Valid fix but could be improved
- **+2 (PERFECT)**: Fix that includes domain documentation and best practices

## 1. Your Objective

Your goal is to analyze a failed step in a YAML implementation plan and generate a **new step** to correct the issue.

## 2. Context

You will be given the entire content of a YAML file that has one or more steps with `status: 'FAILED'`.

## 3. Step-by-Step Execution Plan

1.  **Identify the Failure:** Find the last step in the file with `status: 'FAILED'`.
2.  **Analyze the Error:** Read the `execution_log` of the failed step to understand the root cause of the failure (e.g., linting error, test failure, commit error, branch conflict, PR creation failure).
    - Check the `rlhf_score` to understand severity (-2 for catastrophic, -1 for runtime errors).
3.  **Analyze the Step Type:** Check if it's a regular step (`create_file`, `refactor_file`) or a workflow step (`branch`, `pull_request`).
4.  **Formulate a Correction:** Based on your analysis, decide on the best course of action:

    **For Code Steps:**
    a. **Refactoring the broken code:** If the original code was flawed.
    b. **Creating a missing dependency:** If a file was missing.
    c. **Deleting the broken artifact:** If the original step was fundamentally wrong.

    **For Workflow Steps:**
    a. **Branch conflicts:** Create a fix step to resolve conflicts or switch branches.
    b. **PR failures:** Create a fix step to push missing commits or fix PR configuration.
    c. **Permission issues:** Add a step to configure git credentials or permissions.

5.  **Generate the Fix Step (Aim for RLHF +2):**
    a. Create a **new step object** in the YAML structure.
    b. The new step's `id` should be descriptive, like `fix-for-[id-of-failed-step]`.
    c. The `type` of the new step should be appropriate for the fix:
       - Code fixes: `refactor_file`, `create_file`, `delete_file`
       - Workflow fixes: `branch`, `pull_request`, or a custom script in `validation_script`
    d. Populate the appropriate fields based on step type:
       - For file steps: `path` and `template`
       - For branch/PR steps: `action` with appropriate configuration
    e. **CRITICAL for RLHF +1/+2**: Populate the `references` section to explain _why_ this fix is correct.
    f. **For RLHF +2**: If fixing domain code, include JSDoc comments with `@domainConcept` tags.
6.  **Append the New Step:** Add the newly generated step object to the **end of the `steps` array** in the YAML file.
7.  **Do Not Modify the Failed Step:** The original step with `status: 'FAILED'` **MUST** remain in the file untouched as a historical record.

## 4. Common Failure Scenarios and Solutions

### Branch Step Failures

| Error | Likely Cause | Fix Strategy |
|-------|--------------|--------------|
| "branch already exists" | Branch name conflict | Add fix step to checkout existing branch |
| "uncommitted changes" | Dirty working directory | Add fix step to stash changes |
| "permission denied" | Git permissions | Add fix step to configure credentials |

### Pull Request Step Failures

| Error | Likely Cause | Fix Strategy |
|-------|--------------|--------------|
| "nothing to commit" | No changes to push | Add fix step to create meaningful change |
| "gh: command not found" | GitHub CLI not installed | Add fix step with git push fallback |
| "PR already exists" | Duplicate PR | Add fix step to update existing PR |

### Code Step Failures

| Error | Likely Cause | Fix Strategy | RLHF Impact |
|-------|--------------|--------------|-------------|
| "lint errors" | Code style issues | Refactor file with fixes | -1 → +1 |
| "type errors" | TypeScript issues | Fix type definitions | -1 → +1 |
| "test failures" | Breaking changes | Update test or implementation | -1 → +1 |
| "import violation" | External deps in domain | Remove external dependencies | -2 → +2 |
| "REPLACE/WITH syntax" | Wrong template format | Fix template syntax | -2 → +1 |

## 5. Example Fix Steps

### Example 1: Fixing a Failed Branch Step

If the branch step failed because the branch already exists:

```yaml
- id: 'fix-for-create-feature-branch'
  type: 'branch'
  description: 'Checkout existing branch instead of creating new one'
  status: 'PENDING'
  rlhf_score: null
  execution_log: ''
  action:
    branch_name: 'feat/user-profile-domain'
  validation_script: |
    echo "🌿 Checking out existing branch..."
    git checkout feat/user-profile-domain
    if [ $? -eq 0 ]; then
      echo "✅ Successfully switched to existing branch"
    else
      echo "❌ Failed to checkout branch"
      exit 1
    fi
  references:
    - type: 'internal_correction'
      source: 'self'
      description: 'Branch already exists, switching to checkout instead of create'
```

### Example 2: Fixing a Failed PR Step

If the PR step failed because GitHub CLI is not installed:

```yaml
- id: 'fix-for-create-pull-request'
  type: 'pull_request'
  description: 'Create PR using git and web fallback'
  status: 'PENDING'
  rlhf_score: null
  execution_log: ''
  action:
    target_branch: 'staging'
    source_branch: 'feat/user-profile-domain'
    title: 'feat(user-profile): implement domain layer'
  validation_script: |
    echo "📤 Pushing branch to remote..."
    git push --set-upstream origin feat/user-profile-domain

    echo "📋 GitHub CLI not available. Please create PR manually at:"
    echo "https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/pull/new/feat/user-profile-domain"
    echo "✅ Branch pushed successfully. Manual PR creation required."
  references:
    - type: 'internal_correction'
      source: 'self'
      description: 'GitHub CLI not available, using git push with manual PR instructions'
```

### Example 3: Fixing a Failed Code Step (Lint Error - Aiming for RLHF +2)

If a create_file step failed due to lint errors:

```yaml
- id: 'fix-for-create-use-case-get-user'
  type: 'refactor_file'
  description: 'Fix lint errors in GetUser use case with domain documentation'
  status: 'PENDING'
  rlhf_score: null
  execution_log: ''
  path: 'src/features/user/domain/use-cases/get-user.ts'
  template: |
    <<<REPLACE>>>
    export interface GetUser {
      execute(input: GetUserInput): Promise<GetUserOutput>
    }
    <<</REPLACE>>>
    <<<WITH>>>
    /**
     * @domainConcept User Retrieval
     * @pattern Use Case Interface
     * @description Retrieves user information from the domain
     */
    export interface GetUser {
      execute(input: GetUserInput): Promise<GetUserOutput>;
    }
    <<</WITH>>>
  validation_script: |
    echo "🔍 Running lint check..."
    yarn lint
    echo "✅ Lint check passed"
    echo "🏆 Added domain documentation for RLHF +2 score"
  references:
    - type: 'internal_correction'
      source: 'self'
      description: 'Added missing semicolon to fix lint error'
    - type: 'quality_improvement'
      source: 'ddd_best_practices'
      description: 'Added JSDoc with @domainConcept for RLHF +2 score'
```

### Example 4: Fixing a Catastrophic Error (RLHF -2)

If a step failed due to architecture violation:

```yaml
- id: 'fix-for-create-use-case-with-axios'
  type: 'refactor_file'
  description: 'Remove external dependency from domain layer'
  status: 'PENDING'
  rlhf_score: null
  execution_log: ''
  path: 'src/features/user/domain/use-cases/fetch-user.ts'
  template: |
    <<<REPLACE>>>
    import axios from 'axios';

    export interface FetchUser {
      execute(input: FetchUserInput): Promise<FetchUserOutput>;
    }
    <<</REPLACE>>>
    <<<WITH>>>
    /**
     * @domainConcept User Fetching
     * @pattern Clean Architecture - Domain Layer
     * @principle No external dependencies in domain
     */
    export interface FetchUser {
      execute(input: FetchUserInput): Promise<FetchUserOutput>;
    }
    <<</WITH>>>
  validation_script: |
    echo "🏗️ Verifying Clean Architecture compliance..."
    grep -r "import.*from.*axios" src/features/*/domain/ && echo "❌ Found axios in domain" && exit 1
    echo "✅ Domain layer is clean - no external dependencies"
    echo "🏆 Architecture violation fixed for RLHF +2 score"
  references:
    - type: 'architecture_fix'
      source: 'clean_architecture'
      description: 'Removed axios import - external deps not allowed in domain layer (was RLHF -2)'
```

## 6. Your Deliverable

Your **only** output is the complete content of the **updated** YAML file, now containing the new "fix" step at the end.
