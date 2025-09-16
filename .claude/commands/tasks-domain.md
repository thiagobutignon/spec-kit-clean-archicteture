# Task: Generate Domain Layer for a New Feature

## 1. Objective

Your primary goal is to generate a complete and valid `{{featureName}}-implementation.yaml` file for a new domain layer feature. You **MUST** strictly adhere to the structure and rules defined in the master template file: `TODO_DOMAIN_TEMPLATE.yaml`.

## 2. Source of Truth (Non-Negotiable)

- **File:** `TODO_DOMAIN_TEMPLATE.yaml`
- **Rule:** This file is the **immutable source of truth**. Your generated file must be a direct derivative of this template. You **MUST** follow all `# AI-NOTE:` directives within the template.

## 3. Input Parameters

- **Feature Name:** `{{featureName}}` (e.g., "Shopping Cart")
- **Use Cases:** `{{useCases}}` (A list of verb-noun actions, e.g., ["Add Item To Cart", "Remove Item From Cart"])
- **Domain Errors:** `{{errors}}` (A list of error names, e.g., ["Cart Not Found", "Item Not Found"])
- **Use Case Descriptions:** `{{useCaseDescriptions}}` (A list of short descriptions, one for each use case)
- **Error Descriptions:** `{{errorDescriptions}}` (A list of short descriptions, one for each error)

## 4. Step-by-Step Execution Plan

You **MUST** follow these steps in this exact order.

### Step 1: Initialization

1.  Read the entire content of `TODO_DOMAIN_TEMPLATE.yaml` into memory.
2.  Create a new file named `{{featureName}}-implementation.yaml` (using the feature name in kebab-case).
3.  Make an **exact, 100% verbatim copy** of the template's content into this new file.

### Step 2: Replace Global Placeholders

In the new file, perform these initial replacements:

1.  Find all instances of `__FEATURE_NAME_...__` placeholders and replace them with the correct case style derived from `{{featureName}}`.
2.  Replace `__CURRENT_DATE__` with the current date in `YYYY-MM-DD` format.

### Step 3: Generate Feature-Specific `steps`

This is the most critical part. You will dynamically generate the `steps` section by replicating the generic steps from the template.

1.  **Clear existing generic `steps`:** Remove the generic step blocks from the new file (i.e., `create-use-case-__ACTION_ENTITY_KEBAB_CASE__`, `create-error-__ERROR_NAME_KEBAB_CASE__`, etc.).
2.  **Instantiate Steps for Each Use Case:** For each item in the `{{useCases}}` list:
    a. **Replicate the `create-use-case` block** from the template. Replace all `__ACTION_ENTITY_...__` placeholders with the correct case styles derived from the use case name.
    b. Replace `__USE_CASE_DESCRIPTION__` with the corresponding description from `{{useCaseDescriptions}}`.
    c. **Replicate the `create-test-helper` block** from the template, replacing all `__ACTION_ENTITY_...__` placeholders.
3.  **Instantiate Steps for Each Domain Error:** For each item in the `{{errors}}` list:
    a. **Replicate the `create-error` block** from the template. Replace all `__ERROR_NAME_...__` placeholders with the correct case styles derived from the error name.
    b. Replace `__ERROR_DESCRIPTION__` and `__ERROR_MESSAGE__` with the corresponding descriptions.

### Step 4: Preserve Immutable Sections

Verify that the following sections in your generated file are **100% identical** to the template. They **MUST NOT** be altered. The validator will fail if they are changed.

- `layer_rules`, `domain_rules`, `use_case_rules`, `error_rules`, `test_helper_rules`
- `troubleshooting`, `refactoring`, `recovery`, `ai_guidelines`

### Step 5: Final Validation (Mandatory)

Before you conclude, you **MUST** run the validation script to prove your file is correct.

1.  Execute the command:
    ```bash
    npx tsx validate-implementation.ts TODO_DOMAIN_TEMPLATE.yaml {{featureName}}-implementation.yaml
    ```
2.  **Analyze the output:**
    - If the script exits with `✅ SUCCESS`, your task is complete. Provide the content of the generated YAML file.
    - If the script exits with `❌ FAILURE`, **do not show the broken file**. Instead, **read the `➡️ AI ACTION:` instructions** in the error output. Go back to the previous steps, **fix your generated file according to those instructions**, and re-run the validation. Repeat this loop until the validation passes.
