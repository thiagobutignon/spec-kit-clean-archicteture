import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import inquirer from 'inquirer';
import { MCPInstaller, promptMCPInstallation } from '../utils/mcp-installer.js';

// Get the directory where this package is installed
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = path.resolve(__dirname, '..', '..', '..');

interface InitOptions {
  ai?: string;
  here?: boolean;
  force?: boolean;
  git?: boolean;
  debug?: boolean;
  skipMcp?: boolean;
}

// AI assistant options
const AI_ASSISTANTS = [
  { name: 'Claude Code (Anthropic)', value: 'claude' },
  { name: 'Gemini CLI (Google)', value: 'gemini' },
  { name: 'GitHub Copilot', value: 'copilot' },
  { name: 'Cursor AI', value: 'cursor' }
];

export async function initCommand(projectName: string | undefined, options: InitOptions): Promise<void> {
  console.log(chalk.cyan('🏗️ Initializing The Regent Clean Architecture project...\n'));

  // Interactive mode for project name if not provided
  if (!options.here && !projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is the name of your project?',
        validate: (input: string) => {
          if (!input.trim()) return 'Project name is required';
          if (!/^[a-z0-9-]+$/.test(input)) return 'Project name must contain only lowercase letters, numbers, and hyphens';
          return true;
        }
      }
    ]);
    projectName = answers.projectName;
  }

  if (options.here && projectName) {
    console.error(chalk.red('Error: Cannot specify both project name and --here flag'));
    process.exit(1);
  }

  // Interactive mode for AI assistant if not provided
  if (!options.ai) {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'ai',
        message: 'Which AI assistant will you be using?',
        choices: AI_ASSISTANTS,
        default: 'claude'
      }
    ]);
    options.ai = answers.ai;
  }

  // Determine project path
  const currentDir = process.cwd();
  const projectPath = options.here ? currentDir : path.join(currentDir, projectName!);
  const displayName = options.here ? path.basename(currentDir) : projectName!;

  // Check if we're in an existing project
  const isExistingProject = options.here || await fs.pathExists(path.join(projectPath, 'package.json'));

  console.log(chalk.cyan('Setup Configuration:'));
  console.log(`  Project: ${chalk.green(displayName)}`);
  console.log(`  Path: ${chalk.dim(projectPath)}`);
  console.log(`  Mode: ${chalk.yellow(isExistingProject ? 'Existing Project' : 'New Project')}`);
  console.log(`  AI Assistant: ${chalk.yellow(options.ai)}`);
  console.log();

  try {
    // Create project structure
    await createProjectStructure(projectPath, options, isExistingProject);

    // Initialize git if requested and not existing
    if (options.git !== false && !isExistingProject) {
      await initializeGit(projectPath);
    }

    // Show success message
    console.log(chalk.green.bold('✅ Project initialized successfully!\n'));

    // Install MCP servers if not skipped
    if (!options.skipMcp) {
      try {
        const mcpConfig = await promptMCPInstallation();

        if (Object.keys(mcpConfig).length > 0) {
          const installer = new MCPInstaller(projectPath);
          await installer.installAll(mcpConfig);

          // Verify installation
          console.log(chalk.cyan.bold('\n🔍 Verifying MCP installation...\n'));
          const installedServers = await installer.verifyInstallation();

          if (installedServers.length > 0) {
            console.log(chalk.green.bold('✅ MCP Servers Verified:\n'));
            installedServers.forEach(server => console.log(chalk.green(`   • ${server}`)));
            console.log();
            console.log(chalk.cyan('💡 Run /mcp in Claude Code to see available servers\n'));
          } else {
            console.log(chalk.yellow('⚠️ No MCP servers detected after installation'));
            console.log(chalk.dim('   Possible causes:'));
            console.log(chalk.dim('   • MCP servers may require a Claude Code restart'));
            console.log(chalk.dim('   • Installation may have failed silently'));
            console.log(chalk.dim('   • Claude CLI may not be properly configured'));
            console.log(chalk.dim('\n   Next steps:'));
            console.log(chalk.dim('   1. Run: claude mcp list'));
            console.log(chalk.dim('   2. Restart your Claude Code session'));
            console.log(chalk.dim('   3. Check SETUP_MCP.md for troubleshooting\n'));
          }
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ MCP installation encountered an issue - continuing without MCP servers'));
        console.log(chalk.dim(`   Error: ${(error as Error).message}`));
        console.log(chalk.dim('   💡 You can install MCP servers manually (see SETUP_MCP.md)\n'));
      }
    } else {
      console.log(chalk.yellow('⏭️  Skipping MCP installation (--skip-mcp flag)\n'));
    }

    // Show next steps
    showNextSteps(displayName, options.here ?? false, isExistingProject);

  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize project:'), error);
    process.exit(1);
  }
}

