import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import inquirer from 'inquirer';
import crypto from 'crypto';
import { MCPInstaller, promptMCPInstallation } from '../utils/mcp-installer.js';
import { DEFAULT_GITIGNORE_TEMPLATE, REGENT_GITIGNORE_ENTRIES } from '../templates/default-gitignore.js';

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
  backupDir?: string;
  cleanupOldBackups?: boolean;
  dryRun?: boolean;
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

  // Create The Regent specific directories
  const regentDirs = [
    // Core regent structure
    '.regent',
    '.regent/core',
    '.regent/templates',
    '.regent/scripts',
    '.regent/config',
    '.regent/utils',
    '.regent/docs',

    // Claude integration
    '.claude',
    '.claude/commands',
    '.claude/agents'
  ];

  for (const dir of regentDirs) {
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
  await copyProjectConfigFiles(projectPath, isExistingProject, options);

  // Create initial files if new project
  if (!isExistingProject) {
    await createInitialFiles(projectPath, options);
  } else {
    await updateExistingProject(projectPath);
  }
}

interface ExistingConfigFile {
  path: string;
  relativePath: string;
  exists: boolean;
}

/**
 * Detects existing configuration files that might be overwritten during initialization
 * @param projectPath - Absolute path to the project directory
 * @returns Array of existing config files with their paths
 */
async function detectExistingConfigFiles(projectPath: string): Promise<ExistingConfigFile[]> {
  const configFiles = [
    '.vscode/settings.json',
    'eslint.config.js',
    'tsconfig.json',
    'vitest.config.ts',
    '.gitignore'
  ];

  const existingFiles: ExistingConfigFile[] = [];

  for (const file of configFiles) {
    const filePath = path.join(projectPath, file);
    const exists = await fs.pathExists(filePath);

    if (exists) {
      existingFiles.push({
        path: filePath,
        relativePath: file,
        exists: true
      });
    }
  }

  return existingFiles;
}

/**
 * Creates a timestamped backup of a configuration file
 *
 * Backup Naming Pattern: {filename}.regent-backup-{timestamp}-{uniqueId}{.ext}
 *
 * Examples:
 * - settings.json → settings.regent-backup-1234567890-a3f2b1.json
 * - eslint.config.js → eslint.config.regent-backup-1234567890-c9d4e2.js
 *
 * The extension is preserved to allow easy opening with appropriate tools.
 * A cryptographically random uniqueId prevents collisions even in concurrent operations.
 *
 * @param filePath - Absolute path to the file to backup
 * @param projectPath - Absolute path to the project root directory
 * @param backupDir - Optional custom backup directory (validated for security)
 * @returns Absolute path to the created backup file
 * @throws Error if backup directory cannot be created or path traversal is detected
 */
async function createBackup(filePath: string, projectPath: string, backupDir?: string): Promise<string> {
  // Use high-precision timestamp with nanosecond precision for better collision prevention
  const hrTime = process.hrtime.bigint();
  const timestamp = Number(hrTime / 1000000n); // Convert to milliseconds

  // Generate cryptographically random unique ID (6 chars) - prevents counter overflow
  // and handles concurrent operations safely
  const uniqueId = crypto.randomBytes(3).toString('hex');

  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);

  // Determine backup directory
  const targetBackupDir = backupDir || path.join(projectPath, '.regent-backups');

  // Validate and create backup directory
  if (backupDir) {
    // Prevent path traversal attacks
    const resolvedBackupDir = path.resolve(backupDir);
    const resolvedProjectPath = path.resolve(projectPath);

    // Check if backupDir is trying to escape project directory (when relative)
    if (!path.isAbsolute(backupDir) && !resolvedBackupDir.startsWith(resolvedProjectPath)) {
      throw new Error(`Backup directory must be inside project: ${backupDir}`);
    }

    try {
      await fs.ensureDir(resolvedBackupDir);
    } catch (error) {
      throw new Error(`Cannot create backup directory: ${backupDir} - ${(error as Error).message}`);
    }
  } else {
    await fs.ensureDir(targetBackupDir);
  }

  // Validate backup directory is writable
  try {
    await fs.access(targetBackupDir, fs.constants.W_OK).catch(async () => {
      // Directory doesn't exist or not writable, try to create it
      await fs.ensureDir(targetBackupDir);
      // Test write permission by creating and removing a temp file
      const testFile = path.join(targetBackupDir, '.regent-write-test');
      await fs.writeFile(testFile, '');
      await fs.remove(testFile);
    });
  } catch (error) {
    throw new Error(
      `Backup directory is not writable: ${targetBackupDir}\n` +
      `Please check directory permissions or specify a different directory with --backup-dir`
    );
  }

  // Create backup with better naming: filename.regent-backup-timestamp-uniqueId.ext
  // This preserves the extension, making it easier to open with appropriate tools
  const backupName = `${base}.regent-backup-${timestamp}-${uniqueId}${ext}`;
  const backupPath = path.join(targetBackupDir, backupName);

  try {
    await fs.copy(filePath, backupPath);
  } catch (error) {
    throw new Error(
      `Failed to create backup of ${path.basename(filePath)}: ${(error as Error).message}\n` +
      `Please check file permissions and available disk space`
    );
  }

  return backupPath;
}

