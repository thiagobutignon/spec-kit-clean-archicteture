/**
 * Setup MCP Command
 * Create or update project-level .mcp.json configuration
 * Part of Issue #150 permanent solution
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  mcpJsonExists,
  readMcpJson,
  generateMcpJson,
  createCustomMcpConfig,
  displayMcpJsonInfo,
  displayPrerequisites,
  DEFAULT_MCP_CONFIG
} from '../utils/mcp-json-generator.js';

export interface SetupMcpOptions {
  force?: boolean;
  all?: boolean;
}

export async function setupMcpCommand(options: SetupMcpOptions): Promise<void> {
  const projectPath = process.cwd();

  console.log(chalk.cyan.bold('\n🔧 MCP Configuration Setup\n'));

  try {
    // Check if .mcp.json already exists
    const exists = await mcpJsonExists(projectPath);

    if (exists && !options.force) {
      console.log(chalk.yellow('⚠️  .mcp.json already exists in this project\n'));

      // Read existing config
      const existingConfig = await readMcpJson(projectPath);
      if (existingConfig) {
        console.log(chalk.white('Current configuration:'));
        const servers = Object.keys(existingConfig.mcpServers);
        servers.forEach(server => {
          console.log(chalk.dim(`  • ${server}`));
        });
        console.log();
      }

      const overwriteAnswer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to overwrite the existing .mcp.json?',
          default: false
        }
      ]);

      if (!overwriteAnswer.overwrite) {
        console.log(chalk.yellow('✋ Keeping existing .mcp.json - no changes made\n'));
        console.log(chalk.dim('💡 Use --force to overwrite without prompt\n'));
        return;
      }
    }

    // Determine which servers to include
    let customConfig;

    if (options.all) {
      // Install all servers
      console.log(chalk.cyan('📦 Configuring all MCP servers...\n'));
      customConfig = DEFAULT_MCP_CONFIG;
    } else {
      // Interactive selection
      console.log(chalk.white('Select MCP servers to configure:\n'));

      const serverSelection = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'servers',
          message: 'Which MCP servers do you want to configure?',
          choices: [
            {
              name: 'serena - Semantic code search and editing',
              value: 'serena',
              checked: true
            },
            {
              name: 'context7 - Up-to-date library documentation',
              value: 'context7',
              checked: true
            },
            {
              name: 'chrome-devtools - Browser automation and debugging',
              value: 'chromeDevtools',
              checked: true
            },
            {
              name: 'playwright - Web testing and automation',
              value: 'playwright',
              checked: true
            }
          ],
          validate: (answer) => {
            if (answer.length < 1) {
              return 'You must select at least one MCP server';
            }
            return true;
          }
        }
      ]);

      // Create custom config based on selections
      customConfig = createCustomMcpConfig({
        serena: serverSelection.servers.includes('serena'),
        context7: serverSelection.servers.includes('context7'),
        chromeDevtools: serverSelection.servers.includes('chromeDevtools'),
        playwright: serverSelection.servers.includes('playwright')
      });
    }

    // Generate .mcp.json file
    console.log();
    await generateMcpJson(projectPath, customConfig, { force: true });

    // Display information
    displayMcpJsonInfo();
    displayPrerequisites();

    // Final instructions
    console.log(chalk.green.bold('✅ MCP configuration complete!\n'));
    console.log(chalk.cyan('🎯 Next steps:'));
    console.log(chalk.dim('  1. Commit .mcp.json to your repository:'));
    console.log(chalk.dim('     git add .mcp.json && git commit -m "feat: add MCP configuration"\n'));
    console.log(chalk.dim('  2. Reload Claude Code to detect project-level MCPs'));
    console.log(chalk.dim('  3. Approve MCP servers when prompted (one-time)\n'));
    console.log(chalk.dim('  4. MCPs will work automatically in all project directories\n'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to setup MCP configuration:'), error);
    console.error(chalk.dim('\n💡 Check docs/setup/mcp-configuration.md for help'));
    process.exit(1);
  }
}
