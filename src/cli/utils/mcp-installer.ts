/**
 * MCP Server Installer
 * Handles automatic installation of Model Context Protocol servers
 */

import { execSync } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';

export interface MCPConfig {
  installSerena?: boolean;
  installContext7?: boolean;
  installChromeDevTools?: boolean;
  installPlaywright?: boolean;
  context7ApiKey?: string;
}

export interface InstallReport {
  successful: string[];
  failed: string[];
  skipped: string[];
}

export class MCPInstaller {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Install all MCP servers based on configuration
   */
  async installAll(config: MCPConfig): Promise<InstallReport> {
    const report: InstallReport = {
      successful: [],
      failed: [],
      skipped: []
    };

    console.log(chalk.cyan.bold('\n📦 Installing MCP Servers...\n'));

    // Serena - Code Intelligence
    if (config.installSerena) {
      try {
        await this.installSerena();
        report.successful.push('serena');
        console.log(chalk.green('✅ Serena (Code Intelligence) installed\n'));
      } catch (error) {
        report.failed.push('serena');
        console.log(chalk.red(`❌ Serena installation failed: ${(error as Error).message}\n`));
      }
    } else {
      report.skipped.push('serena');
    }

    // Context7 - Documentation
    if (config.installContext7 && config.context7ApiKey) {
      try {
        await this.installContext7(config.context7ApiKey);
        report.successful.push('context7');
        console.log(chalk.green('✅ Context7 (Documentation) installed\n'));
      } catch (error) {
        report.failed.push('context7');
        console.log(chalk.red(`❌ Context7 installation failed: ${(error as Error).message}\n`));
      }
    } else if (config.installContext7 && !config.context7ApiKey) {
      report.skipped.push('context7 (no API key provided)');
    } else {
      report.skipped.push('context7');
    }

    // Chrome DevTools - Browser Automation
    if (config.installChromeDevTools) {
      try {
        await this.installChromeDevTools();
        report.successful.push('chrome-devtools');
        console.log(chalk.green('✅ Chrome DevTools (Browser Automation) installed\n'));
      } catch (error) {
        report.failed.push('chrome-devtools');
        console.log(chalk.red(`❌ Chrome DevTools installation failed: ${(error as Error).message}\n`));
      }
    } else {
      report.skipped.push('chrome-devtools');
    }

    // Playwright - E2E Testing
    if (config.installPlaywright) {
      try {
        await this.installPlaywright();
        report.successful.push('playwright');
        console.log(chalk.green('✅ Playwright (E2E Testing) installed\n'));
      } catch (error) {
        report.failed.push('playwright');
        console.log(chalk.red(`❌ Playwright installation failed: ${(error as Error).message}\n`));
      }
    } else {
      report.skipped.push('playwright');
    }

    this.printReport(report);
    return report;
  }

  /**
   * Install Serena MCP server for code intelligence
   */
  async installSerena(): Promise<void> {
    const command = `claude mcp add serena -- serena-mcp-server --context ide-assistant --project ${this.projectPath}`;
    execSync(command, { stdio: 'pipe' });
  }

  /**
   * Install Context7 MCP server for documentation
   */
  async installContext7(apiKey: string): Promise<void> {
    const command = `claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ${apiKey}"`;
    execSync(command, { stdio: 'pipe' });
  }

  /**
   * Install Chrome DevTools MCP for browser automation
   */
  async installChromeDevTools(): Promise<void> {
    const command = 'claude mcp add chrome-devtools npx chrome-devtools-mcp@latest';
    execSync(command, { stdio: 'pipe' });
  }

  /**
   * Install Playwright MCP for E2E testing
   */
  async installPlaywright(): Promise<void> {
    const command = 'claude mcp add playwright npx @playwright/mcp@latest';
    execSync(command, { stdio: 'pipe' });
  }

  /**
   * Print installation report
   */
  private printReport(report: InstallReport): void {
    console.log(chalk.cyan.bold('📊 Installation Report:\n'));

    if (report.successful.length > 0) {
      console.log(chalk.green.bold(`✅ Successfully installed (${report.successful.length}):`));
      report.successful.forEach(server => console.log(chalk.green(`   • ${server}`)));
      console.log();
    }

    if (report.failed.length > 0) {
      console.log(chalk.red.bold(`❌ Failed to install (${report.failed.length}):`));
      report.failed.forEach(server => console.log(chalk.red(`   • ${server}`)));
      console.log(chalk.yellow('   💡 You can install these manually later'));
      console.log();
    }

    if (report.skipped.length > 0) {
      console.log(chalk.yellow.bold(`⏭️  Skipped (${report.skipped.length}):`));
      report.skipped.forEach(server => console.log(chalk.dim(`   • ${server}`)));
      console.log();
    }
  }
}

/**
 * Interactive prompts for MCP server installation
 */
export async function promptMCPInstallation(): Promise<MCPConfig> {
  console.log(chalk.cyan.bold('\n🔧 MCP Server Setup\n'));
  console.log(chalk.dim('MCP servers enhance your development experience with:'));
  console.log(chalk.dim('  • Code intelligence and semantic search'));
  console.log(chalk.dim('  • Up-to-date library documentation'));
  console.log(chalk.dim('  • Browser automation and testing tools\n'));

  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'installMCP',
      message: 'Install recommended MCP servers?',
      default: true
    }
  ]);

  if (!answers.installMCP) {
    console.log(chalk.yellow('⏭️  Skipping MCP installation\n'));
    console.log(chalk.dim('💡 You can install MCP servers later with: regent setup-mcp\n'));
    return {};
  }

  const mcpAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'servers',
      message: 'Select MCP servers to install:',
      choices: [
        { name: 'Serena - Code intelligence & semantic search', value: 'serena', checked: true },
        { name: 'Context7 - Up-to-date library documentation', value: 'context7', checked: false },
        { name: 'Chrome DevTools - Browser automation', value: 'chrome-devtools', checked: true },
        { name: 'Playwright - E2E testing framework', value: 'playwright', checked: false }
      ]
    }
  ]);

  const config: MCPConfig = {
    installSerena: mcpAnswers.servers.includes('serena'),
    installContext7: mcpAnswers.servers.includes('context7'),
    installChromeDevTools: mcpAnswers.servers.includes('chrome-devtools'),
    installPlaywright: mcpAnswers.servers.includes('playwright')
  };

  // If Context7 is selected, prompt for API key
  if (config.installContext7) {
    console.log();
    console.log(chalk.cyan('🔑 Context7 API Key Required'));
    console.log(chalk.dim('Get your free API key at: https://context7.com/api-keys\n'));

    const keyAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your Context7 API key (or press Enter to skip):',
        validate: (input: string) => {
          if (!input) return true; // Allow skip
          if (input.length < 10) return 'API key seems too short';
          return true;
        }
      }
    ]);

    if (keyAnswer.apiKey) {
      config.context7ApiKey = keyAnswer.apiKey;
    } else {
      config.installContext7 = false;
      console.log(chalk.yellow('⏭️  Skipping Context7 (no API key provided)\n'));
    }
  }

  return config;
}