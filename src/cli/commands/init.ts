import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

interface InitOptions {
  ai?: string;
  here?: boolean;
  force?: boolean;
  git?: boolean;
  debug?: boolean;
}

const AI_CHOICES = {
  'claude': 'Claude Code',
  'gemini': 'Gemini CLI',
  'copilot': 'GitHub Copilot',
  'cursor': 'Cursor'
};

export async function initCommand(projectName: string | undefined, options: InitOptions): Promise<void> {
  console.log(chalk.cyan('🏗️ Initializing Spec-Kit Clean Architecture project...\n'));

  // Validate project name and options
  if (!options.here && !projectName) {
    console.error(chalk.red('Error: Must specify either a project name or use --here flag'));
    process.exit(1);
  }

  if (options.here && projectName) {
    console.error(chalk.red('Error: Cannot specify both project name and --here flag'));
    process.exit(1);
  }

  // Determine project path
  const currentDir = process.cwd();
  const projectPath = options.here ? currentDir : path.join(currentDir, projectName!);
  const displayName = options.here ? path.basename(currentDir) : projectName!;

  console.log(chalk.cyan('Setup Configuration:'));
  console.log(`  Project: ${chalk.green(displayName)}`);
  console.log(`  Path: ${chalk.dim(projectPath)}`);
  console.log(`  AI Assistant: ${chalk.yellow(options.ai || 'claude (default)')}`);
  console.log();

  try {
    // Create project structure
    await createProjectStructure(projectPath, options);

    // Initialize git if requested
    if (options.git !== false) {
      await initializeGit(projectPath);
    }

    // Show success message
    console.log(chalk.green.bold('✅ Project initialized successfully!\n'));

    // Show next steps
    showNextSteps(displayName, options.here);

  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize project:'), error);
    process.exit(1);
  }
}

async function createProjectStructure(projectPath: string, options: InitOptions): Promise<void> {
  console.log(chalk.cyan('📁 Creating project structure...'));

  // Create directories
  const directories = [
    '.specify',
    '.specify/memory',
    '.specify/specs',
    '.specify/plans',
    '.specify/tasks',
    '.specify/scripts',
    '.claude',
    '.claude/commands',
    '.claude/agents',
    'src',
    'templates'
  ];

  for (const dir of directories) {
    await fs.ensureDir(path.join(projectPath, dir));
  }

  // Copy existing .claude content if it exists
  const sourceClaudeDir = path.join(process.cwd(), '.claude');
  const targetClaudeDir = path.join(projectPath, '.claude');

  if (await fs.pathExists(sourceClaudeDir)) {
    console.log(chalk.cyan('📋 Copying existing Claude configuration...'));
    await fs.copy(sourceClaudeDir, targetClaudeDir);
  }

  // Copy templates
  const sourceTemplatesDir = path.join(process.cwd(), 'templates');
  const targetTemplatesDir = path.join(projectPath, 'templates');

  if (await fs.pathExists(sourceTemplatesDir)) {
    console.log(chalk.cyan('📄 Copying Clean Architecture templates...'));
    await fs.copy(sourceTemplatesDir, targetTemplatesDir);
  }

  // Create initial files
  await createInitialFiles(projectPath, options);
}

async function createInitialFiles(projectPath: string, options: InitOptions): Promise<void> {
  const packageJson = {
    name: path.basename(projectPath),
    version: '1.0.0',
    type: 'module',
    scripts: {
      'dev': 'tsx src/main.ts',
      'build': 'tsc',
      'lint': 'eslint .',
      'test': 'vitest',
      'templates:build': './templates/build-template.sh',
      'templates:validate': 'tsx validate-template.ts'
    },
    devDependencies: {
      'typescript': '^5.0.0',
      'tsx': '^4.0.0',
      '@types/node': '^20.0.0',
      'vitest': '^1.0.0'
    }
  };

  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

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

# Runtime data
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
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
generated-templates/
*-template.regent
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

  console.log(chalk.green('✅ Created initial project files'));
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

function showNextSteps(projectName: string, isHere: boolean): void {
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
  console.log(`• Use ${chalk.green('/01-plan-layer-features')} for detailed layer planning`);
  console.log(`• Run ${chalk.yellow('npm run templates:build')} to generate all layer templates`);
  console.log(`• Check ${chalk.blue('.specify/memory/constitution.md')} for project principles`);
  console.log();
}