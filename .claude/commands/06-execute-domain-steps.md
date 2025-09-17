# Task: Execute Domain YAML Plan

## 🤖 RLHF Scoring During Execution

The execute-steps.ts script automatically calculates RLHF scores for each step:
- **-2 (CATASTROPHIC)**: Architecture violations, wrong REPLACE/WITH format
- **-1 (RUNTIME ERROR)**: Lint failures, test failures, git errors
- **0 (LOW CONFIDENCE)**: Missing references, unclear implementation
- **+1 (GOOD)**: Valid implementation following patterns
- **+2 (PERFECT)**: Clean Architecture + DDD + ubiquitous language

## 1. Your Deliverable

Your output is a stream of logs from the execution process, followed by a final JSON status report.

- If successful: `{"status": "SUCCESS", "message": "All steps executed successfully.", "commit_hashes": ["hash1", "hash2", ...], "final_rlhf_score": 2}`.
- If failed: `{"status": "FAILED", "failed_step_id": "...", "error_log": "...", "commit_hashes": ["hash1", ...], "failed_step_rlhf_score": -1}`.

## 2. Objective

Your goal is to act as an automated build engineer. You will receive a final, fully approved YAML implementation plan. Your **only** job is to execute the steps in this plan, one by one, exactly as they are written.

## 3. Input Parameters

- **YAML Plan:** The complete, approved YAML content from the `/05-evaluate-domain-results` step.
- **Working Directory:** All files should be created relative to `spec/[FEATURE_NUMBER]-[FEATURE_NAME]/domain/`
  - Example: When the plan says to create `src/features/user-registration/domain/usecases/register-user.ts`,
    you should actually create it at `spec/001-user-registration/domain/src/features/user-registration/domain/usecases/register-user.ts`

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
4.  **Stream Output:** Stream the `stdout` and `stderr` from the script directly to the user in real-time. This provides visibility into the linting, testing, and committing process for each step. The output will include RLHF scores with visual indicators:
    - 🏆 = Perfect (+2)
    - ✅ = Good (+1)
    - ⚠️ = Low confidence (0)
    - ❌ = Runtime error (-1)
    - 💥 = Catastrophic (-2)
5.  **Monitor Exit Code:** Wait for the `execute-steps.ts` script to complete.
6.  **Generate Final Report:**
    a. **If the script's exit code is 0 (success):** The entire plan was executed successfully. Create the SUCCESS JSON report, including:
       - List of all Git commit hashes created
       - Final RLHF score (0-2) calculated as average of all step scores
       - Suggestion to run `npx tsx rlhf-system.ts report` for learning insights
    b. **If the script's exit code is not 0 (failure):** The execution failed on a specific step. Create the FAILED JSON report, including:
       - The `id` of the step that failed
       - The RLHF score of the failed step (usually -2 or -1)
       - Error log with context
       - Guidance based on the score (e.g., "Check Clean Architecture violations" for -2)

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

**Expected Output (Success with RLHF Scoring):**

```
🚀 Loading implementation file: ...
🚀 Starting execution of 2 steps...

▶️  Processing Step 1/2: create-structure
   📁 Creating directory: src/features/user/domain
   ✅ Step 'create-structure' completed successfully. RLHF Score: 1

▶️  Processing Step 2/2: create-use-case-create-user
   📄 Creating file: src/features/user/domain/use-cases/create-user.ts
   🔍 Running lint check...
   ✅ Lint check passed
   🏆 Step 'create-use-case-create-user' completed successfully. RLHF Score: 2

🎉 All steps completed successfully!

🤖 Running RLHF analysis...
📊 Final RLHF Score: 1.5/2

{
  "status": "SUCCESS",
  "message": "All steps executed successfully.",
  "commit_hashes": ["e7e4cb9", "f666bd0"],
  "final_rlhf_score": 1.5
}
```

**Expected Output (Failure with RLHF Scoring):**

```
🚀 Loading implementation file: ...
🚀 Starting execution of 2 steps...

▶️  Processing Step 1/2: create-structure
   📁 Creating directory: src/features/user/domain
   ✅ Step 'create-structure' completed successfully. RLHF Score: 1

▶️  Processing Step 2/2: create-use-case-with-axios
   📄 Creating file: src/features/user/domain/use-cases/fetch-user.ts
   🔍 Running architecture check...

💥 ERROR: Step 'create-use-case-with-axios' failed. RLHF Score: -2
🚨 CATASTROPHIC ERROR: Architecture violation detected
💡 Check: Clean Architecture violations, external dependencies in domain layer

Aborting execution. The YAML file has been updated with the failure details.

{
  "status": "FAILED",
  "failed_step_id": "create-use-case-with-axios",
  "error_log": "Architecture violation: axios import found in domain layer",
  "failed_step_rlhf_score": -2
}
```

## 📍 Next Step

Based on execution results:

- **If ALL steps SUCCEEDED**: Your domain layer is complete! Consider running RLHF improvements:
  ```bash
  /08-apply-domain-improvements
  ```

- **If ANY step FAILED**: Fix the failed step:
  ```bash
  /07-fix-domain-errors from yaml: <your-yaml-with-failed-step>
  ```

  After fixing, re-run execution:
  ```bash
  /06-execute-domain-steps from yaml: <your-fixed-yaml>
  ```
