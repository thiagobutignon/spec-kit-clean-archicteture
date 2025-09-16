#!/usr/bin/env tsx

import yaml from 'yaml';
import 'zx/globals'; // Importa $, fs, etc. para o escopo global

// Configuração do zx
$.verbose = true; // Imprime cada comando antes de executá-lo
$.shell = '/bin/bash'; // Garante que estamos usando bash

class StepExecutor {
  private implementationData: any;

  constructor(private implementationPath: string) {}

  /**
   * Carrega e parseia o arquivo YAML de implementação.
   */
  private async loadFile(): Promise<void> {
    console.log(chalk.magenta.bold(`🚀 Loading implementation file: ${this.implementationPath}`));
    try {
      const fileContent = await fs.readFile(this.implementationPath, 'utf-8');
      this.implementationData = yaml.parse(fileContent);
    } catch (error: any) {
      console.error(chalk.red.bold(`❌ Error: Could not read or parse the YAML file.`));
      console.error(chalk.red(`   Reason: ${error.message}`));
      process.exit(1);
    }
  }

  /**
   * Executa todos os passos definidos no arquivo YAML em ordem.
   */
  public async run(): Promise<void> {
    await this.loadFile();
    const steps = this.implementationData?.steps;

    if (!steps || !Array.isArray(steps)) {
      console.warn(chalk.yellow("Warning: No 'steps' section found. Nothing to execute."));
      return;
    }

    console.log(chalk.magenta.bold(`🚀 Starting execution of ${steps.length} steps...`));

    for (const [index, step] of steps.entries()) {
      const stepId = step.id || `Unnamed Step ${index + 1}`;
      console.log(chalk.blue.bold(`\n▶️  Executing Step ${index + 1}/${steps.length}: ${stepId}`));

      try {
        await this.executeStep(step);
        console.log(chalk.green.bold(`✅ Step '${stepId}' completed successfully.`));
      } catch (error) {
        console.error(chalk.red.bold(`\n❌ ERROR: Step '${stepId}' failed.`));
        console.error(chalk.red.bold('Aborting execution.'));
        process.exit(1);
      }
    }

    console.log(chalk.green.bold('\n🎉 All steps completed successfully!'));
  }

  /**
   * Despacha a execução para o manipulador correto e executa o script de validação.
   */
  private async executeStep(step: any): Promise<void> {
    if (step.type === 'file') {
      await this.handleFileStep(step);
    } else if (step.type === 'folder') {
      await this.handleFolderStep(step);
    }

    if (step.validation_script) {
      await this.runValidationScript(step.validation_script, step.id);
    }
  }

  /**
   * Cria um arquivo com base no template definido no passo.
   */
  private async handleFileStep(step: any): Promise<void> {
    const { path, template = '' } = step;
    if (!path) throw new Error("File step is missing the 'path' attribute.");

    console.log(chalk.cyan(`   📄 Creating file: ${path}`));
    await fs.ensureDir(path.substring(0, path.lastIndexOf('/')));
    await fs.writeFile(path, template);
  }

  /**
   * Cria as pastas definidas no passo.
   */
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

  /**
   * Executa um script shell usando zx.
   */
  private async runValidationScript(scriptContent: string, stepId: string): Promise<void> {
    console.log(chalk.yellow(`   --- Running validation script for '${stepId}' ---`));
    
    // zx lida com a execução de scripts multi-linha e streaming de saída nativamente.
    // O bloco try/catch no método run() irá capturar qualquer falha.
    await $`${scriptContent}`;
    
    console.log(chalk.yellow(`   --- Script finished successfully ---`));
  }
}

async function main() {
  if (argv._.length < 1) {
    console.error(chalk.red.bold('Usage: npx tsx execute_steps.ts <path_to_implementation.yaml>'));
    process.exit(1);
  }
  const yamlFilePath = argv._[0];
  const executor = new StepExecutor(yamlFilePath);
  await executor.run();
}

main().catch(err => {
  // O erro já é logado dentro do zx, então só precisamos garantir que o processo saia com falha.
  process.exit(1);
});