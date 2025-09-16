#!/usr/bin/env tsx

import crypto from 'crypto';
import os from 'os';
import yaml from 'yaml';
import 'zx/globals';
import Logger from './logger';
import { RLHFSystem } from './rlhf-system';

$.verbose = true;
$.shell = '/bin/bash';

interface Step {
  id: string;
  type: 'create_file' | 'refactor_file' | 'delete_file' | 'folder' | 'branch' | 'pull_request';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  rlhf_score: number | null;
  execution_log: string;
  path?: string;
  template?: string;
  action?: {
    create_folders?: {
      basePath?: string;
      folders?: string[];
    };
    branch_name?: string;
    target_branch?: string;
    source_branch?: string;
    title?: string;
  };
  validation_script?: string;
}

interface ImplementationPlan {
  steps: Step[];
  [key: string]: any;
}

class StepExecutor {
  private plan: ImplementationPlan;
  private logger: Logger;
  private rlhf: RLHFSystem;
  private startTime: number = 0;

  constructor(private implementationPath: string) {
    this.plan = { steps: [] };

    const logDir = path.join(path.dirname(implementationPath), '.logs', path.basename(implementationPath, '.yaml'));
    this.logger = new Logger(logDir);
    this.rlhf = new RLHFSystem();
  }

  private async loadPlan(): Promise<void> {
    console.log(chalk.magenta.bold(`🚀 Loading implementation file: ${this.implementationPath}`));
    try {
      const fileContent = await fs.readFile(this.implementationPath, 'utf-8');
      this.plan = yaml.parse(fileContent);
    } catch (error: any) {
      console.error(chalk.red.bold(`❌ Error: Could not read or parse the YAML file.`));
      console.error(chalk.red(`   Reason: ${error.message}`));
      process.exit(1);
    }
  }

  private async savePlan(): Promise<void> {
    const yamlString = yaml.stringify(this.plan);
    await fs.writeFile(this.implementationPath, yamlString, 'utf-8');
  }

  public async run(): Promise<void> {
    await this.loadPlan();
    const steps = this.plan.steps;

    if (!steps || !Array.isArray(steps)) {
      console.warn(chalk.yellow("Warning: No 'steps' section found. Nothing to execute."));
      return;
    }

    console.log(chalk.magenta.bold(`🚀 Starting execution of ${steps.length} steps...`));

    for (const [index, step] of steps.entries()) {
      const stepId = step.id || `Unnamed Step ${index + 1}`;
      console.log(chalk.blue.bold(`\n▶️  Processing Step ${index + 1}/${steps.length}: ${stepId}`));

      // LÓGICA PARA PULAR PASSOS JÁ CONCLUÍDOS
      if (step.status === 'SUCCESS' || step.status === 'SKIPPED') {
        console.log(chalk.gray(`   ⏭️  Skipping step with status '${step.status}'.`));
        continue;
      }

      try {
        // Track execution time
        this.startTime = Date.now();

        // Executa a ação principal do passo
        await this.executeStepAction(step);

        // Se a ação foi bem-sucedida, executa o script de validação
        if (step.validation_script) {
          const scriptOutput = await this.runValidationScript(step.validation_script, step.id);

          // Calculate execution duration
          const duration = Date.now() - this.startTime;

          // Apply automated RLHF scoring
          step.rlhf_score = await this.rlhf.calculateScore(step.type, true);

          // ATUALIZAÇÃO DE ESTADO EM CASO DE SUCESSO
          step.status = 'SUCCESS';
          step.execution_log = `Completed successfully at ${new Date().toISOString()} (${duration}ms).\nRLHF Score: ${step.rlhf_score}\n\n--- SCRIPT OUTPUT ---\n${scriptOutput}`;
          await this.savePlan();
        } else {
          // Se não houver script, a ação bem-sucedida é suficiente
          const duration = Date.now() - this.startTime;
          step.rlhf_score = await this.rlhf.calculateScore(step.type, true);
          step.status = 'SUCCESS';
          step.execution_log = `Action completed successfully at ${new Date().toISOString()} (${duration}ms). RLHF Score: ${step.rlhf_score}. No validation script provided.`;
          await this.savePlan();
        }

        console.log(chalk.green.bold(`✅ Step '${stepId}' completed successfully. RLHF Score: ${step.rlhf_score}`));

      } catch (error: any) {
        // Calculate execution duration even for failures
        const duration = Date.now() - this.startTime;

        // ATUALIZAÇÃO DE ESTADO EM CASO DE FALHA
        step.status = 'FAILED';
        const errorMessage = error.stderr || error.stdout || error.message || 'Unknown error';

        // Apply automated RLHF scoring for failure
        step.rlhf_score = await this.rlhf.calculateScore(step.type, false);

        step.execution_log = `Failed at ${new Date().toISOString()} (${duration}ms).\nRLHF Score: ${step.rlhf_score}\n\n--- ERROR LOG ---\n${errorMessage}`;
        await this.savePlan(); // Salva o estado de falha

        console.error(chalk.red.bold(`\n❌ ERROR: Step '${stepId}' failed. RLHF Score: ${step.rlhf_score}`));
        console.error(chalk.red(errorMessage));
        console.error(chalk.red.bold('Aborting execution. The YAML file has been updated with the failure details.'));

        // Trigger RLHF analysis for learning
        await this.rlhf.analyzeExecution(this.implementationPath);

        process.exit(1);
      }
    }

    console.log(chalk.green.bold('\n🎉 All steps completed successfully!'));

    // Perform final RLHF analysis
    console.log(chalk.blue.bold('\n🤖 Running RLHF analysis...'));
    await this.rlhf.analyzeExecution(this.implementationPath);

    // Calculate final score
    const finalScore = await this.calculateFinalRLHFScore();
    this.plan.evaluation = this.plan.evaluation || {};
    this.plan.evaluation.final_rlhf_score = finalScore;
    this.plan.evaluation.final_status = 'SUCCESS';
    await this.savePlan();

    console.log(chalk.cyan.bold(`\n📊 Final RLHF Score: ${finalScore}/2`));
    console.log(chalk.cyan('Run `npx tsx rlhf-system.ts report` to see learning insights'));

    this.logger.close();
  }

