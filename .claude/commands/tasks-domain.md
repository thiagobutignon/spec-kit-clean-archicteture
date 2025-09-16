# Task: Generate Domain Layer for a New Feature

## 1. Objective

Your primary goal is to generate a complete and valid `[feature-name].yaml` file for a new domain layer feature. You **MUST** strictly adhere to the structure and rules defined in the master template file: `TODO_DOMAIN_TEMPLATE.yaml`.

## 2. Source of Truth (Non-Negotiable)

- **File:** `TODO_DOMAIN_TEMPLATE.yaml`
- **Rule:** This file is the **immutable source of truth**. Your generated file must be a direct derivative of this template. You are **NOT** allowed to reinterpret, redesign, or omit any sections from it.

## 3. Input Parameters

- **Feature Name:** `{{featureName}}` (e.g., "Payment", "User Authentication", "Product Catalog")
- **Use Cases:** `{{useCases}}` (A list of verb-noun actions, e.g., ["Process Payment", "Refund Payment", "Get Payment Status"])
- **Domain Errors:** `{{errors}}` (A list of error names, e.g., ["Payment Not Found", "Invalid Payment Amount", "Refund Failed"])

## 4. Step-by-Step Execution Plan

You **MUST** follow these steps in this exact order.

### Step 1: Initialization

1.  Read the entire content of `TODO_DOMAIN_TEMPLATE.yaml` into memory.
2.  Create a new file named `{{featureName}}-implementation.yaml`.
3.  Make an **exact, 100% verbatim copy** of the template's content into this new file. All subsequent steps will modify this new file.

### Step 2: Update Metadata and Structure

1.  In the `metadata` section of the new file, update the `title` and `description` to reflect the `{{featureName}}`.
2.  In the `structure` section, find the `basePath` key and replace the `[feature-name]` placeholder with the `{{featureName}}` in kebab-case (e.g., "User Authentication" becomes "user-authentication").

### Step 3: Generate Feature-Specific `steps`

This is the most critical part. You will dynamically generate the `steps` section by replicating the generic steps from the template for each Use Case and Error provided.

1.  **Clear existing generic `steps`:** Remove the generic `steps` from the new file (e.g., `create-use-case-[action-entity]`, `create-error-[error-name]`, etc.). You will replace them with specific instances.
2.  **Instantiate Steps for Each Use Case:** For each item in the `{{useCases}}` list:
    a. Take the Use Case name (e.g., "Process Payment").
    b. Convert it to `PascalCase` (e.g., `ProcessPayment`) and `kebab-case` (e.g., `process-payment`).
    c. **Replicate the `create-use-case-[action-entity]` block** from the template. Perform a find-and-replace on the placeholders: - `id`: `create-use-case-process-payment` - `path`: replace `[feature-name]` and `[action-entity]` - `template`: replace all instances of `[ActionEntity]` - `validation_script`: replace `[feature-name]` and `[action]` in the `git commit` message.
    d. **Replicate the `create-test-helper-[action-entity]` block** from the template, performing the same find-and-replace logic.
3.  **Instantiate Steps for Each Domain Error:** For each item in the `{{errors}}` list:
    a. Take the Error name (e.g., "Payment Not Found").
    b. Convert it to `PascalCase` (e.g., `PaymentNotFound`) and `kebab-case` (e.g., `payment-not-found`).
    c. **Replicate the `create-error-[error-name]` block** from the template, performing a find-and-replace for `[ErrorName]` and `[error-name]`.

### Step 4: Preserve All Rule and Guide Sections

Verify that the following sections in your generated `{{featureName}}-implementation.yaml` are **100% identical** to the corresponding sections in `TODO_DOMAIN_TEMPLATE.yaml`. They **MUST NOT** be altered or removed.

- `layer_rules`
- `domain_rules`
- `use_case_rules`
- `error_rules`
- `test_helper_rules`
- `troubleshooting`
- `refactoring`
- `recovery`
- `ai_guidelines`

### Step 5: Final Validation (Mandatory)

Before you conclude your task, you **MUST** run the validation script to prove your generated file is correct.

1.  Execute the following command in the shell:
    ```bash
    npx tsx validate-implementation.ts TODO_DOMAIN_TEMPLATE.yaml {{featureName}}-implementation.yaml
    ```
2.  **Analyze the output:**
    - If the script exits with `✅ SUCESSO`, your task is complete. Provide the content of the generated YAML file.
    - If the script exits with `❌ FALHA`, **do not show me the broken file**. Instead, read the errors reported by the script, go back to the previous steps, **fix the generated file**, and re-run the validation. Repeat this process until the validation passes.

---

## Example Invocation

To use this prompt, you would structure your request like this:

`/tasks-domain create feature "Payment" with use cases ["Process Payment", "Refund Payment"] and errors ["Payment Not Found", "Refund Failed"]`
