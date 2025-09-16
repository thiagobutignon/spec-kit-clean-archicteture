# Task: Generate Domain Layer for a New Feature

## 1. Your Deliverable

Your **only** output for this task is the complete and valid content of a single YAML file: `{{featureName}}-implementation.yaml`.

## 2. Prohibited Actions

- You **MUST NOT** execute any commands from the `validation_script` (e.g., `mkdir`, `yarn lint`, `git commit`).
- You **MUST NOT** create or write to any files other than the implementation YAML file.
- Your job is to **create or update the plan**, not to **execute the plan**.

## 3. Source of Truth

- **File:** `templates/DOMAIN_TEMPLATE.yaml`
- **Rule:** You MUST follow all `# AI-NOTE:` directives and replace all `__PLACEHOLDER__` variables.

## 4. Input Parameters

- **Feature Definition:** A single JSON object containing all the necessary information for the feature.
- **Current YAML State (Optional):** The content of the existing `{{featureName}}-implementation.yaml` file, if it already exists from a previous run. If not provided, assume a blank slate.
- **Existing YAML (Optional):** The content of a pre-existing `implementation.yaml` file that needs to be updated.

### IF `Existing YAML` is NOT provided (Create Mode):

1.  **Initialize:** Create a new implementation YAML file in memory as a verbatim copy of `templates/DOMAIN_TEMPLATE.yaml`.
2.  **Generate `steps`:**
    a. Clear the generic `steps` from the template.
    b. For each Use Case and Error in the `JSON Plan`, replicate the corresponding step blocks from the template and add them to the `steps` array.
3.  **Populate Placeholders:** Systematically replace all `__PLACEHOLDER__` variables throughout the entire in-memory YAML using the data from the `JSON Plan`. This includes metadata, paths, and the `template` content within each step.

### IF `Existing YAML` IS provided (Update Mode):

1.  **Initialize:** Load the `Existing YAML` content into memory. This is your starting point.
2.  **Apply Corrections:** Analyze the `JSON Plan`. Your task is to **modify the in-memory YAML** to match the data structure defined in the JSON. This typically involves:
    a. Finding the specific `step` in the YAML that corresponds to a `useCase` in the JSON.
    b. Replacing the placeholder content (e.g., `__USE_CASE_INPUT_FIELDS__`) with the actual fields generated from the JSON's `input` and `output` arrays.
    c. Doing the same for `__MOCK_INPUT_DATA__` and `__MOCK_OUTPUT_DATA__` in the corresponding test helper steps.

### FINALLY, for both modes:

4.  **Preserve Immutable Sections:** Double-check that all rule and documentation sections are untouched (unless the update was specifically to them, which is rare).
5.  **Final Validation (Mandatory):**
    a. Run `npx tsx validate-implementation.ts templates/DOMAIN_TEMPLATE.yaml {{path_to_generated_yaml}}`.
    b. **Analyze and Self-Correct:** If it fails, read the `➡️ AI ACTION:` instructions, fix the YAML in memory, and re-validate. Loop until it passes.
6.  **Deliver:** Provide the final, validated YAML content as your output.

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
      export type RegisterUserInput = {
        __USE_CASE_INPUT_FIELDS__
      }
      # ...
```

`with json:`

```json
{
  "featureName": "User Registration",
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