  private async executeStepAction(step: Step): Promise<void> {
    switch (step.type) {
      case 'create_file':
        await this.handleCreateFileStep(step);
        break;
      case 'refactor_file':
        await this.handleRefactorFileStep(step);
        break;
      case 'delete_file':
        await this.handleDeleteFileStep(step);
        break;
      case 'folder':
        await this.handleFolderStep(step);
        break;
      case 'branch':
        await this.handleBranchStep(step);
        break;
      case 'pull_request':
        await this.handlePullRequestStep(step);
        break;
      default:
        throw new Error(`Unknown step type: '${(step as any).type}'`);
    }
  }

  private async handleDeleteFileStep(step: Step): Promise<void> {
    const { path } = step;
    if (!path) throw new Error("Delete file step is missing 'path'.");

    console.log(chalk.red(`   🗑️ Deleting file: ${path}`));

    if (await fs.pathExists(path)) {
      await fs.remove(path);
      console.log(chalk.green(`   ✅ File successfully deleted.`));
    } else {
      console.warn(chalk.yellow(`   ⚠️  Warning: File to delete at ${path} does not exist. Skipping.`));
    }
  }

  private async handleCreateFileStep(step: Step): Promise<void> {
    // Lógica que já tínhamos para criar um arquivo
    const { path, template = '' } = step;
    if (!path) throw new Error("Create file step is missing 'path'.");
    console.log(chalk.cyan(`   📄 Creating file: ${path}`));
    await fs.ensureDir(path.substring(0, path.lastIndexOf('/')));
    await fs.writeFile(path, template);
  }

  private async handleFolderStep(step: any): Promise<void> {
    const basePath = step.action?.create_folders?.basePath;
    const folders = step.action?.create_folders?.folders || [];
    if (!basePath) throw new Error("Folder step is missing 'basePath'.");

    for (const folder of folders) {
      const fullPath = `${basePath}/${folder}`;
      console.log(chalk.cyan(`   📁 Creating directory: ${fullPath}`));
      await fs.ensureDir(fullPath);
    }
  }

