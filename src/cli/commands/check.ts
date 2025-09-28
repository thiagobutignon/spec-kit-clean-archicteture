import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import shell from 'shelljs';

interface ToolCheck {
  name: string;
  command: string;
  description: string;
  installUrl?: string;
  required: boolean;
}

const TOOLS: ToolCheck[] = [
  {
    name: 'git',
    command: 'git',
    description: 'Git version control',
    installUrl: 'https://git-scm.com/downloads',
    required: false
  },
  {
    name: 'node',
    command: 'node',
    description: 'Node.js runtime',
    installUrl: 'https://nodejs.org/',
    required: true
  },
  {
    name: 'npm',
    command: 'npm',
    description: 'Node Package Manager',
    installUrl: 'https://nodejs.org/',
    required: true
  },
  {
    name: 'claude',
    command: 'claude',
    description: 'Claude Code CLI',
    installUrl: 'https://docs.anthropic.com/en/docs/claude-code/setup',
    required: false
  },
  {
    name: 'tsx',
    command: 'tsx',
    description: 'TypeScript execution',
    installUrl: 'npm install -g tsx',
    required: false
  }
];

const AI_TOOLS: ToolCheck[] = [
  {
    name: 'claude',
    command: 'claude',
    description: 'Claude Code CLI',
    installUrl: 'https://docs.anthropic.com/en/docs/claude-code/setup',
    required: false
  },
  {
    name: 'gemini',
    command: 'gemini',
    description: 'Gemini CLI',
    installUrl: 'https://github.com/google-gemini/gemini-cli',
    required: false
  },
  {
    name: 'cursor',
    command: 'cursor',
    description: 'Cursor IDE',
    installUrl: 'https://cursor.sh/',
    required: false
  }
];

export async function checkCommand(): Promise<void> {
  console.log(chalk.cyan.bold('🔍 Checking system requirements...\n'));

  let allGood = true;

  // Check essential tools
  console.log(chalk.blue.bold('Essential Tools:'));
  for (const tool of TOOLS) {
    const isAvailable = checkTool(tool.command);
    const status = isAvailable ?
      chalk.green('✅ available') :
      chalk.red('❌ not found');

    console.log(`  ${tool.name.padEnd(15)} ${status.padEnd(20)} ${chalk.dim(tool.description)}`);

    if (!isAvailable && tool.required) {
      allGood = false;
      console.log(chalk.red(`     ⚠️  Install from: ${tool.installUrl}`));
    }
  }

  console.log();

  // Check AI tools
  console.log(chalk.blue.bold('AI Assistant Tools:'));
  let aiToolsAvailable = 0;

  for (const tool of AI_TOOLS) {
    const isAvailable = checkTool(tool.command);
    const status = isAvailable ?
      chalk.green('✅ available') :
      chalk.yellow('⚠️  not found');

    console.log(`  ${tool.name.padEnd(15)} ${status.padEnd(20)} ${chalk.dim(tool.description)}`);

    if (isAvailable) {
      aiToolsAvailable++;
    } else {
      console.log(chalk.dim(`     💡 Install from: ${tool.installUrl}`));
    }
  }

  console.log();

  // Check project-specific files
  console.log(chalk.blue.bold('Project Configuration:'));
  const projectChecks = [
    { name: '.claude/', description: 'Claude commands and agents' },
    { name: 'templates/', description: 'Clean Architecture templates' },
    { name: 'package.json', description: 'Project configuration' }
  ];

  for (const check of projectChecks) {
    const exists = existsSync(check.name);
    const status = exists ?
      chalk.green('✅ found') :
      chalk.yellow('⚠️  missing');

    console.log(`  ${check.name.padEnd(15)} ${status.padEnd(20)} ${chalk.dim(check.description)}`);
  }

  console.log();

  // Summary
  if (allGood) {
    console.log(chalk.green.bold('🎉 All essential tools are available!'));
  } else {
    console.log(chalk.red.bold('❌ Some essential tools are missing. Please install them before proceeding.'));
  }

  if (aiToolsAvailable === 0) {
    console.log(chalk.yellow.bold('💡 Consider installing at least one AI assistant for the best experience.'));
  } else {
    console.log(chalk.green(`✅ ${aiToolsAvailable} AI assistant(s) available.`));
  }

  console.log();
  console.log(chalk.cyan('🚀 Ready to create Clean Architecture projects with spec-ca!'));
}

function checkTool(command: string): boolean {
  try {
    // Try using which first (cross-platform)
    if (shell.which(command)) {
      return true;
    }

    // Fallback to trying to run the command
    execSync(`${command} --version`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}