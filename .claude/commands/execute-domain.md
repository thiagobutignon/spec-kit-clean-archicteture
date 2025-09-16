# Task: Execute Domain YAML Plan

## 1. Your Deliverable

Your output is a stream of logs from the execution process, followed by a final JSON status report.

- If successful: `{"status": "SUCCESS", "message": "All steps executed successfully.", "commit_hashes": ["hash1", "hash2", ...]}`.
- If failed: `{"status": "FAILED", "failed_step_id": "...", "error_log": "...", "commit_hashes": ["hash1", ...]}`.

## 2. Objective

Your goal is to act as an automated build engineer. You will receive a final, fully approved YAML implementation plan. Your **only** job is to execute the steps in this plan, one by one, exactly as they are written.

## 3. Input Parameters

- **YAML Plan:** The complete, approved YAML content from the `/evaluate-tasks-domain` step.

## 4. Prohibited Actions

- You **MUST NOT** modify the logic of any step.
- You **MUST NOT** skip any steps unless their `status` is already `SUCCESS` or `SKIPPED`.
- You **MUST NOT** attempt to fix any failures. Your job is to execute and report. If a step fails, you stop and report the failure.

## 5. Step-by-Step Execution Plan

1.  **Initialize:** Announce the start of the execution process.
2.  **Load Script:** Load the `execute-steps.ts` script from the project's toolchain.
3.  **Execute Script:** Run the script, passing the input YAML plan to it.
    ```bash
    npx tsx execute-steps.ts {{path_to_input_yaml}}
    ```
4.  **Stream Output:** Stream the `stdout` and `stderr` from the script directly to the user in real-time. This provides visibility into the linting, testing, and committing process for each step.
5.  **Monitor Exit Code:** Wait for the `execute-steps.ts` script to complete.
6.  **Generate Final Report:**
    a. **If the script's exit code is 0 (success):** The entire plan was executed successfully. Create the SUCCESS JSON report, including a list of all the Git commit hashes that were created.
    b. **If the script's exit code is not 0 (failure):** The execution failed on a specific step. The `execute-steps.ts` script will have already updated the YAML file with the `FAILED` status and error log. Create the FAILED JSON report, specifying the `id` of the step that failed and including the final lines of the error log for context.

---

## Example Invocation

`/domain-execute from yaml:`

```yaml
# ... (o YAML completo e aprovado)
steps:
  - id: "create-structure"
    type: "folder"
    status: "PENDING"
    # ...
  - id: "create-use-case-create-user"
    type: "create_file"
    status: "PENDING"
    # ...
```

**Expected Output (em caso de sucesso):**

```
🚀 Loading implementation file: ...
🚀 Starting execution of 2 steps...

▶️  Executing Step 1/2: create-structure
   ... (logs do script)
✅ Step 'create-structure' completed successfully.

▶️  Executing Step 2/2: create-use-case-create-user
   ... (logs do script)
✅ Step 'create-use-case-create-user' completed successfully.

🎉 All steps completed successfully!

{
  "status": "SUCCESS",
  "message": "All steps executed successfully.",
  "commit_hashes": ["e7e4cb9", "f666bd0"]
}
```