async function createProjectStructure(projectPath: string, options: InitOptions, isExistingProject: boolean): Promise<void> {
  console.log(chalk.cyan('📁 Setting up The Regent structure...'));

  // Create spec-kit specific directories
  const specKitDirs = [
    '.regent',
    '.regent/core',
    '.regent/scripts',
    '.regent/templates',
    '.regent/config',
    '.regent/utils',
    '.specify',
    '.specify/memory',
    '.specify/specs',
    '.specify/plans',
    '.specify/tasks',
    '.specify/scripts',
    '.claude',
    '.claude/commands',
    '.claude/agents'
  ];

  for (const dir of specKitDirs) {
    await fs.ensureDir(path.join(projectPath, dir));
  }

  // Copy .claude content (always safe to copy)
  const sourceClaudeDir = path.join(packageRoot, '.claude');
  const targetClaudeDir = path.join(projectPath, '.claude');

  if (await fs.pathExists(sourceClaudeDir)) {
    console.log(chalk.cyan('📋 Setting up Claude AI configuration...'));
    await fs.copy(sourceClaudeDir, targetClaudeDir, { overwrite: true });
  }

  // Copy templates to .regent/templates
  const sourceTemplatesDir = path.join(packageRoot, 'templates');
  const targetTemplatesDir = path.join(projectPath, '.regent/templates');

  if (await fs.pathExists(sourceTemplatesDir)) {
    console.log(chalk.cyan('📄 Installing Clean Architecture templates...'));
    await fs.copy(sourceTemplatesDir, targetTemplatesDir, { overwrite: true });
  }

  // Copy core files to .regent/core
  const sourceCoreDir = path.join(packageRoot, 'core');
  const targetCoreDir = path.join(projectPath, '.regent/core');

  if (await fs.pathExists(sourceCoreDir)) {
    console.log(chalk.cyan('🎯 Installing core system files...'));
    await fs.copy(sourceCoreDir, targetCoreDir, { overwrite: true });
  }

  // Copy scripts to .regent/scripts
  const sourceScriptsDir = path.join(packageRoot, 'scripts');
  const targetScriptsDir = path.join(projectPath, '.regent/scripts');

  if (await fs.pathExists(sourceScriptsDir)) {
    console.log(chalk.cyan('📜 Installing utility scripts...'));
    await fs.copy(sourceScriptsDir, targetScriptsDir, { overwrite: true });
  }

  // Copy utils to .regent/utils
  const sourceUtilsDir = path.join(packageRoot, 'utils');
  const targetUtilsDir = path.join(projectPath, '.regent/utils');

  if (await fs.pathExists(sourceUtilsDir)) {
    console.log(chalk.cyan('🔧 Installing utility modules...'));
    await fs.copy(sourceUtilsDir, targetUtilsDir, { overwrite: true });

    // Verify critical files exist
    const logResolverPath = path.join(targetUtilsDir, 'log-path-resolver.ts');
    if (!await fs.pathExists(logResolverPath)) {
      throw new Error('Failed to copy utils/ directory - log-path-resolver.ts missing');
    }
    console.log(chalk.green('   ✅ Utility modules installed'));
  }

  // Copy config files to .regent/config
  const configFiles = [
    'execute-steps.ts',
    'validate-template.ts',
    'regent.schema.json'
  ];

  console.log(chalk.cyan('⚙️ Installing configuration files...'));
  for (const file of configFiles) {
    const sourcePath = path.join(packageRoot, file);
    const targetPath = path.join(projectPath, '.regent/config', file);

    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetPath);
    }
  }

  // Only copy project config files if they don't exist
  await copyProjectConfigFiles(projectPath, isExistingProject);

  // Create initial files if new project
  if (!isExistingProject) {
    await createInitialFiles(projectPath, options);
  } else {
    await updateExistingProject(projectPath);
  }
}

