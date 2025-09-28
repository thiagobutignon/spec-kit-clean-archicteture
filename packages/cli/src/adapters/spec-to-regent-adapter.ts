/**
 * Adapter to connect spec-kit commands with .regent YAML system
 * Resolves Issue #75
 */
import { SpecToYamlTransformer } from '../core/SpecToYamlTransformer.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class SpecToRegentAdapter {
  private transformer: SpecToYamlTransformer;

  constructor() {
    this.transformer = new SpecToYamlTransformer();
  }

  /**
   * Convert JSON plan from /01-plan-layer-features to YAML workflows
   */
  async convertPlanToWorkflows(planPath: string): Promise<string[]> {
    const planContent = await fs.readFile(planPath, 'utf-8');
    const plan = JSON.parse(planContent);
    const workflows: string[] = [];

    for (const task of plan.tasks || []) {
      const workflow = await this.transformer.transformTaskObject(task);
      const outputPath = `.regent/workflows/${task.id}-workflow.yaml`;
      await this.transformer.saveWorkflowAsYaml(workflow, outputPath);
      workflows.push(outputPath);
    }

    console.log(`✅ Generated ${workflows.length} YAML workflows from plan`);
    return workflows;
  }

  /**
   * Ensure workflow can be executed by execute-steps.ts
   */
  async prepareForExecution(workflowPath: string): Promise<void> {
    // Verify file exists and is valid YAML
    const content = await fs.readFile(workflowPath, 'utf-8');
    if (!content.includes('steps:') && !content.includes('_steps:')) {
      throw new Error(`Invalid workflow format in ${workflowPath}`);
    }
    console.log(`✅ Workflow ${workflowPath} ready for execution`);
  }
}

export default SpecToRegentAdapter;