# Task: Evaluate Domain YAML Plan

## 1. Your Deliverable

Your output is a JSON object representing a final quality evaluation.

- If the plan passes: `{"status": "APPROVED", "score": 5, "report": "The plan adheres to all engineering principles.", "violations": []}`.
- If the plan fails: `{"status": "REJECTED", "score": 1, "report": "...", "violations": ["violation 1", "violation 2"]}`.

## 2. Objective

Your goal is to act as a Principal Engineer performing a final architectural review on an implementation plan. You are the last line of defense before the plan is executed. You must evaluate the provided YAML plan against a strict set of non-negotiable engineering principles.

## 3. Input Parameters

- **YAML Plan:** The complete, potentially revised YAML content from the `/reflection-tasks-domain` step.

## 4. Evaluation Principles (The Constitution)

You must evaluate the **entire plan** as a whole against these core principles. For each principle, you must determine if the plan honors or violates it.

- **[ ] Git Workflow Compliance:**

  - Does the plan start with a `branch` type step as the FIRST step?
  - Does the branch name follow the convention `feat/[feature-name]-domain`?
  - Does the plan end with a `pull_request` type step as the LAST step?
  - Is the PR targeting the correct branch (usually `staging`)?
  - Are all commits atomic and well-described?

- **[ ] Clean Architecture:**

  - Does the plan strictly maintain the separation of concerns?
  - Are there any steps that suggest putting data access logic or UI concerns inside a `domain` layer file? (Ex: a `template` that includes `import { PrismaClient }` would be a critical violation).

- **[ ] SOLID Principles:**

  - **Single Responsibility (S):** Look at the `description` and `template` of each `create-use-case` step. Does any use case appear to have more than one responsibility? (Ex: "Create User and Send Welcome Email" is a violation).
  - **Open/Closed (O):** Does the plan favor composition and abstraction, or does it encourage modifying existing classes for new features? (Harder to check, but look for excessive `refactor_file` steps where a new class might be better).

- **[ ] Simplicity (KISS & YAGNI):**

  - Does the plan introduce complexity that wasn't requested?
  - Does it include use cases or errors that are not directly related to the feature goal? (YAGNI - You Ain't Gonna Need It).
  - Is the proposed solution the simplest one that could possibly work?

- **[ ] TDD (Test-Driven Development):**

  - Is there a `create-test-helper` step for every `create-use-case` step? A missing test helper is a critical violation.

- **[ ] Atomic Commits:**
  - Does each step in the plan represent a single, logical, atomic change?
  - Does the commit message in each `validation_script` accurately and concisely describe the action of that single step?

- **[ ] Ubiquitous Language (if provided):**
  - If `ubiquitousLanguage` field exists, are all domain terms used consistently?
  - Do use case names, error names, and types align with the established vocabulary?

## 5. Step-by-Step Execution Plan

1.  **Parse Input:** Receive the YAML plan.
2.  **Verify Step Order:** Check that:
    a. First step is type `branch`
    b. Second step is type `folder`
    c. Last step is type `pull_request`
    d. Domain implementation steps are in the middle
3.  **Evaluate Against Principles:** Systematically review the entire `steps` array against each principle in the "Evaluation Principles" checklist.
4.  **Document Violations:** For every principle that is violated, write a clear and concise message explaining the violation and referencing the specific step `id` that caused it.
5.  **Calculate Score:**
    - 5: Perfect - all principles met, proper workflow order
    - 4: Good - minor issues (e.g., branch naming)
    - 3: Fair - missing non-critical elements
    - 2: Poor - major violations (e.g., missing branch/PR steps)
    - 1: Critical - multiple severe violations
6.  **Generate Report:**
    a. If there are no violations, produce the `APPROVED` JSON report with a score of 5.
    b. If there are any violations, produce the `REJECTED` JSON report, including the list of violations and a lower score.

---

## Example Invocations

### Example 1: Missing Branch Step

`/evaluate-tasks-domain from yaml:`

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
  "report": "The plan was rejected due to missing Git workflow steps.",
  "violations": [
    "Git Workflow Violation: The first step must be a 'branch' type step to create the feature branch.",
    "Git Workflow Violation: Missing 'pull_request' step at the end of the plan."
  ]
}
```

### Example 2: Single Responsibility Violation

`/evaluate-tasks-domain from yaml:`

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
  "report": "The plan was rejected due to a violation of the Single Responsibility Principle.",
  "violations": [
    "SOLID Violation (Single Responsibility): The step 'create-use-case-register-user-and-send-email' combines two distinct responsibilities (user registration and sending emails). This should be split into two separate use cases."
  ]
}
```