async function copyProjectConfigFiles(projectPath: string, isExistingProject: boolean): Promise<void> {
  // VS Code settings - merge if exists
  const vscodeSettingsPath = path.join(projectPath, '.vscode/settings.json');
  const sourceVscodeSettings = path.join(packageRoot, '.vscode/settings.json');

  if (!await fs.pathExists(vscodeSettingsPath) && await fs.pathExists(sourceVscodeSettings)) {
    console.log(chalk.cyan('⚙️ Adding VS Code configuration...'));
    await fs.ensureDir(path.join(projectPath, '.vscode'));
    await fs.copy(sourceVscodeSettings, vscodeSettingsPath);
  }

  // TypeScript config - only if doesn't exist
  const tsconfigPath = path.join(projectPath, 'tsconfig.json');
  if (!await fs.pathExists(tsconfigPath)) {
    const tsconfig = {
      "compilerOptions": {
        "target": "ES2022",
        "module": "ES2022",
        "lib": ["ES2022"],
        "moduleResolution": "node",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "resolveJsonModule": true,
        "allowSyntheticDefaultImports": true,
        "paths": {
          "@/*": ["./src/*"],
          "@regent/*": ["./.regent/*"]
        }
      },
      "include": ["src/**/*", ".regent/**/*"],
      "exclude": ["node_modules", "dist"]
    };
    await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
  }

  // ESLint config - only if doesn't exist
  const eslintPath = path.join(projectPath, 'eslint.config.js');
  if (!await fs.pathExists(eslintPath)) {
    const eslintConfig = await fs.readFile(path.join(packageRoot, 'eslint.config.js'), 'utf-8');
    await fs.writeFile(eslintPath, eslintConfig);
  }

  // Vitest config - only if doesn't exist
  const vitestPath = path.join(projectPath, 'vitest.config.ts');
  if (!await fs.pathExists(vitestPath)) {
    const vitestConfig = await fs.readFile(path.join(packageRoot, 'vitest.config.ts'), 'utf-8');
    await fs.writeFile(vitestPath, vitestConfig);
  }
}

async function createInitialFiles(projectPath: string, _options: InitOptions): Promise<void> {
  // Create a minimal package.json if it doesn't exist
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!await fs.pathExists(packageJsonPath)) {
    const packageJson = {
      name: path.basename(projectPath),
      version: '1.0.0',
      type: 'module',
      scripts: {
        'dev': 'tsx src/main.ts',
        'build': 'tsc',
        'lint': 'eslint .',
        'test': 'vitest',
        'regent:build': 'cd .regent && ./templates/build-template.sh',
        'regent:validate': 'tsx .regent/config/validate-template.ts',
        'regent:execute': 'tsx .regent/config/execute-steps.ts'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        'tsx': '^4.0.0',
        '@types/node': '^20.0.0',
        'vitest': '^1.0.0',
        'eslint': '^9.0.0'
      }
    };
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  // Create constitution.md
  const constitution = `# Project Constitution

## Clean Architecture Principles

### I. Dependency Rule
- Dependencies point inward only (Presentation → Domain ← Data)
- Domain layer has zero external dependencies
- Interfaces defined in domain, implemented in outer layers

### II. Layer Responsibilities

#### Domain Layer
- Pure business logic and types
- Entities, value objects, use cases
- No external dependencies

#### Data Layer
- Repository implementations
- Data source abstractions
- DTOs and mappers

#### Infrastructure Layer
- External service integrations
- Database implementations
- Framework-specific adapters

#### Presentation Layer
- Controllers and routes
- Input validation
- Response formatting

#### Main Layer
- Dependency injection
- Application composition
- Bootstrap sequence

### III. Development Standards
- Test-driven development (TDD)
- Atomic commits with conventional commit format
- Clean Architecture compliance validated by RLHF system
- Feature slice architecture for modular development

### IV. Quality Gates
- All code must achieve RLHF score +1 or higher
- Zero architectural violations allowed
- Complete test coverage for domain layer
- API contract compliance
`;

  await fs.writeFile(path.join(projectPath, '.specify/memory/constitution.md'), constitution);

  // Create .gitignore
  const gitignorePath = path.join(projectPath, '.gitignore');
  if (!await fs.pathExists(gitignorePath)) {
    const gitignore = `# Dependencies
node_modules/
.pnp
.pnp.js

# Production
/build
/dist

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Spec-kit clean architecture
.rlhf/
.logs/
.regent/templates/*-template.regent
!.regent/templates/parts/
`;
    await fs.writeFile(gitignorePath, gitignore);
  }

  // Create src directory with placeholder
  const srcPath = path.join(projectPath, 'src');
  await fs.ensureDir(srcPath);

  const mainTsPath = path.join(srcPath, 'main.ts');
  if (!await fs.pathExists(mainTsPath)) {
    const mainContent = `// Entry point for your Clean Architecture application
console.log('🚀 Clean Architecture Project');
`;
    await fs.writeFile(mainTsPath, mainContent);
  }

  console.log(chalk.green('✅ Created initial project files'));
}