/**
 * Cleans up backup files created during a failed backup operation
 *
 * This function is called when the backup process fails partway through,
 * ensuring that no partial backups are left in the system (atomic operation).
 *
 * @param backupPaths - Array of absolute paths to backup files to remove
 */
async function cleanupBackups(backupPaths: string[]): Promise<void> {
  console.log(chalk.yellow('\n🔄 Rolling back backups due to failure...'));
  for (const backupPath of backupPaths) {
    try {
      await fs.remove(backupPath);
      console.log(chalk.dim(`   ✓ Removed: ${path.basename(backupPath)}`));
    } catch (error) {
      console.log(chalk.dim(`   ⚠ Could not remove: ${path.basename(backupPath)}`));
    }
  }
}

/**
 * Cleans up old backup files, keeping only the most recent N backups
 *
 * Useful for preventing backup directory from growing indefinitely.
 * Optimized to only run when backup count exceeds threshold.
 *
 * @param backupDir - Directory containing backup files
 * @param keepCount - Number of most recent backups to keep (default: 10)
 */
async function cleanupOldBackups(backupDir: string, keepCount: number = 10): Promise<void> {
  if (!await fs.pathExists(backupDir)) {
    return;
  }

  try {
    const files = await fs.readdir(backupDir);

    // Filter only regent backup files
    const backupFiles = files.filter(f => f.includes('.regent-backup-'));

    // Performance optimization: only proceed if count exceeds threshold
    if (backupFiles.length <= keepCount) {
      return; // Nothing to clean up
    }

    // Get file stats for sorting by modification time
    const fileStats = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(backupDir, file);
        const stat = await fs.stat(filePath);
        return { file, filePath, mtime: stat.mtime };
      })
    );

    // Sort by modification time (newest first)
    fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Remove old backups beyond keepCount
    const filesToRemove = fileStats.slice(keepCount);

    if (filesToRemove.length > 0) {
      console.log(chalk.cyan(`\n🧹 Cleaning up ${filesToRemove.length} old backup(s)...`));

      for (const { file, filePath } of filesToRemove) {
        await fs.remove(filePath);
        console.log(chalk.dim(`   ✓ Removed: ${file}`));
      }
    }
  } catch (error) {
    // Non-critical operation, just log warning
    console.log(chalk.yellow(`⚠️  Could not clean up old backups: ${(error as Error).message}`));
  }
}

/**
 * Merges Regent-specific scripts into existing package.json
 *
 * Only adds scripts that don't already exist, preserving user's custom scripts.
 * This is a non-destructive merge operation.
 *
 * @param projectPath - Absolute path to the project directory
 */
async function mergePackageJsonScripts(projectPath: string): Promise<void> {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);

    // Add regent scripts without overwriting existing ones
    packageJson.scripts = packageJson.scripts || {};

    // Only add if they don't exist
    if (!packageJson.scripts['regent:build']) {
      packageJson.scripts['regent:build'] = 'cd .regent && ./templates/build-template.sh';
    }
    if (!packageJson.scripts['regent:validate']) {
      packageJson.scripts['regent:validate'] = 'tsx .regent/config/validate-template.ts';
    }
    if (!packageJson.scripts['regent:execute']) {
      packageJson.scripts['regent:execute'] = 'tsx .regent/config/execute-steps.ts';
    }

    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }
}

