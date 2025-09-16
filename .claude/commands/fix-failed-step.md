# Task: Fix a Failed Step in an Implementation Plan

## 1. Your Objective

Your goal is to analyze a failed step in a YAML implementation plan and generate a **new step** to correct the issue.

## 2. Context

You will be given the entire content of a YAML file that has one or more steps with `status: 'FAILED'`.

## 3. Step-by-Step Execution Plan

1.  **Identify the Failure:** Find the last step in the file with `status: 'FAILED'`.
2.  **Analyze the Error:** Read the `execution_log` of the failed step to understand the root cause of the failure (e.g., linting error, test failure, commit error).
3.  **Analyze the Code:** Examine the `template` of the failed step to see the code that caused the error.
4.  **Formulate a Correction:** Based on your analysis, decide on the best course of action. This usually involves:
    a. **Refactoring the broken code:** If the original code was flawed.
    b. **Creating a missing dependency:** If a file was missing.
    c. **Deleting the broken artifact:** If the original step was fundamentally wrong.
5.  **Generate the Fix Step:**
    a. Create a **new step object** in the YAML structure.
    b. The new step's `id` should be descriptive, like `fix-for-[id-do-passo-que-falhou]`.
    c. The `type` of the new step should be appropriate for the fix (`refactor_file`, `create_file`, `delete_file`, etc.).
    d. Populate the `path` and `template` of the new step with the necessary code to fix the problem.
    e. Populate the `references` section to explain _why_ this fix is correct.
6.  **Append the New Step:** Add the newly generated step object to the **end of the `steps` array** in the YAML file.
7.  **Do Not Modify the Failed Step:** The original step with `status: 'FAILED'` **MUST** remain in the file untouched as a historical record.

## 4. Your Deliverable

Your **only** output is the complete content of the **updated** YAML file, now containing the new "fix" step at the end.
