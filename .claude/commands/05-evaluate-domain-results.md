# Task: Evaluate Domain YAML Plan

## 🤖 RLHF Score Correlation

The evaluation score directly correlates with expected RLHF execution scores:
- **Score 5**: Likely RLHF +2 (Perfect execution with DDD/Clean Architecture)
- **Score 4**: Likely RLHF +1 (Good execution, minor improvements possible)
- **Score 3**: Likely RLHF 0 (Uncertain quality, missing best practices)
- **Score 2**: Likely RLHF -1 (Runtime errors expected)
- **Score 1**: Likely RLHF -2 (Catastrophic architecture violations)

## 1. Your Deliverable

Your output is a JSON object representing a final quality evaluation.

- If the plan passes: `{"status": "APPROVED", "score": 5, "report": "The plan adheres to all engineering principles.", "violations": [], "expected_rlhf_score": 2}`.
- If the plan fails: `{"status": "REJECTED", "score": 1, "report": "...", "violations": ["violation 1", "violation 2"], "expected_rlhf_score": -2}`.

## 2. Objective

Your goal is to act as a Principal Engineer performing a final architectural review on an implementation plan. You are the last line of defense before the plan is executed. You must evaluate the provided YAML plan against a strict set of non-negotiable engineering principles.

## 3. Input Parameters

- **YAML Plan:** The complete, potentially revised YAML content from the `/04-reflect-domain-lessons` step.
- **Note:** This YAML should be saved at `spec/[FEATURE_NUMBER]-[FEATURE_NAME]/domain/implementation.yaml`

## 4. Evaluation Principles (The Constitution)

You must evaluate the **entire plan** as a whole against these core principles. For each principle, you must determine if the plan honors or violates it.

- **[ ] Git Workflow Compliance:**

  - Does the plan start with a `branch` type step as the FIRST step?
  - Does the branch name follow the convention `feat/[feature-name]-domain`?
  - Does the plan end with a `pull_request` type step as the LAST step?
  - Is the PR targeting the correct branch (usually `staging`)?
  - Are all commits atomic and well-described?

- **[ ] Clean Architecture (RLHF -2 if violated):**

  - Does the plan strictly maintain the separation of concerns?
  - Are there any steps that suggest putting data access logic or UI concerns inside a `domain` layer file? (Ex: a `template` that includes `import { PrismaClient }` would be a critical violation).
  - Check for external dependencies: axios, fetch, express, redis, keycloak (all cause RLHF -2).

- **[ ] SOLID Principles:**

  - **Single Responsibility (S):** Look at the `description` and `template` of each `create-use-case` step. Does any use case appear to have more than one responsibility? (Ex: "Create User and Send Welcome Email" is a violation).
  - **Open/Closed (O):** Does the plan favor composition and abstraction, or does it encourage modifying existing classes for new features? (Harder to check, but look for excessive `refactor_file` steps where a new class might be better).