async function updateExistingProject(projectPath: string): Promise<void> {
  // Update package.json scripts if it exists
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (await fs.pathExists(packageJsonPath)) {
    console.log(chalk.cyan('📦 Updating package.json scripts...'));

    const packageJson = await fs.readJson(packageJsonPath);

    // Add spec-kit specific scripts
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['regent:build'] = 'cd .regent && ./templates/build-template.sh';
    packageJson.scripts['regent:validate'] = 'tsx .regent/config/validate-template.ts';
    packageJson.scripts['regent:execute'] = 'tsx .regent/config/execute-steps.ts';

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  // Create constitution if doesn't exist
  const constitutionPath = path.join(projectPath, '.specify/memory/constitution.md');
  if (!await fs.pathExists(constitutionPath)) {
    const constitution = `# Project Constitution

## Clean Architecture Principles
This document defines the architectural principles for this project.
Customize it according to your specific needs.

### Core Principles
- Clean Architecture compliance
- Test-driven development
- Domain-driven design
`;
    await fs.writeFile(constitutionPath, constitution);
  }

  console.log(chalk.green('✅ Updated existing project'));
}

async function initializeGit(projectPath: string): Promise<void> {
  try {
    console.log(chalk.cyan('🔧 Initializing git repository...'));

    execSync('git init', { cwd: projectPath, stdio: 'pipe' });
    execSync('git add .', { cwd: projectPath, stdio: 'pipe' });
    execSync('git commit -m "Initial commit: Spec-Kit Clean Architecture project"', {
      cwd: projectPath,
      stdio: 'pipe'
    });

    console.log(chalk.green('✅ Git repository initialized'));
  } catch (error) {
    console.log(chalk.yellow('⚠️ Git initialization failed - continuing without git'));
  }
}

function showNextSteps(projectName: string, isHere: boolean, isExistingProject: boolean): void {
  console.log(chalk.cyan.bold('📋 Next Steps:'));
  console.log();

  if (!isHere) {
    console.log(`1. ${chalk.cyan('cd ' + projectName)}`);
    console.log('2. Start the Clean Architecture workflow:');
  } else {
    console.log('1. Start the Clean Architecture workflow:');
  }

  console.log(`   ${chalk.green('/constitution')} - Review and customize project principles`);
  console.log(`   ${chalk.green('/specify')} - Create your first feature specification`);
  console.log(`   ${chalk.green('/plan')} - Generate Clean Architecture implementation plan`);
  console.log(`   ${chalk.green('/tasks')} - Break down into layer-specific tasks`);
  console.log(`   ${chalk.green('/implement')} - Execute with .regent templates`);
  console.log();

  console.log(chalk.cyan.bold('💡 Pro Tips:'));
  console.log(`• Templates are in ${chalk.blue('.regent/templates/')} directory`);
  console.log(`• Core files are in ${chalk.blue('.regent/core/')} directory`);
  console.log(`• Use ${chalk.green('npm run regent:build')} to generate layer templates`);
  console.log(`• Check ${chalk.blue('.specify/memory/constitution.md')} for project principles`);
  console.log(`• If MCP servers installed: restart Claude Code session for detection`);

  if (isExistingProject) {
    console.log();
    console.log(chalk.yellow.bold('⚠️ Existing Project Notice:'));
    console.log(`• The Regent files were added to ${chalk.blue('.regent/')} directory`);
    console.log(`• Your existing files were not modified`);
    console.log(`• Review ${chalk.blue('package.json')} for new scripts`);
  }

  console.log();
}