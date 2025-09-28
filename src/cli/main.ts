#!/usr/bin/env node

/**
 * The Regent CLI
 * Main entry point for the CLI application
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { checkCommand } from './commands/check.js';
import { showBanner } from './utils/banner.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8'));

const program = new Command();

// CLI metadata
program
  .name('regent')
  .description('The Regent - AI-powered Clean Architecture CLI with guaranteed architectural quality')
  .version(packageJson.version);

// Custom help display
const originalHelp = program.help.bind(program);
program.help = function(options?: any) {
  showBanner();
  return originalHelp(options);
};

// Commands
program
  .command('init')
  .description('Initialize a new Clean Architecture project')
  .argument('[project-name]', 'Name for your new project directory')
  .option('--ai <assistant>', 'AI assistant to use (claude, gemini, copilot, cursor)')
  .option('--here', 'Initialize in current directory')
  .option('--force', 'Force overwrite existing files')
  .option('--no-git', 'Skip git repository initialization')
  .option('--debug', 'Show debug information')
  .action(initCommand);

program
  .command('check')
  .description('Check that all required tools are installed')
  .action(checkCommand);

// Handle case where no command is provided
program.action(() => {
  showBanner();
  console.log(chalk.dim('Run \'regent --help\' for usage information\n'));
});

// Parse arguments
program.parse();