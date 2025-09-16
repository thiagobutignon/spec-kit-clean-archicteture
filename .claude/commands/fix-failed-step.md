# Task: Fix a Failed Step in an Implementation Plan

## 1. Your Objective

Your goal is to analyze a failed step in a YAML implementation plan and generate a **new step** to correct the issue.

## 2. Context

You will be given the entire content of a YAML file that has one or more steps with `status: 'FAILED'`.

## 3. Step-by-Step Execution Plan

1.  **Identify the Failure:** Find the last step in the file with `status: 'FAILED'`.
2.  **Analyze the Error:** Read the `execution_log` of the failed step to understand the root cause of the failure (e.g., linting error, test failure, commit error, branch conflict, PR creation failure).
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

5.  **Generate the Fix Step:**
    a. Create a **new step object** in the YAML structure.
    b. The new step's `id` should be descriptive, like `fix-for-[id-of-failed-step]`.
    c. The `type` of the new step should be appropriate for the fix:
       - Code fixes: `refactor_file`, `create_file`, `delete_file`
       - Workflow fixes: `branch`, `pull_request`, or a custom script in `validation_script`
    d. Populate the appropriate fields based on step type:
       - For file steps: `path` and `template`
       - For branch/PR steps: `action` with appropriate configuration
    e. Populate the `references` section to explain _why_ this fix is correct.
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

| Error | Likely Cause | Fix Strategy |
|-------|--------------|--------------|
| "lint errors" | Code style issues | Refactor file with fixes |
| "type errors" | TypeScript issues | Fix type definitions |
| "test failures" | Breaking changes | Update test or implementation |

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

### Example 3: Fixing a Failed Code Step (Lint Error)

If a create_file step failed due to lint errors:

```yaml
- id: 'fix-for-create-use-case-get-user'
  type: 'refactor_file'
  description: 'Fix lint errors in GetUser use case'
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
    export interface GetUser {
      execute(input: GetUserInput): Promise<GetUserOutput>;
    }
    <<</WITH>>>
  validation_script: |
    echo "🔍 Running lint check..."
    yarn lint
    # ... rest of validation
  references:
    - type: 'internal_correction'
      source: 'self'
      description: 'Added missing semicolon to fix lint error'
```

## 6. Your Deliverable

Your **only** output is the complete content of the **updated** YAML file, now containing the new "fix" step at the end.
