# Task: Generate Domain Layer for a New Feature

## 1. Your Deliverable

Your **only** output for this task is the complete and valid content of a single YAML file: `{{featureName}}-implementation.yaml`.

## 2. Prohibited Actions

- You **MUST NOT** execute any commands from the `validation_script` (e.g., `mkdir`, `yarn lint`, `git commit`).
- You **MUST NOT** create or write to any files other than the implementation YAML file.
- Your job is to **create the plan**, not to **execute the plan**.

## 3. Source of Truth

- **File:** `TODO_DOMAIN_TEMPLATE.yaml`
- **Rule:** You MUST follow all `# AI-NOTE:` directives and replace all `__PLACEHOLDER__` variables.

## 4. Input Parameters

- **Feature Definition:** A single JSON object containing all the necessary information for the feature.

## 5. Step-by-Step Execution Plan

1.  **Parse Input:** Parse the provided JSON object.
2.  **Initialize:** Create the implementation YAML file in memory as a verbatim copy of the template.
3.  **Replace Placeholders:** Systematically replace all placeholders in the in-memory copy using the data from the JSON input.
4.  **Preserve Immutable Sections:** Double-check that all rule and documentation sections are untouched.
5.  **Final Validation (Mandatory):**
    a. Run the command: `npx tsx validate-implementation.ts TODO_DOMAIN_TEMPLATE.yaml {{featureName}}-implementation.yaml`.
    b. **Analyze the output:** - If the script exits with `✅ SUCCESS`, your task is complete. **Provide the final, validated YAML content as your output.** - If the script exits with `❌ FAILURE`, **do not show the broken YAML**. Instead, read the `➡️ AI ACTION:` instructions, fix the YAML in memory, and re-run the validation. Repeat this loop until the validation passes.

## 6. User Interaction

After you provide the final, validated YAML, I (the user) will review it. If it is correct, I will then personally run the `execute-steps.ts` script to apply the changes to the filesystem.

---

## Example Invocation

`/tasks-domain create feature from json:`

```json
{
  "featureName": "User Account",
  "useCases": [
    {
      "name": "Create User Account",
      "description": "Creates a new user account",
      "input": [
        { "name": "email", "type": "string" },
        { "name": "password", "type": "string" }
      ],
      "output": [
        { "name": "id", "type": "string" },
        { "name": "email", "type": "string" }
      ],
      "mockInput": [
        { "name": "email", "value": "'test@example.com'" },
        { "name": "password", "value": "'SecurePassword123!'" }
      ],
      "mockOutput": [
        { "name": "id", "value": "'user-123'" },
        { "name": "email", "value": "'test@example.com'" }
      ]
    }
  ],
  "errors": [
    {
      "name": "User Already Exists",
      "description": "when the email is already registered",
      "message": "User with this email already exists"
    }
  ]
}
```