async function copyProjectConfigFiles(projectPath: string, isExistingProject: boolean, options: InitOptions = {}): Promise<void> {
  // Detect existing config files
  const existingFiles = await detectExistingConfigFiles(projectPath);

  // Dry-run mode: show what would be backed up without making changes
  if (options.dryRun && existingFiles.length > 0) {
    console.log(chalk.cyan('\n🔍 DRY-RUN MODE - No files will be modified\n'));
    console.log(chalk.yellow('The following files would be backed up and replaced:'));
    existingFiles.forEach(f => console.log(chalk.yellow(`   • ${f.relativePath}`)));
    console.log();
    console.log(chalk.dim('Run without --dry-run to proceed with backup and replacement'));
    return;
  }

  // If there are existing files and --force flag is not set, prompt user
  if (existingFiles.length > 0 && !options.force && isExistingProject) {
    console.log(chalk.yellow('\n⚠️  Existing configuration files detected:'));
    existingFiles.forEach(f => console.log(chalk.yellow(`   • ${f.relativePath}`)));
    console.log();

    const answer = await inquirer.prompt([{
      type: 'confirm',
      name: 'backup',
      message: 'Create backups and REPLACE existing files with Regent configuration?',
      default: true
    }]);

    if (!answer.backup) {
      console.log(chalk.cyan('\n✅ Keeping your existing configuration files'));
      console.log(chalk.dim('   💡 To use Regent configs, manually merge from:'));
      console.log(chalk.dim('      .regent/templates/config-examples/\n'));
      return;
    }

    // Create backups with rollback on failure
    console.log(chalk.cyan('\n📦 Creating backups...'));
    const successfulBackups: string[] = [];

    try {
      for (const file of existingFiles) {
        const backupPath = await createBackup(file.path, projectPath, options.backupDir);
        successfulBackups.push(backupPath);
        const displayPath = options.backupDir ? backupPath : path.relative(projectPath, backupPath);
        console.log(chalk.green(`   ✅ Backed up: ${file.relativePath} → ${displayPath}`));
      }
      console.log();

      // Cleanup old backups if requested
      if (options.cleanupOldBackups) {
        const backupDir = options.backupDir || path.join(projectPath, '.regent-backups');
        await cleanupOldBackups(backupDir);
      }
    } catch (error) {
      console.log(chalk.red(`\n   ❌ Failed to create backup: ${(error as Error).message}`));

      // Rollback: clean up any successful backups to maintain consistency
      if (successfulBackups.length > 0) {
        await cleanupBackups(successfulBackups);
      }

      throw new Error('Backup process failed. No files were modified. Please check permissions and try again.');
    }
  } else if (existingFiles.length > 0 && options.force) {
    console.log(chalk.yellow('\n⚠️  DANGER: Force flag detected - overwriting existing files WITHOUT backup'));
    console.log(chalk.yellow('   This action cannot be undone!\n'));

    // Double confirmation for --force flag to prevent accidents
    const forceConfirm = await inquirer.prompt([{
      type: 'confirm',
      name: 'reallyForce',
      message: 'Are you ABSOLUTELY SURE you want to proceed without backups?',
      default: false
    }]);

    if (!forceConfirm.reallyForce) {
      console.log(chalk.cyan('\n✅ Operation cancelled. Your files are safe.'));
      throw new Error('User cancelled force operation');
    }
  }

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
    const sourceEslintPath = path.join(packageRoot, 'eslint.config.js');
    if (await fs.pathExists(sourceEslintPath)) {
      try {
        const eslintConfig = await fs.readFile(sourceEslintPath, 'utf-8');
        await fs.writeFile(eslintPath, eslintConfig);
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Could not copy eslint.config.js: ${(error as Error).message}`));
        console.log(chalk.dim('   You can manually copy it from the regent package later if needed'));
      }
    } else {
      console.log(chalk.yellow('⚠️  Source eslint.config.js not found in regent package'));
      console.log(chalk.dim('   You may need to create your own ESLint configuration'));
    }
  }

  // Vitest config - only if doesn't exist
  const vitestPath = path.join(projectPath, 'vitest.config.ts');
  if (!await fs.pathExists(vitestPath)) {
    const sourceVitestPath = path.join(packageRoot, 'vitest.config.ts');
    if (await fs.pathExists(sourceVitestPath)) {
      try {
        const vitestConfig = await fs.readFile(sourceVitestPath, 'utf-8');
        await fs.writeFile(vitestPath, vitestConfig);
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Could not copy vitest.config.ts: ${(error as Error).message}`));
        console.log(chalk.dim('   You can manually copy it from the regent package later if needed'));
      }
    } else {
      console.log(chalk.yellow('⚠️  Source vitest.config.ts not found in regent package'));
      console.log(chalk.dim('   You may need to create your own Vitest configuration'));
    }
  }

  // .gitignore - merge if exists, create if not
  const gitignorePath = path.join(projectPath, '.gitignore');

  if (await fs.pathExists(gitignorePath)) {
    // Merge Regent entries into existing .gitignore
    const existingContent = await fs.readFile(gitignorePath, 'utf-8');

    // Normalize entries for comparison (remove trailing slashes, trim whitespace)
    const normalizeEntry = (entry: string) => entry.trim().replace(/\/+$/, '');

    const existingLines = existingContent.split('\n').map(normalizeEntry);

    // Filter out entries that already exist (avoid duplicates)
    const entriesToAdd = REGENT_GITIGNORE_ENTRIES.filter(entry => {
      const normalized = normalizeEntry(entry);
      // Skip comments and empty lines from duplicate check
      if (normalized.startsWith('#') || normalized === '') {
        return true;
      }
      // Check if this entry already exists (with or without trailing slash)
      return !existingLines.some(line => normalizeEntry(line) === normalized);
    });

    if (entriesToAdd.length > 0) {
      const mergedContent = existingContent.trim() + '\n\n' + entriesToAdd.join('\n') + '\n';
      await fs.writeFile(gitignorePath, mergedContent);
      console.log(chalk.cyan(`📝 Updated .gitignore with ${entriesToAdd.filter(e => !e.startsWith('#') && e.trim()).length} Regent-specific entries`));
    } else {
      console.log(chalk.dim('✓ .gitignore already contains Regent entries'));
    }
  } else {
    // Create new .gitignore with full content from template
    const gitignore = DEFAULT_GITIGNORE_TEMPLATE + '\n' + REGENT_GITIGNORE_ENTRIES.join('\n') + '\n';
    await fs.writeFile(gitignorePath, gitignore);
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

  await fs.writeFile(path.join(projectPath, '.regent/docs/constitution.md'), constitution);

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
  // Merge package.json scripts if it exists (smart merge, not overwrite)
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (await fs.pathExists(packageJsonPath)) {
    console.log(chalk.cyan('📦 Merging package.json scripts...'));
    await mergePackageJsonScripts(projectPath);
  }

  // Create constitution if doesn't exist
  const constitutionPath = path.join(projectPath, '.regent/docs/constitution.md');
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

  console.log(`   ${chalk.green('/01-plan-layer-features')} - Plan layer implementation`);
  console.log(`   ${chalk.green('/02-validate-layer-plan')} - Validate your plan`);
  console.log(`   ${chalk.green('/03-generate-layer-code')} - Generate code from plan`);
  console.log(`   ${chalk.green('/04-reflect-layer-lessons')} - Reflect and learn`);
  console.log(`   ${chalk.green('/05-evaluate-layer-results')} - Validate architecture`);
  console.log();

  console.log(chalk.cyan.bold('💡 Pro Tips:'));
  console.log(`• Templates are in ${chalk.blue('.regent/templates/')} directory`);
  console.log(`• Core files are in ${chalk.blue('.regent/core/')} directory`);
  console.log(`• Use ${chalk.green('npm run regent:build')} to generate layer templates`);
  console.log(`• Check ${chalk.blue('.regent/docs/constitution.md')} for project principles`);
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