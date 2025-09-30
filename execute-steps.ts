#!/usr/bin/env tsx

/**
 * Enhanced Step Executor
 * Executes layer-specific templates with pre-validation and architectural awareness
 * Integrates best practices from the template validation system
 */

import * as crypto from 'crypto';
import * as os from 'os';
import * as yaml from 'yaml';
import 'zx/globals';
import Logger from '../core/logger';
import { EnhancedRLHFSystem, LayerInfo } from '../core/rlhf-system';
import { resolveLogDirectory } from '../utils/log-path-resolver';
import { EnhancedTemplateValidator } from './validate-template';
import type { ValidationResult } from './validate-template';
import {
  generateCommitMessage,
  shouldCommitStep,
  type CommitConfig,
  DEFAULT_COMMIT_CONFIG,
  type QualityCheckResult,
  createQualityCheckResult,
} from '../utils/commit-generator';

$.verbose = true;
$.shell = '/bin/bash';

interface Step {
  id: string;
  type: 'create_file' | 'refactor_file' | 'delete_file' | 'folder' | 'branch' | 'pull_request' | 'validation' | 'test' | 'conditional_file';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  rlhf_score: number | null;
  execution_log: string;
  path?: string;
  template?: string;
  action?: {
    create_folders?: {
      basePath?: string;
      folders?: string[];
    };
    branch_name?: string;
    target_branch?: string;
    source_branch?: string;
    title?: string;
  };
  validation_script?: string;
}

interface ImplementationPlan {
  steps?: Step[];
  domain_steps?: Step[];
  data_steps?: Step[];
  infra_steps?: Step[];
  presentation_steps?: Step[];
  main_steps?: Step[];
  metadata?: {
    layer?: string;
    project_type?: string;
    architecture_style?: string;
  };
  [key: string]: any;
}

class EnhancedStepExecutor {
  private plan: ImplementationPlan;
  private logger: Logger;
  private rlhf: EnhancedRLHFSystem;
  private validator: EnhancedTemplateValidator;
  private startTime: number = 0;
  private layerInfo: LayerInfo | null = null;
  private validationResult: ValidationResult | null = null;
  private executionCache: Map<string, any> = new Map();
  private commitConfig: CommitConfig;
  private commitHashes: string[] = [];

  constructor(private implementationPath: string) {
    this.plan = { steps: [] };

    // Use the utility function to resolve log directory
    const logDir = resolveLogDirectory(implementationPath);
    this.logger = new Logger(logDir);
    this.rlhf = new EnhancedRLHFSystem(implementationPath);
    this.validator = new EnhancedTemplateValidator();
    this.commitConfig = this.loadCommitConfig();

    // Detect layer from filename
    this.layerInfo = this.detectLayerInfo(implementationPath);

    // Setup cleanup handlers
    this.setupCleanupHandlers();
  }

  /**
   * Setup signal handlers for graceful cleanup on interrupt
   */
  private setupCleanupHandlers(): void {
    const cleanup = async () => {
      console.log(chalk.yellow('\n\n⚠️  Execution interrupted. Cleaning up...'));

      try {
        // Reset any staged changes
        await $`git reset HEAD`.catch(() => {});
        console.log(chalk.green('   ✅ Staged changes reset'));
      } catch (error) {
        // Ignore cleanup errors
      }

      this.logger.close();
      process.exit(130); // Standard exit code for SIGINT
    };

    // Handle Ctrl+C
    process.on('SIGINT', cleanup);
    // Handle kill signals
    process.on('SIGTERM', cleanup);
  }

  /**
   * Detect package manager being used in the project
   */
  private detectPackageManager(): 'npm' | 'yarn' | 'pnpm' {
    // Check for lock files
    if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
    if (fs.existsSync('yarn.lock')) return 'yarn';
    return 'npm'; // Default to npm
  }

  /**
   * Get the package manager command for running scripts
   */
  private getPackageManagerCommand(script: string): string {
    const pm = this.detectPackageManager();

    switch (pm) {
      case 'pnpm':
        return `pnpm ${script}`;
      case 'yarn':
        return `yarn ${script}`;
      case 'npm':
        return `npm run ${script}`;
      default:
        return `npm run ${script}`;
    }
  }

