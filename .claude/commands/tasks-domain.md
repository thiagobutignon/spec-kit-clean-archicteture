# Task: Generate Domain Layer for a New Feature

## 1. Objective

Generate a complete and valid `{{featureName}}-implementation.yaml` file based **strictly** on `TODO_DOMAIN_TEMPLATE.yaml`.

## 2. Source of Truth

- **File:** `TODO_DOMAIN_TEMPLATE.yaml`
- **Rule:** You MUST follow all `# AI-NOTE:` directives and replace all `__PLACEHOLDER__` variables.

## 3. Input Parameters

- **Feature Definition:** A single JSON object containing all the necessary information for the feature.

## 4. Step-by-Step Execution Plan

1.  **Parse Input:** Parse the provided JSON object to understand the feature's requirements.
2.  **Initialize:** Create the implementation file as a verbatim copy of the template.
3.  **Replace Global Placeholders:** Use the `featureName` from the JSON to replace `__FEATURE_NAME_...__` and `__CURRENT_DATE__`.
4.  **Generate `steps`:**
    - **For each Use Case object in the `useCases` array:**
      a. Replicate the `create-use-case` and `create-test-helper` blocks from the template.
      b. Replace `__ACTION_ENTITY_...__` placeholders with the use case `name`.
      c. Replace `__USE_CASE_DESCRIPTION__` with the use case `description`.
      d. **Generate TypeScript Fields:** - For `__USE_CASE_INPUT_FIELDS__`, generate a multi-line string of `key: type;` from the `input` array. - For `__USE_CASE_OUTPUT_FIELDS__`, do the same from the `output` array.
      e. **Generate Mock Data:** - For `__MOCK_INPUT_DATA__`, generate a multi-line string of `key: value,` from the `mockInput` array. - For `__MOCK_OUTPUT_DATA__`, do the same from the `mockOutput` array.
    - **For each Error object in the `errors` array:**
      a. Replicate the `create-error` block.
      b. Replace `__ERROR_NAME_...__`, `__ERROR_DESCRIPTION__`, and `__ERROR_MESSAGE__` using the error's `name`, `description`, and `message`.
5.  **Preserve Immutable Sections:** Ensure all rule and documentation sections are untouched.
6.  **Final Validation:** Run `npx tsx validate-implementation.ts` and ensure it passes. If it fails, read the `➡️ AI ACTION:` instructions and self-correct until it succeeds.

---

## Example Invocation

To invoke this task, provide the command followed by a single, well-formed JSON code block.

`/tasks-domain create feature from json:`

```json
{
  "featureName": "User Account",
  "useCases": [
    {
      "name": "Create User Account",
      "description": "Creates a new user account with email, first name, last name, and password",
      "input": [
        { "name": "email", "type": "string" },
        { "name": "firstName", "type": "string" },
        { "name": "lastName", "type": "string" },
        { "name": "password", "type": "string" }
      ],
      "output": [
        { "name": "id", "type": "string" },
        { "name": "email", "type": "string" },
        { "name": "firstName", "type": "string" },
        { "name": "lastName", "type": "string" },
        { "name": "createdAt", "type": "Date" }
      ],
      "mockInput": [
        { "name": "email", "value": "'test@example.com'" },
        { "name": "firstName", "value": "'John'" },
        { "name": "lastName", "value": "'Doe'" },
        { "name": "password", "value": "'SecurePassword123!'" }
      ],
      "mockOutput": [
        { "name": "id", "value": "'user-123'" },
        { "name": "email", "value": "'test@example.com'" },
        { "name": "firstName", "value": "'John'" },
        { "name": "lastName", "value": "'Doe'" },
        { "name": "createdAt", "value": "new Date('2025-01-01T00:00:00Z')" }
      ]
    }
  ],
  "errors": [
    {
      "name": "User Already Exists",
      "description": "when the email is already registered",
      "message": "User with this email already exists"
    },
    {
      "name": "Invalid User Data",
      "description": "when required fields are invalid or missing",
      "message": "Invalid or missing required user data"
    }
  ]
}
```
