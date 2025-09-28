/**
 * Implementation command handler for Issue #76
 * Integrates SpecToYamlTransformer with execute-steps.ts
 */
import { SpecToYamlTransformer } from '../core/SpecToYamlTransformer.js';
import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function implementCommand(taskId: string): Promise<void> {
  console.log(`📋 Implementing task ${taskId}...`);

  // Step 1: Transform task to YAML
  const transformer = new SpecToYamlTransformer();
  const taskListPath = `.specify/tasks/TASK-LIST-SPEC-001-cli.md`;
  const workflow = await transformer.transformTask(taskId, taskListPath);

  // Step 2: Save YAML workflow
  const workflowDir = `.regent/workflows`;
  await fs.mkdir(workflowDir, { recursive: true });
  const yamlPath = path.join(workflowDir, `${taskId}-workflow.yaml`);
  await transformer.saveWorkflowAsYaml(workflow, yamlPath);
  console.log(`✅ Workflow saved to ${yamlPath}`);

  // Step 3: Execute using existing execute-steps.ts
  console.log(`🚀 Executing workflow...`);
  try {
    execSync(`npx tsx ../../execute-steps.ts ${yamlPath}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ Task ${taskId} implemented successfully!`);
  } catch (error) {
    console.error(`❌ Execution failed:`, error);
    throw error;
  }
}

// Export for CLI usage
export default implementCommand;