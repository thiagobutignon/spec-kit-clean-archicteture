# Task: Execute Domain YAML Plan

## 1. Your Deliverable

Your output is a stream of logs from the execution process, followed by a final JSON status report.

- If successful: `{"status": "SUCCESS", "message": "All steps executed successfully.", "commit_hashes": ["hash1", "hash2", ...]}`.
- If failed: `{"status": "FAILED", "failed_step_id": "...", "error_log": "...", "commit_hashes": ["hash1", ...]}`.

## 2. Objective

Your goal is to act as an automated build engineer. You will receive a final, fully approved YAML implementation plan. Your **only** job is to execute the steps in this plan, one by one, exactly as they are written, by calling the `execute-steps.ts` script.

## 3. Input Parameters

- **YAML Plan:** The complete, approved YAML content from the `/evaluate-tasks-domain` step.

## 4. Prohibited Actions

- You **MUST NOT** modify the logic of any step.
- You **MUST NOT** attempt to fix any failures yourself. Your job is to execute and report. If the script fails, you must stop and report the failure accurately.

## 5. Step-by-Step Execution Plan

1.  **Save the Plan:** Take the input YAML content and save it to a temporary file (e.g., `temp-plan.yaml`).
2.  **Execute the Script:** Run the `execute-steps.ts` script from the project root, passing the path to the temporary file as an argument.
    ```bash
    npx tsx execute-steps.ts temp-plan.yaml
    ```
3.  **Stream Output:** Stream the `stdout` and `stderr` from the script directly to the user in real-time. This provides visibility into the entire process.
4.  **Monitor Exit Code:** Wait for the `execute-steps.ts` script to complete and capture its exit code.
5.  **Generate Final Report:**
    a. **If the exit code is 0 (success):** The plan was executed successfully. Create the SUCCESS JSON report. You can parse the `execution_log` of the final YAML file to find the commit hashes.
    b. **If the exit code is not 0 (failure):** The execution failed. The `execute-steps.ts` script will have already updated the YAML file with the failure details. Read the updated YAML file to find the `failed_step_id` and the `error_log` to include in your FAILED JSON report.
6.  **Cleanup:** Delete the temporary file `temp-plan.yaml`.

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
🚀 Loading implementation file: temp-plan.yaml...
🚀 Starting execution of 2 steps...

▶️  Processing Step 1/2: create-structure
   ... (logs do script)
✅ Step 'create-structure' completed successfully.

▶️  Processing Step 2/2: create-use-case-create-user
   ... (logs do script)
✅ Step 'create-use-case-create-user' completed successfully.

🎉 All steps completed successfully!

{
  "status": "SUCCESS",
  "message": "All steps executed successfully.",
  "commit_hashes": ["e7e4cb9", "f666bd0"]
}
```