  /**
   * Check for uncommitted changes before starting execution
   */
  private async checkGitSafety(): Promise<boolean> {
    try {
      // Check if we're in a git repository
      await $`git rev-parse --git-dir`;

      // Check for uncommitted changes
      const statusResult = await $`git status --porcelain`;
      const hasUncommittedChanges = statusResult.stdout.trim().length > 0;

      if (hasUncommittedChanges) {
        console.log(chalk.yellow('⚠️  Warning: You have uncommitted changes in your working directory.'));
        console.log(chalk.yellow('   The execute command will create commits. Please commit or stash your changes first.'));
        console.log(chalk.gray('   Run: git status to see your changes'));

        // Check if interactive safety is enabled (default: true)
        const interactiveSafety = this.config.commit?.interactive_safety !== false;

        if (interactiveSafety) {
          const { confirmAction } = await import('./utils/prompt-utils.js');
          const shouldContinue = await confirmAction(
            'Do you want to continue anyway? This may result in mixed commits.',
            false
          );

          if (!shouldContinue) {
            console.log(chalk.yellow('⏸️  Execution aborted by user. Please commit or stash your changes first.'));
            return false;
          }
        } else {
          // Non-interactive mode: give user 5 seconds to abort
          console.log(chalk.yellow('\n   Continuing in 5 seconds... (Press Ctrl+C to abort)'));
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      return true;
    } catch (error) {
      console.log(chalk.red('❌ Not in a git repository or git is not available'));
      return false;
    }
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Config must be an object');
      return { valid: false, errors };
    }

    if (!config.commit) {
      errors.push('Missing required field: commit');
      return { valid: false, errors };
    }

    // Validate boolean fields
    if (config.commit.enabled !== undefined && typeof config.commit.enabled !== 'boolean') {
      errors.push('commit.enabled must be a boolean');
    }

    // Validate quality_checks
    if (config.commit.quality_checks) {
      if (config.commit.quality_checks.lint !== undefined && typeof config.commit.quality_checks.lint !== 'boolean') {
        errors.push('commit.quality_checks.lint must be a boolean');
      }
      if (config.commit.quality_checks.test !== undefined && typeof config.commit.quality_checks.test !== 'boolean') {
        errors.push('commit.quality_checks.test must be a boolean');
      }
    }

    // Validate conventional_commits
    if (config.commit.conventional_commits) {
      if (config.commit.conventional_commits.enabled !== undefined && typeof config.commit.conventional_commits.enabled !== 'boolean') {
        errors.push('commit.conventional_commits.enabled must be a boolean');
      }

      if (config.commit.conventional_commits.type_mapping) {
        const mapping = config.commit.conventional_commits.type_mapping;
        const validTypes = ['feat', 'fix', 'chore', 'refactor', 'test', 'docs', null];

        for (const [key, value] of Object.entries(mapping)) {
          if (!validTypes.includes(value as any)) {
            errors.push(`Invalid commit type '${value}' for step type '${key}'`);
          }
        }
      }
    }

    // Validate co_author
    if (config.commit.co_author !== undefined && typeof config.commit.co_author !== 'string') {
      errors.push('commit.co_author must be a string');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Load commit configuration from file or use defaults
   */
  private loadCommitConfig(): CommitConfig {
    const configPath = '.regent/config/execute.yml';

    try {
      // Check if config file exists
      if (!fs.existsSync(configPath)) {
        console.log(chalk.gray('   ℹ️  No execute config found, using defaults'));
        return { ...DEFAULT_COMMIT_CONFIG };
      }

      // Load and parse YAML config
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      const loadedConfig = yaml.parse(fileContent);

      // Validate configuration
      const validation = this.validateConfig(loadedConfig);
      if (!validation.valid) {
        console.log(chalk.yellow('   ⚠️  Configuration validation errors:'));
        validation.errors.forEach(err => console.log(chalk.yellow(`      • ${err}`)));
        console.log(chalk.yellow('   Using default configuration'));
        return { ...DEFAULT_COMMIT_CONFIG };
      }

      if (!loadedConfig || !loadedConfig.commit) {
        console.log(chalk.yellow('   ⚠️  Invalid config format, using defaults'));
        return { ...DEFAULT_COMMIT_CONFIG };
      }

      // Merge with defaults to ensure all properties exist
      const mergedConfig: CommitConfig = {
        enabled: loadedConfig.commit.enabled ?? DEFAULT_COMMIT_CONFIG.enabled,
        qualityChecks: {
          lint: loadedConfig.commit.quality_checks?.lint ?? DEFAULT_COMMIT_CONFIG.qualityChecks.lint,
          test: loadedConfig.commit.quality_checks?.test ?? DEFAULT_COMMIT_CONFIG.qualityChecks.test,
        },
        conventionalCommits: {
          enabled: loadedConfig.commit.conventional_commits?.enabled ?? DEFAULT_COMMIT_CONFIG.conventionalCommits.enabled,
          typeMapping: {
            ...DEFAULT_COMMIT_CONFIG.conventionalCommits.typeMapping,
            ...(loadedConfig.commit.conventional_commits?.type_mapping || {}),
          },
        },
        coAuthor: loadedConfig.commit.co_author ?? DEFAULT_COMMIT_CONFIG.coAuthor,
      };

      console.log(chalk.cyan('   ✅ Loaded commit configuration from .regent/config/execute.yml'));
      return mergedConfig;
    } catch (error: any) {
      console.log(chalk.yellow(`   ⚠️  Failed to load config: ${error.message}, using defaults`));
      return { ...DEFAULT_COMMIT_CONFIG };
    }
  }

  /**
   * Detect target and layer from template filename
   */
  private detectLayerInfo(templatePath: string): LayerInfo | null {
    const fileName = path.basename(templatePath, '.regent');
    const match = fileName.match(/^(backend|frontend|fullstack)-(domain|data|infra|presentation|main)-template$/);

    if (match) {
      const [, target, layer] = match;
      return {
        target: target as any,
        layer: layer as any
      };
    }

    // Try to detect from plan metadata if filename doesn't match
    return null;
  }

  /**
   * Pre-validate template before execution
   */
  private async preValidate(): Promise<boolean> {
    console.log(chalk.blue.bold('🔍 Pre-validating template with schema...'));

    try {
      this.validationResult = await this.validator.validateTemplate(this.implementationPath);

      if (!this.validationResult.valid) {
        console.error(chalk.red.bold('❌ Template validation failed!'));
        console.error(chalk.red('Errors found:'));
        this.validationResult.errors.forEach(error => {
          console.error(chalk.red(`   • ${error}`));
        });

        if (this.validationResult.warnings.length > 0) {
          console.warn(chalk.yellow('\nWarnings:'));
          this.validationResult.warnings.forEach(warning => {
            console.warn(chalk.yellow(`   • ${warning}`));
          });
        }

        // Ask user if they want to continue despite validation errors
        console.log(chalk.yellow('\n⚠️  Template has validation errors.'));
        console.log(chalk.yellow('Do you want to continue anyway? (not recommended)'));
        console.log(chalk.gray('Press Ctrl+C to abort, or wait 5 seconds to continue...'));

        await new Promise(resolve => setTimeout(resolve, 5000));
        return true; // Continue with warnings
      }

      console.log(chalk.green('✅ Template validation passed!'));

      if (this.validationResult.warnings.length > 0) {
        console.warn(chalk.yellow('\n⚠️  Warnings:'));
        this.validationResult.warnings.forEach(warning => {
          console.warn(chalk.yellow(`   • ${warning}`));
        });
      }

      // Update layer info from validation result if available
      if (this.validationResult.targetValidated && this.validationResult.layerValidated) {
        this.layerInfo = {
          target: this.validationResult.targetValidated as any,
          layer: this.validationResult.layerValidated as any
        };

        console.log(chalk.cyan(`📊 Detected: ${this.layerInfo.target} / ${this.layerInfo.layer} layer`));
      }

      return true;
    } catch (error: any) {
      console.error(chalk.red(`❌ Validation error: ${error.message}`));
      return false;
    }
  }

  private async loadPlan(): Promise<void> {
    console.log(chalk.magenta.bold(`🚀 Loading implementation file: ${this.implementationPath}`));
    try {
      const fileContent = await fs.readFile(this.implementationPath, 'utf-8');
      this.plan = yaml.parse(fileContent);

      // Update layer info from metadata if available
      if (!this.layerInfo && this.plan.metadata) {
        const metadata = this.plan.metadata;
        if (metadata.layer && metadata.project_type) {
          this.layerInfo = {
            target: metadata.project_type as any,
            layer: metadata.layer as any
          };
        }
      }

    } catch (error: any) {
      console.error(chalk.red.bold(`❌ Error: Could not read or parse the YAML file.`));
      console.error(chalk.red(`   Reason: ${error.message}`));
      process.exit(1);
    }
  }

  private async savePlan(): Promise<void> {
    const yamlString = yaml.stringify(this.plan);
    await fs.writeFile(this.implementationPath, yamlString, 'utf-8');
  }

  /**
   * Get steps based on layer detection
   */
  private getSteps(): Step[] {
    // Try layer-specific steps first
    if (this.layerInfo) {
      const layerStepsKey = `${this.layerInfo.layer}_steps`;
      if (this.plan[layerStepsKey] && Array.isArray(this.plan[layerStepsKey])) {
        console.log(chalk.cyan(`📋 Using layer-specific steps: ${layerStepsKey}`));
        return this.plan[layerStepsKey] as Step[];
      }
    }

    // Fallback to generic steps
    return this.plan.steps || [];
  }

  public async run(): Promise<void> {
    await this.loadPlan();

    // Check git safety before starting
    const gitSafe = await this.checkGitSafety();
    if (!gitSafe) {
      console.error(chalk.red('❌ Git safety check failed. Aborting execution.'));
      process.exit(1);
    }

    // Pre-validate template
    const validationPassed = await this.preValidate();
    if (!validationPassed) {
      console.log(chalk.yellow('⚠️  Continuing despite validation issues...'));
    }

    const steps = this.getSteps();

    if (!steps || !Array.isArray(steps)) {
      console.warn(chalk.yellow("Warning: No steps found. Nothing to execute."));
      return;
    }

    // Display execution context
    if (this.layerInfo) {
      console.log(chalk.cyan.bold(`\n🏗️  Executing ${this.layerInfo.target} / ${this.layerInfo.layer} layer`));
      console.log(chalk.cyan(`📦 Total steps: ${steps.length}`));
    } else {
      console.log(chalk.magenta.bold(`\n🚀 Starting execution of ${steps.length} steps...`));
    }

    for (const [index, step] of steps.entries()) {
      const stepId = step.id || `Unnamed Step ${index + 1}`;
      console.log(chalk.blue.bold(`\n▶️  Processing Step ${index + 1}/${steps.length}: ${stepId}`));

      // Skip completed steps
      if (step.status === 'SUCCESS' || step.status === 'SKIPPED') {
        console.log(chalk.gray(`   ⏭️  Skipping step with status '${step.status}'.`));
        continue;
      }

      try {
        // Track execution time
        this.startTime = Date.now();

        // Apply layer-specific validations before executing
        this.validateStepForLayer(step);

        // Execute the main step action
        await this.executeStepAction(step);

        // Execute validation script if present
        if (step.validation_script) {
          const scriptOutput = await this.runValidationScript(step.validation_script, step.id);

          const duration = Date.now() - this.startTime;

          // Calculate RLHF score with layer awareness
          step.rlhf_score = await this.calculateLayerAwareScore(step, true, scriptOutput);

          step.status = 'SUCCESS';
          step.execution_log = `Completed successfully at ${new Date().toISOString()} (${duration}ms).\nRLHF Score: ${step.rlhf_score}\n\n--- SCRIPT OUTPUT ---\n${scriptOutput}`;
          await this.savePlan();
        } else {
          const duration = Date.now() - this.startTime;
          step.rlhf_score = await this.calculateLayerAwareScore(step, true, undefined);
          step.status = 'SUCCESS';
          step.execution_log = `Action completed successfully at ${new Date().toISOString()} (${duration}ms). RLHF Score: ${step.rlhf_score}. No validation script provided.`;
          await this.savePlan();
        }

        // Run quality checks before committing
        const qualityCheckResult = await this.runQualityChecks();

        if (!qualityCheckResult.overallPassed) {
          // Quality checks failed - rollback changes
          await this.rollbackStep(step);

          // Update status
          step.status = 'FAILED';
          step.rlhf_score = -1; // Runtime error
          step.execution_log += `\n\n--- QUALITY CHECKS FAILED ---\nLint: ${qualityCheckResult.lint.passed ? 'PASSED' : 'FAILED'}\nTest: ${qualityCheckResult.test.passed ? 'PASSED' : 'FAILED'}`;
          await this.savePlan();

          throw new Error(
            `Quality checks failed. Changes have been rolled back.\n` +
            `Lint: ${qualityCheckResult.lint.passed ? '✅' : '❌'}\n` +
            `Test: ${qualityCheckResult.test.passed ? '✅' : '❌'}`
          );
        }

        // Commit the step if quality checks passed
        await this.commitStep(step, stepId);

        // Visual feedback with layer context
        const scoreEmoji = this.getScoreEmoji(step.rlhf_score || 0);
        const scoreColor = this.getScoreColor(step.rlhf_score || 0);
        console.log(scoreColor(`${scoreEmoji} Step '${stepId}' completed successfully. RLHF Score: ${step.rlhf_score}`));

      } catch (error: any) {
        const duration = Date.now() - this.startTime;

        step.status = 'FAILED';
        const errorMessage = this.enhanceErrorMessageWithLayerContext(error, step);

        // Calculate RLHF score with layer-specific penalties
        step.rlhf_score = await this.calculateLayerAwareScore(step, false, errorMessage);

        step.execution_log = `Failed at ${new Date().toISOString()} (${duration}ms).\nRLHF Score: ${step.rlhf_score}\n\n--- ERROR LOG ---\n${errorMessage}`;
        await this.savePlan();

        const scoreEmoji = this.getScoreEmoji(step.rlhf_score || 0);
        const scoreColor = this.getScoreColor(step.rlhf_score || 0);

        console.error(scoreColor(`\n${scoreEmoji} ERROR: Step '${stepId}' failed. RLHF Score: ${step.rlhf_score}`));
        console.error(chalk.red(errorMessage));

        // Layer-specific guidance
        this.provideLayerSpecificGuidance(step);

        console.error(chalk.red.bold('Aborting execution. The YAML file has been updated with the failure details.'));

        // Trigger RLHF analysis with layer context
        await this.rlhf.analyzeExecution(this.implementationPath, this.layerInfo || undefined);

        process.exit(1);
      }
    }

    console.log(chalk.green.bold('\n🎉 All steps completed successfully!'));

    // Display commit summary
    if (this.commitHashes.length > 0) {
      console.log(chalk.cyan.bold(`\n💾 Commits created: ${this.commitHashes.length}`));
      this.commitHashes.forEach((hash, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${hash}`));
      });
    }

    // Display layer-specific summary
    if (this.layerInfo) {
      console.log(chalk.cyan(`\n📊 ${this.layerInfo.target} / ${this.layerInfo.layer} layer execution complete!`));
    }

    // Perform final RLHF analysis with layer context
    console.log(chalk.blue.bold('\n🤖 Running layer-aware RLHF analysis...'));
    await this.rlhf.analyzeExecution(this.implementationPath, this.layerInfo || undefined);

    // Calculate final score with layer awareness
    const finalScore = await this.calculateFinalLayerAwareScore();
    this.plan.evaluation = this.plan.evaluation || {};
    this.plan.evaluation.final_rlhf_score = finalScore;
    this.plan.evaluation.final_status = 'SUCCESS';
    this.plan.evaluation.commit_hashes = this.commitHashes;
    await this.savePlan();

    console.log(chalk.cyan.bold(`\n📊 Final RLHF Score: ${finalScore}/2`));
    console.log(chalk.cyan('Run `npx tsx rlhf-system.ts report` to see learning insights'));

    this.logger.close();
  }

  /**
   * Validate step based on architectural layer rules
   */
  private validateStepForLayer(step: Step): void {
    if (!this.layerInfo || step.type !== 'create_file') return;

    const template = step.template || '';

    switch (this.layerInfo.layer) {
      case 'domain':
        // Domain layer: No external dependencies
        if (template.match(/import\s+(?:axios|fetch|prisma|redis|mongodb)/)) {
          throw new Error(`Domain layer violation: External dependencies not allowed in step '${step.id}'`);
        }
        break;

      case 'data':
        // Data layer: Should implement domain interfaces
        if (!template.includes('implements') && !template.includes('extends')) {
          console.warn(chalk.yellow(`⚠️  Data layer warning: Step '${step.id}' should implement domain interfaces`));
        }
        break;

      case 'infra':
        // Infrastructure: Should have error handling
        if (!template.includes('try') || !template.includes('catch')) {
          console.warn(chalk.yellow(`⚠️  Infrastructure warning: Step '${step.id}' should include error handling`));
        }
        break;

      case 'presentation':
        // Presentation: No business logic
        if (template.match(/business\s+logic|domain\s+rules|calculations/i)) {
          throw new Error(`Presentation layer violation: Business logic not allowed in step '${step.id}'`);
        }
        break;

      case 'main':
        // Main layer: Should use factories
        if (!template.match(/factory|Factory|make[A-Z]/)) {
          console.warn(chalk.yellow(`⚠️  Main layer warning: Step '${step.id}' should use factory pattern`));
        }
        break;
    }
  }

  /**
   * Calculate RLHF score with layer-specific adjustments
   * Now uses centralized scoring from EnhancedRLHFSystem
   */
  private async calculateLayerAwareScore(
    step: Step,
    success: boolean,
    output?: string
  ): Promise<number> {
    // Use the centralized layer-aware scoring from EnhancedRLHFSystem
    // This eliminates duplication and ensures consistency
    const score = await this.rlhf.calculateLayerScore(
      step.type,
      success,
      this.layerInfo || undefined,
      output,
      step
    );

    return score;
  }

  /**
   * Calculate final score with layer awareness
   */
  private async calculateFinalLayerAwareScore(): Promise<number> {
    const steps = this.getSteps();
    let totalScore = 0;
    let validScores = 0;

    for (const step of steps) {
      if (step.rlhf_score !== null && step.rlhf_score !== undefined) {
        totalScore += step.rlhf_score;
        validScores++;
      }
    }

    if (validScores === 0) return 1;

    const avgScore = totalScore / validScores;

    // Adjust based on layer expectations
    if (this.layerInfo) {
      // Domain and Main layers are more critical
      if (this.layerInfo.layer === 'domain' || this.layerInfo.layer === 'main') {
        // Be stricter with critical layers
        return Math.max(0, Math.min(2, avgScore + 0.5));
      }
    }

    return Math.max(0, Math.min(2, avgScore + 1));
  }

  /**
   * Enhanced error message with layer context
   */
  private enhanceErrorMessageWithLayerContext(error: any, step: Step): string {
    const baseError = error.stderr || error.stdout || error.message || 'Unknown error';

    if (!this.layerInfo) {
      return this.enhanceErrorMessage(error, step);
    }

    let contextMessage = `\nLayer Context: ${this.layerInfo.target} / ${this.layerInfo.layer}\n`;

    // Add layer-specific context
    switch (this.layerInfo.layer) {
      case 'domain':
        if (baseError.includes('import')) {
          contextMessage += 'DOMAIN LAYER VIOLATION: External dependencies are not allowed in the domain layer.\n';
          contextMessage += 'The domain layer must be pure business logic with no external dependencies.\n';
        }
        break;

      case 'data':
        if (baseError.includes('implements')) {
          contextMessage += 'DATA LAYER ISSUE: Data layer should implement domain interfaces.\n';
          contextMessage += 'Ensure your use case implementations follow the domain contracts.\n';
        }
        break;

      case 'infra':
        if (!baseError.includes('try') && !baseError.includes('catch')) {
          contextMessage += 'INFRASTRUCTURE ISSUE: Missing error handling.\n';
          contextMessage += 'Infrastructure adapters must handle errors gracefully.\n';
        }
        break;

      case 'presentation':
        if (baseError.includes('business') || baseError.includes('logic')) {
          contextMessage += 'PRESENTATION VIOLATION: Business logic detected in presentation layer.\n';
          contextMessage += 'Move business logic to domain use cases.\n';
        }
        break;

      case 'main':
        if (!baseError.includes('factory')) {
          contextMessage += 'MAIN LAYER ISSUE: Missing factory pattern.\n';
          contextMessage += 'Use factories for dependency injection in the composition root.\n';
        }
        break;
    }

    return contextMessage + '\nOriginal error: ' + baseError;
  }

  /**
   * Provide layer-specific guidance on errors
   */
  private provideLayerSpecificGuidance(step: Step): void {
    if (!this.layerInfo) return;

    console.error(chalk.yellow.bold(`\n💡 ${this.layerInfo.layer.toUpperCase()} Layer Guidance:`));

    switch (this.layerInfo.layer) {
      case 'domain':
        console.error(chalk.yellow('• Domain layer must have no external dependencies'));
        console.error(chalk.yellow('• Use only pure TypeScript/JavaScript'));
        console.error(chalk.yellow('• Define interfaces and types only'));
        console.error(chalk.yellow('• No implementation details'));
        break;

      case 'data':
        console.error(chalk.yellow('• Implement domain interfaces'));
        console.error(chalk.yellow('• Transform external data to domain models'));
        console.error(chalk.yellow('• Use repository protocols'));
        console.error(chalk.yellow('• No direct database access'));
        break;

      case 'infra':
        console.error(chalk.yellow('• Implement data layer protocols'));
        console.error(chalk.yellow('• Handle external services (DB, APIs, Cache)'));
        console.error(chalk.yellow('• Include proper error handling'));
        console.error(chalk.yellow('• Use adapter pattern'));
        break;

      case 'presentation':
        console.error(chalk.yellow('• Keep controllers/components thin'));
        console.error(chalk.yellow('• Delegate to use cases'));
        console.error(chalk.yellow('• Handle only UI concerns'));
        console.error(chalk.yellow('• No business logic'));
        break;

      case 'main':
        console.error(chalk.yellow('• Use factory pattern'));
        console.error(chalk.yellow('• Wire up dependencies'));
        console.error(chalk.yellow('• Configure application'));
        console.error(chalk.yellow('• No business logic'));
        break;
    }
  }

  // Keep existing methods from original execute-steps.ts
  private async executeStepAction(step: Step): Promise<void> {
    switch (step.type) {
      case 'create_file':
        await this.handleCreateFileStep(step);
        break;
      case 'refactor_file':
        await this.handleRefactorFileStep(step);
        break;
      case 'delete_file':
        await this.handleDeleteFileStep(step);
        break;
      case 'folder':
        await this.handleFolderStep(step);
        break;
      case 'branch':
        await this.handleBranchStep(step);
        break;
      case 'pull_request':
        await this.handlePullRequestStep(step);
        break;
      default:
        throw new Error(`Unknown step type: '${(step as any).type}'`);
    }
  }

  // Include all the handle* methods from original execute-steps.ts
  private async handleDeleteFileStep(step: Step): Promise<void> {
    const { path } = step;
    if (!path) throw new Error("Delete file step is missing 'path'.");

    console.log(chalk.red(`   🗑️ Deleting file: ${path}`));

    if (await fs.pathExists(path)) {
      await fs.remove(path);
      console.log(chalk.green(`   ✅ File successfully deleted.`));
    } else {
      console.warn(chalk.yellow(`   ⚠️  Warning: File to delete at ${path} does not exist. Skipping.`));
    }
  }

  private async handleCreateFileStep(step: Step): Promise<void> {
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

    const replaceMatch = template.match(/<<<REPLACE>>>(.*?)<<<\/REPLACE>>>/s);
    const withMatch = template.match(/<<<WITH>>>(.*?)<<<\/WITH>>>/s);

    if (!replaceMatch || !withMatch) {
      throw new Error(`Invalid refactor template for step ${step.id}. Missing <<<REPLACE>>> or <<<WITH>>> blocks.`);
    }

    const oldCode = replaceMatch[1].trim();
    const newCode = withMatch[1].trim();

    if (!await fs.pathExists(path)) {
      throw new Error(`File to refactor does not exist at path: ${path}`);
    }
    const fileContent = await fs.readFile(path, 'utf-8');

    const newFileContent = fileContent.replace(oldCode, newCode);

    if (newFileContent === fileContent) {
      throw new Error(`Could not find the OLD code block in ${path}. Refactoring failed.`);
    }

    await fs.writeFile(path, newFileContent);
    console.log(chalk.green(`   ✅ Successfully applied refactoring to ${path}`));
  }

  private async handleBranchStep(step: Step): Promise<void> {
    const branchName = step.action?.branch_name;
    if (!branchName) {
      throw new Error("Branch step is missing 'action.branch_name'.");
    }

    console.log(chalk.cyan(`   🌿 Managing branch: ${branchName}`));
    console.log(chalk.blue(`   📝 Branch configuration validated. Will be created/checked out by validation script.`));
  }

  private async handlePullRequestStep(step: Step): Promise<void> {
    const { target_branch, source_branch, title } = step.action || {};

    if (!target_branch || !source_branch) {
      throw new Error("Pull request step is missing required 'action.target_branch' or 'action.source_branch'.");
    }

    console.log(chalk.cyan(`   🔄 Preparing pull request from ${source_branch} to ${target_branch}`));

    if (title) {
      console.log(chalk.blue(`   📋 PR Title: ${title}`));
    }

    console.log(chalk.blue(`   📝 PR configuration validated. Will be created by validation script.`));
  }

  private getScoreEmoji(score: number): string {
    if (score >= 2) return '🏆'; // Perfect execution
    if (score >= 1) return '✅'; // Good execution
    if (score >= 0) return '⚠️'; // Low confidence
    if (score >= -1) return '❌'; // Runtime error
    return '💥'; // Catastrophic error
  }

  private getScoreColor(score: number): any {
    if (score >= 2) return chalk.green.bold;
    if (score >= 1) return chalk.green;
    if (score >= 0) return chalk.yellow;
    if (score >= -1) return chalk.red;
    return chalk.red.bold;
  }

  private enhanceErrorMessage(error: any, step: Step): string {
    const baseError = error.stderr || error.stdout || error.message || 'Unknown error';

    if (step.type === 'refactor_file' && step.template) {
      if (!step.template.includes('<<<REPLACE>>>') || !step.template.includes('<<<WITH>>>')) {
        return `TEMPLATE FORMAT ERROR: Missing <<<REPLACE>>> or <<<WITH>>> blocks in refactor template.\n\nOriginal error: ${baseError}`;
      }
    }

    if (baseError.toLowerCase().includes('import') && step.type === 'create_file') {
      return `POTENTIAL ARCHITECTURE VIOLATION: Import statement issue in domain layer.\n\nOriginal error: ${baseError}`;
    }

    return baseError;
  }

  /**
   * Parse and extract specific errors from lint/test output
   */
  private parseQualityCheckErrors(output: string, type: 'lint' | 'test'): string[] {
    const errors: string[] = [];
    const lines = output.split('\n');

    if (type === 'lint') {
      // Parse ESLint/TSLint errors
      for (const line of lines) {
        // Match pattern: file:line:col error message
        if (line.match(/^\s*\d+:\d+\s+(error|warning)/)) {
          errors.push(line.trim());
        }
        // Match pattern: /path/file.ts
        if (line.match(/^\/.*\.(ts|js|tsx|jsx)$/)) {
          errors.push(line.trim());
        }
      }
    } else if (type === 'test') {
      // Parse test failures
      let inFailure = false;
      for (const line of lines) {
        // Vitest/Jest failure patterns
        if (line.match(/FAIL|✕|×|failed/i)) {
          inFailure = true;
          errors.push(line.trim());
        } else if (inFailure && line.trim()) {
          errors.push(line.trim());
          if (errors.length >= 10) break; // Limit to 10 lines
        } else if (line.match(/Tests:.*failed/i)) {
          errors.push(line.trim());
        }
      }
    }

    return errors.slice(0, 10); // Limit to 10 most relevant errors
  }

  /**
   * Run quality checks (lint and test) based on configuration
   * Runs checks in parallel for better performance
   * Includes error boundary to prevent execution crashes
   */
  private async runQualityChecks(): Promise<QualityCheckResult> {
    try {
      const checks: Promise<{ type: 'lint' | 'test'; passed: boolean; output: string }>[] = [];

      // Detect package manager for commands
      const pm = this.detectPackageManager();
      console.log(chalk.gray(`   ℹ️  Using package manager: ${pm}`));

    // Run lint if enabled
    if (this.commitConfig.qualityChecks.lint) {
      console.log(chalk.blue('   🔍 Running lint check...'));
      checks.push(
        (async () => {
          try {
            $.verbose = false;
            const lintCommand = this.getPackageManagerCommand('lint');
            const lintResult = await $`sh -c ${lintCommand}`;
            $.verbose = true;
            console.log(chalk.green('   ✅ Lint check passed'));
            return { type: 'lint' as const, passed: true, output: lintResult.stdout + lintResult.stderr };
          } catch (error: any) {
            $.verbose = true;
            const output = error.stdout + error.stderr;
            console.log(chalk.red('   ❌ Lint check failed'));

            // Parse and display specific errors
            const errors = this.parseQualityCheckErrors(output, 'lint');
            if (errors.length > 0) {
              console.log(chalk.red('   📋 Lint errors:'));
              errors.forEach(err => console.log(chalk.red(`      ${err}`)));
            }

            return { type: 'lint' as const, passed: false, output };
          }
        })()
      );
    }

    // Run tests if enabled
    if (this.commitConfig.qualityChecks.test) {
      console.log(chalk.blue('   🧪 Running tests...'));
      checks.push(
        (async () => {
          try {
            $.verbose = false;
            const testCommand = this.getPackageManagerCommand('test --run');
            const testResult = await $`sh -c ${testCommand}`;
            $.verbose = true;
            console.log(chalk.green('   ✅ Tests passed'));
            return { type: 'test' as const, passed: true, output: testResult.stdout + testResult.stderr };
          } catch (error: any) {
            $.verbose = true;
            const output = error.stdout + error.stderr;
            console.log(chalk.red('   ❌ Tests failed'));

            // Parse and display specific failures
            const errors = this.parseQualityCheckErrors(output, 'test');
            if (errors.length > 0) {
              console.log(chalk.red('   📋 Test failures:'));
              errors.forEach(err => console.log(chalk.red(`      ${err}`)));
            }

            return { type: 'test' as const, passed: false, output };
          }
        })()
      );
    }

    // Wait for all checks to complete
    const results = await Promise.allSettled(checks);

    // Process results
    let lintPassed = true;
    let lintOutput = '';
    let testPassed = true;
    let testOutput = '';

      for (const result of results) {
        if (result.status === 'fulfilled') {
          if (result.value.type === 'lint') {
            lintPassed = result.value.passed;
            lintOutput = result.value.output;
          } else if (result.value.type === 'test') {
            testPassed = result.value.passed;
            testOutput = result.value.output;
          }
        }
      }

      return createQualityCheckResult(lintPassed, testPassed, lintOutput, testOutput);
    } catch (error: any) {
      // Error boundary: If quality checks crash, treat as failed
      console.log(chalk.red(`   ❌ Quality checks crashed: ${error.message}`));
      console.log(chalk.yellow('   ℹ️  Treating as failed quality check'));

      return createQualityCheckResult(
        false,
        false,
        `Quality check system error: ${error.message}`,
        `Quality check system error: ${error.message}`
      );
    }
  }

  /**
   * Commit the step changes if applicable
   */
  private async commitStep(step: Step, stepId: string): Promise<void> {
    // Check if this step type should be committed
    if (!shouldCommitStep(step.type, this.commitConfig)) {
      console.log(chalk.gray(`   ⏭️  Step type '${step.type}' does not require commit`));
      return;
    }

    // Generate commit message
    const commitMessage = generateCommitMessage(
      step.type,
      step.id || stepId,
      step.path,
      this.commitConfig
    );

    if (!commitMessage) {
      console.log(chalk.gray(`   ⏭️  No commit message generated for step`));
      return;
    }

    try {
      // Add files to git - be specific about what to stage
      console.log(chalk.blue('   📝 Staging changes...'));
      if (step.path && fs.existsSync(step.path)) {
        // Stage the specific file from the step
        await $`git add ${step.path}`;
      } else {
        // For non-file steps (like folder), check git status and stage tracked files
        const statusResult = await $`git status --porcelain`;
        const changedFiles = statusResult.stdout
          .split('\n')
          .filter(line => line.trim())
          .map(line => line.substring(3).trim());

        if (changedFiles.length > 0) {
          // Stage only the changed files, not untracked files
          for (const file of changedFiles) {
            if (fs.existsSync(file)) {
              await $`git add ${file}`;
            }
          }
        }
      }

      // Commit with generated message
      console.log(chalk.blue('   💾 Creating commit...'));
      await $`git commit -m ${commitMessage}`;

      // Get the commit hash
      const hashResult = await $`git rev-parse --short HEAD`;
      const commitHash = hashResult.stdout.trim();
      this.commitHashes.push(commitHash);

      console.log(chalk.green(`   ✅ Committed: ${commitHash}`));
      console.log(chalk.gray(`   📋 ${commitMessage.split('\n')[0]}`));
    } catch (error: any) {
      // If commit fails, it might be because there are no changes or other git issues
      const errorMsg = error.stderr || error.message || 'Unknown git error';

      if (errorMsg.includes('nothing to commit')) {
        console.log(chalk.yellow('   ⚠️  No changes to commit'));
      } else {
        throw new Error(`Git commit failed: ${errorMsg}`);
      }
    }
  }

  /**
   * Rollback changes made by a failed step
   * Restores the working directory to the last commit
   */
  private async rollbackStep(step: Step): Promise<void> {
    console.log(chalk.yellow('   🔄 Rolling back changes...'));

    try {
      // If step has a specific path, check if it was newly created
      if (step.path) {
        const fileExists = fs.existsSync(step.path);

        if (fileExists) {
          // Check if this file existed in the last commit
          try {
            await $`git cat-file -e HEAD:${step.path}`;
            // File existed before - restore it from git
            await $`git checkout HEAD -- ${step.path}`;
            console.log(chalk.yellow(`   ↩️  Restored ${step.path} from last commit`));
          } catch {
            // File did not exist before - it's new, remove it
            await fs.remove(step.path);
            console.log(chalk.yellow(`   ↩️  Removed newly created ${step.path}`));
          }
        }
      }

      // Reset any staged changes
      await $`git reset HEAD`;

      // Restore working directory to last commit for all modified files
      await $`git checkout -- .`;

      console.log(chalk.green('   ✅ Rollback complete'));
    } catch (error: any) {
      console.log(chalk.red(`   ⚠️  Rollback failed: ${error.message}`));
      console.log(chalk.yellow('   ℹ️  Manual cleanup may be required'));
    }
  }

  private async runValidationScript(scriptContent: string, stepId: string): Promise<string> {
    this.logger.log(`--- Running validation script for '${stepId}' ---`);

    const tempScriptPath = path.join(os.tmpdir(), `step-${crypto.randomUUID()}.sh`);
    let fullOutput = '';

    try {
      const normalizedScript = scriptContent.replace(/\r\n/g, '\n');
      await fs.writeFile(tempScriptPath, normalizedScript);
      await fs.chmod(tempScriptPath, '755');

      $.verbose = false;
      const processPromise = $`bash ${tempScriptPath}`;

      processPromise.stdout.on('data', (chunk) => {
        const data = chunk.toString();
        this.logger.log(data.trim());
        fullOutput += data;
      });
      processPromise.stderr.on('data', (chunk) => {
        const data = chunk.toString();
        this.logger.error(data.trim());
        fullOutput += data;
      });

      await processPromise;

      $.verbose = true;
      this.logger.log(`--- Script finished successfully ---`);
      return fullOutput;

    } catch (error: any) {
      $.verbose = true;
      throw error;
    } finally {
      if (await fs.pathExists(tempScriptPath)) {
        await fs.remove(tempScriptPath);
      }
    }
  }
}

// Batch execution support
async function executeBatch(pattern: string): Promise<void> {
  console.log(chalk.cyan.bold(`\n🚀 Batch execution mode: ${pattern}`));

  let templates: string[] = [];

  if (pattern === '--all') {
    // Execute all templates
    templates = await fs.readdir('templates')
      .then(files => files.filter(f => f.match(/-template\.regent$/))
      .map(f => path.join('templates', f)));
  } else if (pattern.startsWith('--layer=')) {
    // Execute specific layer
    const layer = pattern.replace('--layer=', '');
    templates = await fs.readdir('templates')
      .then(files => files.filter(f => f.match(new RegExp(`-${layer}-template\\.regent$`)))
      .map(f => path.join('templates', f)));
  } else if (pattern.startsWith('--target=')) {
    // Execute specific target
    const target = pattern.replace('--target=', '');
    templates = await fs.readdir('templates')
      .then(files => files.filter(f => f.match(new RegExp(`^${target}-.*-template\\.regent$`)))
      .map(f => path.join('templates', f)));
  }

  if (templates.length === 0) {
    console.error(chalk.red(`No templates found matching pattern: ${pattern}`));
    return;
  }

  console.log(chalk.blue(`Found ${templates.length} templates to execute`));

  let succeeded = 0;
  let failed = 0;

  for (const template of templates) {
    console.log(chalk.blue.bold(`\n📄 Executing: ${path.basename(template)}`));
    console.log('─'.repeat(50));

    try {
      const executor = new EnhancedStepExecutor(template);
      await executor.run();
      succeeded++;
      console.log(chalk.green(`✅ Success: ${path.basename(template)}`));
    } catch (error: any) {
      failed++;
      console.error(chalk.red(`❌ Failed: ${path.basename(template)}`));
      console.error(chalk.red(`   Error: ${error.message}`));
    }
  }

  console.log(chalk.cyan.bold('\n📊 Batch Execution Summary:'));
  console.log(chalk.green(`   ✅ Succeeded: ${succeeded}`));
  console.log(chalk.red(`   ❌ Failed: ${failed}`));
  console.log(chalk.blue(`   📋 Total: ${templates.length}`));
}

async function main() {
  const args = argv._;

  if (args.length < 1) {
    console.error(chalk.red.bold('Usage: npx tsx execute-steps-enhanced.ts <path_to_implementation.yaml>'));
    console.error(chalk.gray('\nOptions:'));
    console.error(chalk.gray('  --all              Execute all templates'));
    console.error(chalk.gray('  --layer=<layer>    Execute templates for specific layer'));
    console.error(chalk.gray('  --target=<target>  Execute templates for specific target'));
    console.error(chalk.gray('\nExamples:'));
    console.error(chalk.gray('  npx tsx execute-steps-enhanced.ts templates/backend-domain-template.regent'));
    console.error(chalk.gray('  npx tsx execute-steps-enhanced.ts --all'));
    console.error(chalk.gray('  npx tsx execute-steps-enhanced.ts --layer=domain'));
    console.error(chalk.gray('  npx tsx execute-steps-enhanced.ts --target=backend'));
    process.exit(1);
  }

  const arg = argv._[0] as string;

  // Check for batch execution
  if (arg.startsWith('--')) {
    await executeBatch(arg);
  } else {
    // Single file execution
    const executor = new EnhancedStepExecutor(arg);
    await executor.run();
  }
}

main().catch(err => {
  console.error(chalk.red.bold('Execution failed:'), err);
  process.exit(1);
});

export { EnhancedStepExecutor, LayerInfo };