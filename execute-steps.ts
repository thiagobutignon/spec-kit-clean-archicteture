#!/usr/bin/env tsx

import crypto from 'crypto'; // Usado para gerar um nome de arquivo único
import os from 'os'; // Usado para encontrar o diretório temporário do sistema
import yaml from 'yaml';
import 'zx/globals';

// Configuração do zx
$.verbose = true;
$.shell = '/bin/bash';

class StepExecutor {
  private implementationData: any;

  constructor(private implementationPath: string) {}

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

  private async executeStep(step: Step): Promise<void> {
    if (step.type === 'create_file') {
      await this.handleCreateFileStep(step);
    } else if (step.type === 'refactor_file') {
      await this.handleRefactorFileStep(step);
    } else if (step.type === 'folder') {
      await this.handleFolderStep(step);
    }

    if (step.validation_script) {
      await this.runValidationScript(step.validation_script, step.id);
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

    // 1. Parsear o template de refatoração
    const replaceMatch = template.match(/<<<REPLACE>>>(.*?)<<<\/REPLACE>>>/s);
    const withMatch = template.match(/<<<WITH>>>(.*?)<<<\/WITH>>>/s);

    if (!replaceMatch || !withMatch) {
      throw new Error(`Invalid refactor template for step ${step.id}. Missing <<<REPLACE>>> or <<<WITH>>> blocks.`);
    }

    const oldCode = replaceMatch[1].trim();
    const newCode = withMatch[1].trim();

    // 2. Ler o arquivo existente
    if (!await fs.pathExists(path)) {
      throw new Error(`File to refactor does not exist at path: ${path}`);
    }
    const fileContent = await fs.readFile(path, 'utf-8');

    // 3. Executar a substituição
    const newFileContent = fileContent.replace(oldCode, newCode);

    if (newFileContent === fileContent) {
      // A substituição falhou, o código antigo não foi encontrado
      throw new Error(`Could not find the OLD code block in ${path}. Refactoring failed.`);
    }

    // 4. Escrever o arquivo modificado
    await fs.writeFile(path, newFileContent);
    console.log(chalk.green(`   ✅ Successfully applied refactoring to ${path}`));
  }

  /**
   * Executa um script shell escrevendo-o em um arquivo temporário e executando esse arquivo.
   * Esta é a abordagem mais robusta para scripts multi-linha complexos.
   */
  private async runValidationScript(scriptContent: string, stepId: string): Promise<void> {
    console.log(chalk.yellow(`   --- Running validation script for '${stepId}' ---`));
    
    // Cria um caminho único para o nosso script temporário
    const tempScriptPath = path.join(os.tmpdir(), `step-${crypto.randomUUID()}.sh`);

    try {
      // Normaliza os finais de linha para garantir a compatibilidade
      const normalizedScript = scriptContent.replace(/\r\n/g, '\n');
      
      // Escreve o script no arquivo temporário
      await fs.writeFile(tempScriptPath, normalizedScript);
      
      // Torna o arquivo temporário executável
      await fs.chmod(tempScriptPath, '755');
      
      // Executa o arquivo de script
      // zx irá transmitir a saída (stdout/stderr) automaticamente
      await $([tempScriptPath]);

    } finally {
      // Bloco finally garante que o arquivo temporário seja sempre excluído,
      // mesmo que o script falhe.
      if (await fs.pathExists(tempScriptPath)) {
        await fs.remove(tempScriptPath);
      }
    }
    
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
  process.exit(1);
});