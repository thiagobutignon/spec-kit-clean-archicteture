/**
 * MCP Server Installer
 * Handles automatic installation of Model Context Protocol servers
 */

import { execSync } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';

// Supported MCP servers - single source of truth
export const SUPPORTED_MCP_SERVERS = ['serena', 'context7', 'chrome-devtools', 'playwright'] as const;

// Verification timeouts (in milliseconds)
// Higher timeouts in CI environments to account for slower execution
export const VERIFICATION_TIMEOUT = {
  CLI_CHECK: process.env.CI ? 5000 : 2000,    // 2s local, 5s CI
  MCP_LIST: process.env.CI ? 10000 : 5000     // 5s local, 10s CI
} as const;

// Retry configuration
export const RETRY_DELAY_MS = 1000; // 1 second delay between retry attempts

// Error message patterns
const ALREADY_EXISTS_PATTERN = 'already exists';

interface ExecError {
  stderr?: Buffer | string;
  message?: string;
}

/**
 * Custom error class for MCP installation failures
 * Preserves original error as cause for debugging
 */
export class MCPInstallationError extends Error {
  constructor(serverName: string, originalError: unknown) {
    const err = originalError as ExecError;
    const errorMsg = err?.stderr?.toString() || err?.message || 'Unknown error';
    super(`Failed to install ${serverName} MCP server: ${errorMsg}`);
    this.name = 'MCPInstallationError';
    this.cause = originalError;
  }
}

/**
 * Custom error class for MCP servers that already exist
 * Allows for type-safe handling of "already installed" scenarios
 */
export class MCPAlreadyExistsError extends Error {
  constructor(serverName: string) {
    super(`MCP server ${serverName} already exists`);
    this.name = 'MCPAlreadyExistsError';
  }
}

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
   * Type guard to check if error is MCPAlreadyExistsError
   * Provides type-safe error checking
   */
  private isAlreadyExistsError(error: unknown): error is MCPAlreadyExistsError {
    return error instanceof MCPAlreadyExistsError;
  }

  /**
   * Handle installation errors and update report accordingly
   * Reduces code duplication across all install methods
   */
  private handleInstallError(error: unknown, serverName: string, displayName: string, report: InstallReport): void {
    if (this.isAlreadyExistsError(error)) {
      report.skipped.push(`${serverName} (already installed)`);
      console.log(chalk.yellow(`⏭️  ${displayName} - Already installed (skipped)\n`));
      return;
    }

    report.failed.push(serverName);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`❌ ${displayName} installation failed: ${errorMessage}\n`));
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
        this.handleInstallError(error as Error, 'serena', 'Serena', report);
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
        this.handleInstallError(error as Error, 'context7', 'Context7', report);
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
        this.handleInstallError(error as Error, 'chrome-devtools', 'Chrome DevTools', report);
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
        this.handleInstallError(error as Error, 'playwright', 'Playwright', report);
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
    const quotedPath = this.projectPath.includes(' ') ? `"${this.projectPath}"` : this.projectPath;
    const command = `claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project ${quotedPath}`;
    try {
      execSync(command, { stdio: 'pipe' });
    } catch (error: unknown) {
      const err = error as ExecError;
      const stderr = err.stderr?.toString() || err.message || '';

      // Check if it's "already exists" error
      if (stderr.includes(ALREADY_EXISTS_PATTERN)) {
        throw new MCPAlreadyExistsError('serena');
      }

      throw new MCPInstallationError('Serena', error);
    }
  }

  /**
   * Install Context7 MCP server for documentation
   */
  async installContext7(apiKey: string): Promise<void> {
    const command = `claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ${apiKey}"`;
    try {
      execSync(command, { stdio: 'pipe' });
    } catch (error: unknown) {
      const err = error as ExecError;
      const stderr = err.stderr?.toString() || err.message || '';

      // Check if it's "already exists" error
      if (stderr.includes(ALREADY_EXISTS_PATTERN)) {
        throw new MCPAlreadyExistsError('context7');
      }

      throw new MCPInstallationError('Context7', error);
    }
  }

  /**
   * Install Chrome DevTools MCP for browser automation
   */
  async installChromeDevTools(): Promise<void> {
    const command = 'claude mcp add chrome-devtools npx chrome-devtools-mcp@latest';
    try {
      execSync(command, { stdio: 'pipe' });
    } catch (error: unknown) {
      const err = error as ExecError;
      const stderr = err.stderr?.toString() || err.message || '';

      // Check if it's "already exists" error
      if (stderr.includes(ALREADY_EXISTS_PATTERN)) {
        throw new MCPAlreadyExistsError('chrome-devtools');
      }

      throw new MCPInstallationError('Chrome DevTools', error);
    }
  }

  /**
   * Install Playwright MCP for E2E testing
   */
  async installPlaywright(): Promise<void> {
    const command = 'claude mcp add playwright npx @playwright/mcp@latest';
    try {
      execSync(command, { stdio: 'pipe' });
    } catch (error: unknown) {
      const err = error as ExecError;
      const stderr = err.stderr?.toString() || err.message || '';

      // Check if it's "already exists" error
      if (stderr.includes(ALREADY_EXISTS_PATTERN)) {
        throw new MCPAlreadyExistsError('playwright');
      }

      throw new MCPInstallationError('Playwright', error);
    }
  }

  /**
   * Verify MCP servers are properly installed
   * @param retries Number of retry attempts (default: 2)
   * @returns Array of detected server names
   */
  async verifyInstallation(retries = 2): Promise<string[]> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Check if claude CLI is available
        try {
          execSync('which claude', { stdio: 'pipe', timeout: VERIFICATION_TIMEOUT.CLI_CHECK });
        } catch {
          if (attempt === 0) {
            console.log(chalk.yellow('⚠️ Claude CLI not found - skipping MCP verification'));
          }
          return [];
        }

        const output = execSync('claude mcp list', {
          encoding: 'utf-8',
          stdio: 'pipe',
          timeout: VERIFICATION_TIMEOUT.MCP_LIST
        });

        // Parse only lines that look like server entries
        // Typical format: "  server-name    Connected" or "  server-name    Available"
        const serverRegex = /^\s+([\w-]+)\s+(?:Connected|Available|configured)$/gm;
        const servers = new Set<string>();

        // Use matchAll for safer regex iteration (no stateful global flag issues)
        const matches = output.matchAll(serverRegex);
        for (const match of matches) {
          const serverName = match[1];
          // Only add known MCP servers to avoid false positives
          if (SUPPORTED_MCP_SERVERS.includes(serverName as typeof SUPPORTED_MCP_SERVERS[number])) {
            servers.add(serverName);
          }
        }

        // If we found servers or this is the last attempt, return results
        if (servers.size > 0 || attempt === retries) {
          return Array.from(servers);
        }

        // Wait before retry to allow MCP servers to initialize
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      } catch (error) {
        // Log error for debugging in verbose mode
        if (process.env.DEBUG || process.env.VERBOSE) {
          console.error(`Verification attempt ${attempt + 1} failed:`, error);
        }

        // If this is the last attempt, return empty array
        if (attempt === retries) {
          return [];
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    return [];
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