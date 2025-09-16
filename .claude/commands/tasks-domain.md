# Task: Generate Domain Layer for a New Feature

## 🤖 RLHF Scoring System

Your generated YAML will be scored from -2 to +2:
- **-2 (CATASTROPHIC)**: Architecture violations, wrong REPLACE/WITH format
- **-1 (RUNTIME ERROR)**: Missing placeholders, lint failures, invalid Git operations
- **0 (LOW CONFIDENCE)**: Missing references, unclear domain concepts
- **+1 (GOOD)**: Valid but missing DDD elements or ubiquitous language
- **+2 (PERFECT)**: Complete Clean Architecture + DDD + ubiquitous language

## ⚠️ IMPORTANT: Workflow Order

The generated YAML MUST follow this step order:
1. **FIRST**: `branch` step - Creates feature branch
2. **SECOND**: `folder` step - Creates domain structure
3. **MIDDLE**: All domain implementation steps (use cases, errors, test helpers)
4. **LAST**: `pull_request` step - Creates PR to staging

This ensures proper Git workflow from branch creation to PR submission.

## 1. Your Deliverable

Your **only** output for this task is the complete and valid content of a single YAML file: `{{featureName}}-implementation.yaml`.

## 2. Prohibited Actions

- You **MUST NOT** execute any commands from the `validation_script` (e.g., `mkdir`, `yarn lint`, `git commit`).
- You **MUST NOT** create or write to any files other than the implementation YAML file.
- Your job is to **create or update the plan**, not to **execute the plan**.

## 3. Source of Truth

- **File:** `templates/DOMAIN_TEMPLATE.yaml`
- **Rule:** You MUST follow all `# AI-NOTE:` directives and replace all `__PLACEHOLDER__` variables.
- **RLHF +2 Requirement:** Include ubiquitous language and domain documentation in templates.

## 4. Input Parameters

- **Feature Definition:** A single JSON object containing all the necessary information for the feature, including optional `ubiquitousLanguage` field.
- **Current YAML State (Optional):** The content of the existing `{{featureName}}-implementation.yaml` file, if it already exists from a previous run. If not provided, assume a blank slate.
- **Existing YAML (Optional):** The content of a pre-existing `implementation.yaml` file that needs to be updated.

### IF `Existing YAML` is NOT provided (Create Mode):

1.  **Initialize:** Create a new implementation YAML file in memory as a verbatim copy of `templates/DOMAIN_TEMPLATE.yaml`.
2.  **Generate `steps`:**
    a. Keep the `create-feature-branch` step as the first step (it's already in the template).
    b. Keep the `create-structure` step as the second step.
    c. For each Use Case and Error in the `JSON Plan`, replicate the corresponding step blocks from the template and add them to the `steps` array.
    d. Keep the `create-pull-request` step as the last step (it's already in the template).
3.  **Populate Placeholders:** Systematically replace all `__PLACEHOLDER__` variables throughout the entire in-memory YAML using the data from the `JSON Plan`. This includes metadata, paths, branch names, and the `template` content within each step.
4.  **Handle Optional Fields (RLHF +2):** If `ubiquitousLanguage` is provided in the JSON, add it to the YAML after `featureName`. This is crucial for achieving a perfect RLHF score.
5.  **Add Domain Documentation (RLHF +1 to +2):** Ensure all templates include JSDoc comments with `@domainConcept` and `@pattern` tags where appropriate.

### IF `Existing YAML` IS provided (Update Mode):

1.  **Initialize:** Load the `Existing YAML` content into memory. This is your starting point.
2.  **Apply Corrections:** Analyze the `JSON Plan`. Your task is to **modify the in-memory YAML** to match the data structure defined in the JSON. This typically involves:
    a. Finding the specific `step` in the YAML that corresponds to a `useCase` in the JSON.
    b. Replacing the placeholder content (e.g., `__USE_CASE_INPUT_FIELDS__`) with the actual fields generated from the JSON's `input` and `output` arrays.
    c. Doing the same for `__MOCK_INPUT_DATA__` and `__MOCK_OUTPUT_DATA__` in the corresponding test helper steps.

### FINALLY, for both modes:

4.  **Preserve Immutable Sections:** Double-check that all rule and documentation sections are untouched (unless the update was specifically to them, which is rare).
5.  **Verify Workflow Steps:** Ensure the generated YAML includes:
    a. `branch` type step as the FIRST step to create the feature branch
    b. `pull_request` type step as the LAST step to create PR to staging
    c. All domain implementation steps in between
6.  **Final Validation (Mandatory):**
    a. Run `npx tsx validate-implementation.ts templates/DOMAIN_TEMPLATE.yaml {{path_to_generated_yaml}}`.
    b. **Analyze and Self-Correct:** If it fails, read the `➡️ AI ACTION:` instructions, fix the YAML in memory, and re-validate. Loop until it passes.
    c. Pay special attention to branch and PR step validations.
    d. **RLHF Score Check:** The validation will indicate potential RLHF score impacts. Aim for +2 by including ubiquitous language and proper domain documentation.
7.  **Deliver:** Provide the final, validated YAML content as your output.

## 6. User Interaction

After you provide the final, validated YAML, I (the user) will review it. If it is correct, I will then personally run the `execute-steps.ts` script to apply the changes to the filesystem.

---

## Example Invocations

### Example 1: Create Mode (JSON only)

`/tasks-domain create feature from json:`

```json
{
  /* ... JSON completo ... */
}
```

### Example 2: Update Mode (YAML + JSON)

`/tasks-domain update yaml:`

```yaml
# ... (conteúdo do YAML gerado anteriormente, que ainda tem placeholders)
steps:
  - id: "create-use-case-register-user"
    type: "create_file"
    template: |
      /**
       * @domainConcept User Registration
       * @pattern Use Case Interface
       */
      export type RegisterUserInput = {
        __USE_CASE_INPUT_FIELDS__
      }
      # ...
```

`with json:`

```json
{
  "featureName": "User Registration",
  "ubiquitousLanguage": {
    "Registration": "The process of creating a new user account",
    "WelcomeEmail": "Initial email sent after successful registration"
  },
  "useCases": [
    {
      "name": "RegisterUser",
      "input": [
        { "name": "email", "type": "string" },
        { "name": "password", "type": "string" }
      ],
      "output": [
        /*...*/
      ],
      "mockInput": [
        /*...*/
      ],
      "mockOutput": [
        /*...*/
      ]
    }
  ]
}
```

## 🎯 RLHF Quality Guidelines

### To Achieve +2 (PERFECT) Score:

1. **Always include ubiquitous language** in the JSON and YAML
2. **Add JSDoc comments** with `@domainConcept` and `@pattern` tags
3. **Use proper DDD terminology** (Entity, Value Object, Aggregate, etc.)
4. **Ensure Clean Architecture boundaries** (no external dependencies in domain)
5. **Create meaningful error classes** with business context
6. **Provide comprehensive test helpers** with realistic mock data

### Common Mistakes by Score:

- **-2**: Wrong REPLACE/WITH format, importing external libraries in domain
- **-1**: Missing placeholders, failed lint/tests, invalid Git operations
- **0**: No references to patterns, missing domain context
- **+1**: Valid but generic, missing ubiquitous language
- **+2**: Perfect implementation with all DDD/Clean Architecture principles
