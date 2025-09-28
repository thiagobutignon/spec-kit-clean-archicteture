/**
 * Adapter to connect spec-kit commands with .regent YAML system
 * Resolves Issue #75
 */
import { SpecToYamlTransformer } from '../core/SpecToYamlTransformer.js';
import { Task } from '../types/YamlWorkflow.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TaskPlan {
  tasks: Task[];
}

export class SpecToRegentAdapter {
  private transformer: SpecToYamlTransformer;

  constructor() {
    this.transformer = new SpecToYamlTransformer();
  }

  /**
   * Convert JSON plan from /01-plan-layer-features to YAML workflows
   */
  async convertPlanToWorkflows(planPath: string): Promise<string[]> {
    try {
      const planContent = await fs.readFile(planPath, 'utf-8');
      const plan: TaskPlan = JSON.parse(planContent);

      if (!plan.tasks || !Array.isArray(plan.tasks)) {
        throw new Error('Plan must contain tasks array');
      }

      const workflows: string[] = [];

      for (const task of plan.tasks) {
        if (!task.id) {
          console.warn('Skipping task without ID:', task);
          continue;
        }

        const workflow = await this.transformer.transformTaskObject(task);
        const outputPath = `.regent/workflows/${task.id}-workflow.yaml`;

        // Ensure directory exists
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await this.transformer.saveWorkflowAsYaml(workflow, outputPath);
        workflows.push(outputPath);
      }

      console.log(`✅ Generated ${workflows.length} YAML workflows from plan`);
      return workflows;
    } catch (error: any) {
      throw new Error(`Failed to convert plan to workflows: ${error.message}`);
    }
  }

  /**
   * Ensure workflow can be executed by execute-steps.ts
   */
  async prepareForExecution(workflowPath: string): Promise<void> {
    try {
      // Verify file exists and is valid YAML
      const content = await fs.readFile(workflowPath, 'utf-8');
      if (!content.includes('steps:') && !content.includes('_steps:')) {
        throw new Error(`Invalid workflow format in ${workflowPath}`);
      }
      console.log(`✅ Workflow ${workflowPath} ready for execution`);
    } catch (error: any) {
      throw new Error(`Failed to prepare workflow for execution: ${error.message}`);
    }
  }
}

export default SpecToRegentAdapter;