- **[ ] Simplicity (KISS & YAGNI):**

  - Does the plan introduce complexity that wasn't requested?
  - Does it include use cases or errors that are not directly related to the feature goal? (YAGNI - You Ain't Gonna Need It).
  - Is the proposed solution the simplest one that could possibly work?

- **[ ] TDD (Test-Driven Development):**

  - Is there a `create-test-helper` step for every `create-use-case` step? A missing test helper is a critical violation.
  - Do test helpers include realistic mock data for RLHF +1/+2 scoring?

- **[ ] Atomic Commits:**
  - Does each step in the plan represent a single, logical, atomic change?
  - Does the commit message in each `validation_script` accurately and concisely describe the action of that single step?

- **[ ] Ubiquitous Language (RLHF +2 requirement):**
  - If `ubiquitousLanguage` field exists, are all domain terms used consistently?
  - Do use case names, error names, and types align with the established vocabulary?
  - Are domain concepts documented with JSDoc comments including `@domainConcept` tags?

- **[ ] REPLACE/WITH Syntax (RLHF -2 if wrong):**
  - For all `refactor_file` steps, verify the template contains exactly one `<<<REPLACE>>>` and one `<<<WITH>>>` block.
  - Incorrect syntax will cause catastrophic execution failure.

## 5. Step-by-Step Execution Plan

1.  **Parse Input:** Receive the YAML plan.
2.  **Verify Step Order:** Check that:
    a. First step is type `branch`
    b. Second step is type `folder`
    c. Last step is type `pull_request`
    d. Domain implementation steps are in the middle
3.  **Evaluate Against Principles:** Systematically review the entire `steps` array against each principle in the "Evaluation Principles" checklist.
4.  **Document Violations:** For every principle that is violated, write a clear and concise message explaining the violation and referencing the specific step `id` that caused it.
5.  **Calculate Score and RLHF Prediction:**
    - 5: Perfect - all principles met, proper workflow order (Expected RLHF: +2)
    - 4: Good - minor issues (e.g., branch naming) (Expected RLHF: +1)
    - 3: Fair - missing non-critical elements (Expected RLHF: 0)
    - 2: Poor - major violations (e.g., missing branch/PR steps) (Expected RLHF: -1)
    - 1: Critical - multiple severe violations (Expected RLHF: -2)
6.  **Generate Report:**
    a. If there are no violations, produce the `APPROVED` JSON report with a score of 5 and `expected_rlhf_score` of 2.
    b. If there are any violations, produce the `REJECTED` JSON report, including the list of violations, score, and predicted `expected_rlhf_score`.

---

## Example Invocations

### Example 1: Missing Branch Step

`/04-evaluate-domain-results from yaml:`

```yaml
# YAML plan missing the branch creation step
steps:
  - id: "create-structure"
    type: "folder"
    description: "Create domain folder structure"
    # ... (other steps but no branch as first step)
```

**Expected Output:**

```json
{
  "status": "REJECTED",
  "score": 2,
  "report": "The plan was rejected due to missing Git workflow steps. This will likely result in runtime errors.",
  "violations": [
    "Git Workflow Violation: The first step must be a 'branch' type step to create the feature branch.",
    "Git Workflow Violation: Missing 'pull_request' step at the end of the plan."
  ],
  "expected_rlhf_score": -1
}
```

### Example 2: Single Responsibility Violation

`/04-evaluate-domain-results from yaml:`

```yaml
# YAML plan where a UseCase violates Single Responsibility Principle
steps:
  - id: "create-feature-branch"
    type: "branch"
    # ... (correct branch step)
  - id: "create-use-case-register-user-and-send-email"
    type: "create_file"
    description: "Creates a new user and sends a welcome email"
    # ...
```

**Expected Output:**

```json
{
  "status": "REJECTED",
  "score": 3,
  "report": "The plan was rejected due to a violation of the Single Responsibility Principle. This affects code quality but won't cause runtime errors.",
  "violations": [
    "SOLID Violation (Single Responsibility): The step 'create-use-case-register-user-and-send-email' combines two distinct responsibilities (user registration and sending emails). This should be split into two separate use cases."
  ],
  "expected_rlhf_score": 0
}
```

### Example 3: Architecture Violation (RLHF -2)

`/04-evaluate-domain-results from yaml:`

```yaml
steps:
  - id: "create-feature-branch"
    type: "branch"
    # ... (correct branch step)
  - id: "create-use-case-with-axios"
    type: "create_file"
    path: "src/features/user/domain/use-cases/fetch-user.ts"
    template: |
      import axios from 'axios';

      export interface FetchUser {
        execute(input: FetchUserInput): Promise<FetchUserOutput>;
      }
    # ...
  - id: "create-pull-request"
    type: "pull_request"
    # ...
```

**Expected Output:**

```json
{
  "status": "REJECTED",
  "score": 1,
  "report": "CRITICAL: The plan contains catastrophic architecture violations that will cause RLHF -2 scoring.",
  "violations": [
    "Clean Architecture Violation: The step 'create-use-case-with-axios' imports 'axios' in the domain layer. External dependencies are strictly prohibited in domain layer (RLHF -2)."
  ],
  "expected_rlhf_score": -2
}
```

## 📍 Next Step

Based on your evaluation results:

- **If score ≥ 1 (APPROVED)**: Proceed to execution:
  ```bash
  /06-execute-domain-steps from yaml: <your-approved-yaml>
  ```

- **If score < 1 (REJECTED)**: Return to reflection to fix issues:
  ```bash
  /05-reflect-domain-lessons from yaml: <your-yaml>
  ```

  Or if issues are in the JSON structure, go back to planning:
  ```bash
  /01-plan-domain-features <modify-your-request>
  ```