  private async handleRefactorFileStep(step: Step): Promise<void> {
    const { path, template = '' } = step;
    if (!path) throw new Error("Refactor file step is missing 'path'.");

    console.log(chalk.cyan(`   🔧 Refactoring file: ${path}`));

    const replaceMatch = template.match(/<<<REPLACE>>>(.*?)<<<\/REPLACE>>>/s);
    const withMatch = template.match(/<<<WITH>>>(.*?)<<<\/WITH>>>/s);

    if (!replaceMatch || !withMatch) {
      throw new Error(`Invalid refactor template for step ${step.id}. Missing <<<REPLACE>>> or <<<WITH>>> blocks.`);
    }

    const oldCode = replaceMatch[1].trim();
    const newCode = withMatch[1].trim();

    if (!await fs.pathExists(path)) {
      throw new Error(`File to refactor does not exist at path: ${path}`);
    }
    const fileContent = await fs.readFile(path, 'utf-8');

    const newFileContent = fileContent.replace(oldCode, newCode);

    if (newFileContent === fileContent) {
      throw new Error(`Could not find the OLD code block in ${path}. Refactoring failed.`);
    }

    await fs.writeFile(path, newFileContent);
    console.log(chalk.green(`   ✅ Successfully applied refactoring to ${path}`));
  }

  private async handleBranchStep(step: Step): Promise<void> {
    const branchName = step.action?.branch_name;
    if (!branchName) {
      throw new Error("Branch step is missing 'action.branch_name'.");
    }

    console.log(chalk.cyan(`   🌿 Managing branch: ${branchName}`));

    // The validation script will handle the actual git operations
    // This method just ensures the configuration is correct
    console.log(chalk.blue(`   📝 Branch configuration validated. Will be created/checked out by validation script.`));
  }

  private async handlePullRequestStep(step: Step): Promise<void> {
    const { target_branch, source_branch, title } = step.action || {};

    if (!target_branch || !source_branch) {
      throw new Error("Pull request step is missing required 'action.target_branch' or 'action.source_branch'.");
    }

    console.log(chalk.cyan(`   🔄 Preparing pull request from ${source_branch} to ${target_branch}`));

    if (title) {
      console.log(chalk.blue(`   📋 PR Title: ${title}`));
    }

    // The validation script will handle the actual PR creation
    console.log(chalk.blue(`   📝 PR configuration validated. Will be created by validation script.`));
  }

  private async calculateFinalRLHFScore(): Promise<number> {
    const steps = this.plan.steps || [];
    let totalScore = 0;
    let validScores = 0;

    for (const step of steps) {
      if (step.rlhf_score !== null && step.rlhf_score !== undefined) {
        totalScore += step.rlhf_score;
        validScores++;
      }
    }

    // Average score, normalized to 0-2 range
    if (validScores === 0) return 1; // Neutral score if no data

    const avgScore = totalScore / validScores;
    // Normalize from [-2, 2] to [0, 2]
    return Math.max(0, Math.min(2, avgScore + 1));
  }

private async runValidationScript(scriptContent: string, stepId: string): Promise<string> {
    this.logger.log(`--- Running validation script for '${stepId}' ---`);
    
    const tempScriptPath = path.join(os.tmpdir(), `step-${crypto.randomUUID()}.sh`);
    let fullOutput = '';

    try {
      const normalizedScript = scriptContent.replace(/\r\n/g, '\n');
      await fs.writeFile(tempScriptPath, normalizedScript);
      await fs.chmod(tempScriptPath, '755');
      
      // Configura o zx para não imprimir a saída no console (nós faremos isso)
      $.verbose = false;
      const processPromise = $`bash ${tempScriptPath}`;

      // Intercepta stdout e stderr
      processPromise.stdout.on('data', (chunk) => {
        const data = chunk.toString();
        this.logger.log(data.trim());
        fullOutput += data;
      });
      processPromise.stderr.on('data', (chunk) => {
        const data = chunk.toString();
        this.logger.error(data.trim());
        fullOutput += data;
      });

      // Espera o processo terminar
      await processPromise;
      
      $.verbose = true; // Restaura o modo verbose para outros comandos
      this.logger.log(`--- Script finished successfully ---`);
      return fullOutput;

    } catch (error: any) {
      $.verbose = true; // Garante que o modo verbose seja restaurado em caso de erro
      // O erro já foi logado pelo stream, então apenas o relançamos
      throw error;
    } finally {
      if (await fs.pathExists(tempScriptPath)) {
        await fs.remove(tempScriptPath);
      }
    }
  }
}

async function main() {
  if (argv._.length < 1) {
    console.error(chalk.red.bold('Usage: npx tsx execute-steps.ts <path_to_implementation.yaml>'));
    process.exit(1);
  }
  const yamlFilePath = argv._[0] as string;
  const executor = new StepExecutor(yamlFilePath);
  await executor.run();
}

main().catch(err => {
  process.exit(1);
});