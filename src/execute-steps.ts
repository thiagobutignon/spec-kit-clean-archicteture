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
import Logger from './core/logger';
import { EnhancedRLHFSystem, LayerInfo } from './core/rlhf-system';
import { resolveLogDirectory } from './utils/log-path-resolver';
import { EnhancedTemplateValidator } from './validate-template';
import type { ValidationResult } from './validate-template';
import {
  generateCommitMessage,
  shouldCommitStep,
  type CommitConfig,
  DEFAULT_COMMIT_CONFIG,
  type QualityCheckResult,
  createQualityCheckResult,
} from './utils/commit-generator';
import { validateConfig } from './utils/config-validator';
import { EXIT_CODES, RATE_LIMITS } from './utils/constants';

$.verbose = true;
$.shell = '/bin/bash';

/**
 * Extract error message from various error types consistently
 * @param error - Error object from git, shell commands, or JS errors
 * @param fallback - Fallback message if extraction fails
 * @returns Formatted error message
 */
function extractErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (!error) return fallback;

  // For shell command errors (zx ProcessOutput), prioritize stderr
  if (error.stderr && typeof error.stderr === 'string' && error.stderr.trim()) {
    return error.stderr.trim();
  }

  // Fallback to stdout for commands that output errors to stdout
  if (error.stdout && typeof error.stdout === 'string' && error.stdout.trim()) {
    return error.stdout.trim();
  }

  // Standard Error object
  if (error.message) {
    return error.message;
  }

  // If error is a string
  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

/**
 * Extract combined output from shell command errors
 * @param error - Error object from shell command
 * @returns Combined stdout + stderr
 */
function extractCommandOutput(error: unknown): string {
  const stdout = error.stdout || '';
  const stderr = error.stderr || '';
  return (stdout + stderr).trim();
}

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
  evaluation?: {
    final_rlhf_score?: number;
    final_status?: string;
    commit_hashes?: string[];
  };
  [key: string]: unknown;
}

class EnhancedStepExecutor {
  private plan: ImplementationPlan;
  private logger: Logger;
  private rlhf: EnhancedRLHFSystem;
  private validator: EnhancedTemplateValidator;
  private startTime: number = 0;
  private layerInfo: LayerInfo | null = null;
  private validationResult: ValidationResult | null = null;
  private executionCache: Map<string, unknown> = new Map();
  private commitConfig: CommitConfig;
  private commitHashes: string[] = [];
  private cachedPackageManager: 'npm' | 'yarn' | 'pnpm' | null = null;
  private lastKnownCommitHash: string | null = null;
  private cleanupHandlers: Array<{ signal: NodeJS.Signals; handler: () => void }> = [];
  private gitOpTimestamps: number[] = [];
  private lastGitOpTime: number = 0;
  private rateLimitLock: Promise<void> = Promise.resolve();
  private auditLog: Array<{ timestamp: string; event: string; details: Record<string, unknown> }> = [];

  /**
   * Create a new EnhancedStepExecutor instance
   *
   * Initializes all subsystems required for executing implementation plans:
   * - Logger for detailed execution logs
   * - RLHF system for scoring and learning
   * - Template validator for pre-execution checks
   * - Commit configuration from .regent/config/execute.yml
   * - Signal handlers for graceful cleanup on interrupts
   *
   * @param {string} implementationPath - Path to the YAML implementation file
   *                                      (e.g., './spec/001-feature/domain/implementation.yaml')
   *
   * @example
   * ```typescript
   * const executor = new EnhancedStepExecutor('./spec/001-auth/domain/implementation.yaml');
   * await executor.run();
   * ```
   */
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
   * Stores handler references for cleanup to prevent memory leaks
   */
  private setupCleanupHandlers(): void {
    const cleanup = async () => {
      console.log(chalk.yellow('\n\n⚠️  Execution interrupted. Cleaning up...'));

      try {
        // Reset any staged changes
        await $`git reset HEAD`.catch(() => {});
        console.log(chalk.green('   ✅ Staged changes reset'));
      } catch {
        // Ignore cleanup errors
      }

      // Cleanup all resources using destructor pattern
      this.destroy();

      process.exit(EXIT_CODES.SIGINT);
    };

    // Handle Ctrl+C
    process.on('SIGINT', cleanup);
    this.cleanupHandlers.push({ signal: 'SIGINT', handler: cleanup });

    // Handle kill signals
    process.on('SIGTERM', cleanup);
    this.cleanupHandlers.push({ signal: 'SIGTERM', handler: cleanup });
  }

  /**
   * Remove signal handlers to prevent memory leaks
   */
  private removeCleanupHandlers(): void {
    for (const { signal, handler } of this.cleanupHandlers) {
      process.removeListener(signal, handler);
    }
    this.cleanupHandlers = [];
  }

  /**
   * Log security-relevant events for audit trail
   * @param event - Event type (e.g., 'script_validation', 'git_operation', 'rollback')
   * @param details - Event details object
   */
  private logAuditEvent(event: string, details: Record<string, unknown>): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
    };

    this.auditLog.push(auditEntry);

    // Log to console in verbose mode
    if (process.env.AUDIT_LOG === 'true') {
      console.log(chalk.gray(`   [AUDIT] ${event}: ${JSON.stringify(details)}`));
    }

    // Keep only last 100 entries to prevent memory bloat
    if (this.auditLog.length > 100) {
      this.auditLog = this.auditLog.slice(-100);
    }
  }

  /**
   * Rate limit git operations to prevent overwhelming the system
   * Uses token bucket algorithm with burst capacity
   * Thread-safe using promise-based lock to prevent race conditions
   * @returns Promise that resolves when operation can proceed
   */
  private async rateLimitGitOperation(): Promise<void> {
    // Wait for any in-progress rate limit check to complete (prevents race condition)
    await this.rateLimitLock;

    // Create new lock for this operation
    let releaseLock: () => void;
    this.rateLimitLock = new Promise(resolve => {
      releaseLock = resolve;
    });

    try {
      const now = Date.now();

      // Enforce minimum delay between operations
      const timeSinceLastOp = now - this.lastGitOpTime;
      if (timeSinceLastOp < RATE_LIMITS.MIN_GIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMITS.MIN_GIT_DELAY - timeSinceLastOp));
      }

      // Clean up timestamps older than 1 minute (safe now that we have lock)
      const oneMinuteAgo = Date.now() - 60000;
      this.gitOpTimestamps = this.gitOpTimestamps.filter(ts => ts > oneMinuteAgo);

      // Check if we've exceeded the rate limit
      if (this.gitOpTimestamps.length >= RATE_LIMITS.GIT_OPS_PER_MINUTE) {
        const oldestTimestamp = this.gitOpTimestamps[0];
        const waitTime = 60000 - (Date.now() - oldestTimestamp);

        if (waitTime > 0) {
          console.log(chalk.yellow(`   ⏱️  Rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`));
          await new Promise(resolve => setTimeout(resolve, waitTime));

          // Clean up again after waiting
          const updatedOneMinuteAgo = Date.now() - 60000;
          this.gitOpTimestamps = this.gitOpTimestamps.filter(ts => ts > updatedOneMinuteAgo);
        }
      }

      // Record this operation (safe with lock)
      this.gitOpTimestamps.push(Date.now());
      this.lastGitOpTime = Date.now();
    } finally {
      // Always release lock
      releaseLock!();
    }
  }

  /**
   * Verify if a package manager is installed
   * @param pm - Package manager to verify
   * @returns true if installed, false otherwise
   */
  private async isPackageManagerInstalled(pm: 'npm' | 'yarn' | 'pnpm'): Promise<boolean> {
    try {
      $.verbose = false;
      await $`which ${pm}`;
      $.verbose = true;
      return true;
    } catch {
      $.verbose = true;
      return false;
    }
  }

  /**
   * Detect package manager being used in the project
   * Verifies installation before returning and caches result
   */
  private async detectPackageManager(): Promise<'npm' | 'yarn' | 'pnpm'> {
    // Return cached result if available
    if (this.cachedPackageManager) {
      return this.cachedPackageManager;
    }

    // Check for lock files and verify installation
    if (fs.existsSync('pnpm-lock.yaml')) {
      if (await this.isPackageManagerInstalled('pnpm')) {
        this.cachedPackageManager = 'pnpm';
        return 'pnpm';
      }
      console.log(chalk.yellow('   ⚠️  pnpm-lock.yaml found but pnpm is not installed'));
    }

    if (fs.existsSync('yarn.lock')) {
      if (await this.isPackageManagerInstalled('yarn')) {
        this.cachedPackageManager = 'yarn';
        return 'yarn';
      }
      console.log(chalk.yellow('   ⚠️  yarn.lock found but yarn is not installed'));
    }

    // Default to npm (should always be available with Node.js)
    if (await this.isPackageManagerInstalled('npm')) {
      this.cachedPackageManager = 'npm';
      return 'npm';
    }

    // If npm is also not available, throw error
    throw new Error('No package manager found. Please install npm, yarn, or pnpm.');
  }

  /**
   * Check if a script name is safe to execute
   * Allows configured scripts or common safe scripts
   * @param script - Script name to validate
   * @returns true if script is safe
   */
  private isScriptSafe(script: string): boolean {
    // Allow exact matches from config
    const configuredScripts = [
      this.commitConfig.qualityChecks.lintCommand || 'lint',
      this.commitConfig.qualityChecks.testCommand || 'test --run',
    ];

    if (configuredScripts.includes(script)) {
      return true;
    }

    // Common safe patterns (only alphanumeric, hyphens, colons, and spaces)
    const safePattern = /^[a-zA-Z0-9:\-\s]+$/;
    if (!safePattern.test(script)) {
      return false;
    }

    // Block dangerous keywords
    const dangerousKeywords = [
      // File operations
      'rm', 'rmdir', 'del', 'delete',
      // Permission changes
      'chmod', 'chown', 'chgrp', 'sudo', 'su',
      // Network operations
      'curl', 'wget', 'nc', 'netcat', 'telnet', 'ssh', 'scp', 'ftp',
      // Process operations
      'kill', 'killall', 'pkill',
      // Dangerous commands
      'eval', 'exec', 'source',
      // Shell operators
      '&&', '||', ';', '|', '>', '<', '>>', '<<',
      // Variable expansion
      '`', '$', '${',
      // Path manipulation
      '../', '..',
    ];
    return !dangerousKeywords.some(keyword => script.includes(keyword));
  }

  /**
   * Validate script name for safety
   * @param script - Script name to validate
   * @throws {Error} If script is not safe to execute
   */
  private validateScript(script: string): void {
    if (!this.isScriptSafe(script)) {
      // Audit log: Security event - unsafe script blocked
      this.logAuditEvent('script_validation_failed', {
        script,
        reason: 'Contains dangerous keywords or invalid characters',
      });

      throw new Error(
        `Unsafe script detected: "${script}". ` +
        `Scripts must contain only alphanumeric characters, hyphens, colons, and spaces, ` +
        `and cannot contain dangerous keywords.`
      );
    }

    // Audit log: Script validation passed
    this.logAuditEvent('script_validation_success', { script });
  }

  /**
   * Get the package manager command for running scripts
   * Validates script names and returns command + args array for safe execution
   * @param script - Script name (e.g., 'lint', 'test')
   * @returns Object with command and arguments array
   */
  private async getPackageManagerCommand(script: string): Promise<{ command: string; args: string[] }> {
    // Validate script against allowlist
    this.validateScript(script);

    const pm = await this.detectPackageManager();

    // Split script into parts for safe execution
    const scriptParts = script.split(/\s+/);

    switch (pm) {
      case 'pnpm':
        return { command: 'pnpm', args: scriptParts };
      case 'yarn':
        return { command: 'yarn', args: scriptParts };
      case 'npm':
        return { command: 'npm', args: ['run', ...scriptParts] };
      default:
        return { command: 'npm', args: ['run', ...scriptParts] };
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
        const interactiveSafety = this.commitConfig.interactiveSafety !== false;

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
    } catch {
      console.log(chalk.red('❌ Not in a git repository or git is not available'));
      return false;
    }
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

      // Validate configuration using Zod schema
      const validation = validateConfig(loadedConfig);

      if (!validation.success) {
        console.log(chalk.yellow('   ⚠️  Configuration validation errors:'));
        validation.errors?.forEach(err => console.log(chalk.yellow(`      • ${err}`)));
        console.log(chalk.yellow('   Using default configuration'));
        return { ...DEFAULT_COMMIT_CONFIG };
      }

      // Use validated config data
      const validatedData = validation.data!;

      // Merge with defaults to ensure all properties exist
      const mergedConfig: CommitConfig = {
        enabled: validatedData.commit.enabled,
        qualityChecks: {
          lint: validatedData.commit.quality_checks.lint,
          lintCommand: validatedData.commit.quality_checks.lint_command || 'lint',
          test: validatedData.commit.quality_checks.test,
          testCommand: validatedData.commit.quality_checks.test_command || 'test --run',
        },
        conventionalCommits: {
          enabled: validatedData.commit.conventional_commits.enabled,
          typeMapping: {
            ...DEFAULT_COMMIT_CONFIG.conventionalCommits.typeMapping,
            ...(validatedData.commit.conventional_commits.type_mapping || {}),
          },
        },
        coAuthor: validatedData.commit.co_author,
        emoji: validatedData.commit.emoji,
        interactiveSafety: validatedData.commit.interactive_safety ?? true,
      };

      console.log(chalk.cyan('   ✅ Loaded commit configuration from .regent/config/execute.yml'));
      return mergedConfig;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(chalk.yellow(`   ⚠️  Failed to load config: ${message}, using defaults`));
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
        target: target as 'backend' | 'frontend' | 'fullstack',
        layer: layer as 'domain' | 'data' | 'infra' | 'presentation' | 'main'
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
          target: this.validationResult.targetValidated as 'backend' | 'frontend' | 'fullstack',
          layer: this.validationResult.layerValidated as 'domain' | 'data' | 'infra' | 'presentation' | 'main'
        };

        console.log(chalk.cyan(`📊 Detected: ${this.layerInfo.target} / ${this.layerInfo.layer} layer`));
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ Validation error: ${message}`));
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
            target: metadata.project_type as 'backend' | 'frontend' | 'fullstack',
            layer: metadata.layer as 'domain' | 'data' | 'infra' | 'presentation' | 'main'
          };
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(chalk.red.bold(`❌ Error: Could not read or parse the YAML file.`));
      console.error(chalk.red(`   Reason: ${message}`));
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

  /**
   * Execute all steps in the implementation plan
   *
   * This is the main entry point that orchestrates the entire execution flow:
   * 1. Loads the YAML implementation plan
   * 2. Performs git safety checks (warns about uncommitted changes)
   * 3. Pre-validates the template structure
   * 4. Executes each step sequentially
   * 5. Runs quality checks (lint/test) before each commit
   * 6. Creates conventional commits with automatic scope detection
   * 7. Calculates RLHF scores for learning
   *
   * @throws {Error} If git safety check fails or critical errors occur
   * @returns {Promise<void>} Resolves when all steps complete successfully
   *
   * @example
   * ```typescript
   * const executor = new EnhancedStepExecutor('./spec/001-feature/implementation.yaml');
   * await executor.run();
   * ```
   */
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

      // Save current git state before executing step (for safe rollback)
      try {
        const hashResult = await $`git rev-parse HEAD`;
        this.lastKnownCommitHash = hashResult.stdout.trim();
      } catch {
        // If git not available, set to null
        this.lastKnownCommitHash = null;
      }

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

      } catch (error) {
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
        this.provideLayerSpecificGuidance();

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

    // Cleanup resources
    this.destroy();
  }

  /**
   * Destructor pattern - cleanup all resources
   * Should be called when execution completes or errors
   * Ensures no resource leaks (signal handlers, file descriptors, etc)
   */
  public destroy(): void {
    // Remove signal handlers to prevent memory leaks
    this.removeCleanupHandlers();

    // Close logger file descriptors
    this.logger.close();

    // Clear caches
    this.executionCache.clear();
    this.cachedPackageManager = null;
    this.lastKnownCommitHash = null;

    // Clear commit hashes
    this.commitHashes = [];
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
  private enhanceErrorMessageWithLayerContext(error: unknown, step: Step): string {
    const baseError = extractErrorMessage(error);

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
  private provideLayerSpecificGuidance(): void {
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
        throw new Error(`Unknown step type: '${step.type}'`);
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

  private async handleFolderStep(step: Step): Promise<void> {
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

  private getScoreColor(score: number): typeof chalk.green.bold {
    if (score >= 2) return chalk.green.bold;
    if (score >= 1) return chalk.green;
    if (score >= 0) return chalk.yellow;
    if (score >= -1) return chalk.red;
    return chalk.red.bold;
  }

  private enhanceErrorMessage(error: unknown, step: Step): string {
    const baseError = extractErrorMessage(error);

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
      const pm = await this.detectPackageManager();
      console.log(chalk.gray(`   ℹ️  Using package manager: ${pm}`));

    // Run lint if enabled
    if (this.commitConfig.qualityChecks.lint) {
      console.log(chalk.blue('   🔍 Running lint check...'));
      checks.push(
        (async () => {
          try {
            $.verbose = false;
            const scriptName = this.commitConfig.qualityChecks.lintCommand || 'lint';
            const { command, args } = await this.getPackageManagerCommand(scriptName);
            const lintResult = await $`${[command, ...args]}`;
            $.verbose = true;
            console.log(chalk.green('   ✅ Lint check passed'));
            return { type: 'lint' as const, passed: true, output: lintResult.stdout + lintResult.stderr };
          } catch (error) {
            $.verbose = true;
            const output = extractCommandOutput(error);
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
            const scriptName = this.commitConfig.qualityChecks.testCommand || 'test --run';
            const { command, args } = await this.getPackageManagerCommand(scriptName);
            const testResult = await $`${[command, ...args]}`;
            $.verbose = true;
            console.log(chalk.green('   ✅ Tests passed'));
            return { type: 'test' as const, passed: true, output: testResult.stdout + testResult.stderr };
          } catch (error) {
            $.verbose = true;
            const output = extractCommandOutput(error);
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
    } catch (error) {
      // Error boundary: If quality checks crash, treat as failed
      const message = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`   ❌ Quality checks crashed: ${message}`));
      console.log(chalk.yellow('   ℹ️  Treating as failed quality check'));

      const errMsg = error instanceof Error ? error.message : String(error);
      return createQualityCheckResult(
        false,
        false,
        `Quality check system error: ${errMsg}`,
        `Quality check system error: ${errMsg}`
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
      // Rate limit git operations
      await this.rateLimitGitOperation();

      // Verify git index is clean before staging
      const cachedResult = await $`git diff --cached --name-only`;
      const alreadyStaged = cachedResult.stdout.trim().split('\n').filter(f => f.length > 0);

      if (alreadyStaged.length > 0) {
        console.log(chalk.yellow('   ⚠️  Warning: Git index has staged changes from previous operations'));
        console.log(chalk.gray(`   📋 Staged files: ${alreadyStaged.join(', ')}`));
      }

      // Add files to git - be specific about what to stage
      console.log(chalk.blue('   📝 Staging changes...'));
      if (step.path && fs.existsSync(step.path)) {
        // Rate limit before staging
        await this.rateLimitGitOperation();
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
          // Batch check file existence for performance
          const existingFiles = changedFiles.filter(file => fs.existsSync(file));

          if (existingFiles.length > 0) {
            // Stage all existing files in one command
            await $`git add ${existingFiles}`;
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
    } catch (error) {
      // If commit fails, it might be because there are no changes or other git issues
      const errorMsg = extractErrorMessage(error, 'Unknown git error');

      if (errorMsg.includes('nothing to commit')) {
        console.log(chalk.yellow('   ⚠️  No changes to commit'));
      } else {
        throw new Error(`Git commit failed: ${errorMsg}`);
      }
    }
  }

  /**
   * Retry a git operation with exponential backoff
   * @param operation The git operation to retry
   * @param operationName Human-readable name for logging
   * @param maxRetries Maximum number of retries
   * @returns Result of the operation
   */
  private async retryGitOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = RETRY.MAX_GIT_RETRIES
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMsg = extractErrorMessage(error, 'Unknown error');

        // Don't retry on certain permanent errors
        if (
          errorMsg.includes('not a git repository') ||
          errorMsg.includes('does not exist') ||
          errorMsg.includes('permission denied')
        ) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delayMs = TIMING.GIT_RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(
            chalk.yellow(
              `   ⏳ ${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`
            )
          );
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error(
      `${operationName} failed after ${maxRetries} attempts: ${extractErrorMessage(lastError, 'Unknown error')}`
    );
  }

  /**
   * Rollback changes made by a failed step
   * Only rolls back files modified by this step, preserving user's uncommitted changes
   * Verifies git state hasn't changed to prevent unsafe rollbacks
   * Uses retry logic with exponential backoff for transient git failures
   */
  private async rollbackStep(step: Step): Promise<void> {
    console.log(chalk.yellow('   🔄 Rolling back changes...'));

    // Audit log: Rollback initiated
    this.logAuditEvent('rollback_started', {
      stepId: step.id,
      stepType: step.type,
      stepPath: step.path,
    });

    try {
      // Verify git state hasn't been manually modified since step start
      if (this.lastKnownCommitHash) {
        const currentHash = await this.retryGitOperation(
          async () => {
            const result = await $`git rev-parse HEAD`;
            return result.stdout.trim();
          },
          'Git state verification'
        );

        if (currentHash !== this.lastKnownCommitHash) {
          throw new Error(
            `Git state has changed unexpectedly (expected ${this.lastKnownCommitHash.slice(0, 7)}, ` +
            `found ${currentHash.slice(0, 7)}). Cannot safely rollback. ` +
            `Please manually review and revert changes.`
          );
        }
      }
      // Get list of files staged for commit (files modified by this step)
      const stagedFiles = await this.retryGitOperation(
        async () => {
          const result = await $`git diff --cached --name-only`;
          return result.stdout.trim().split('\n').filter(f => f.length > 0);
        },
        'Get staged files'
      );

      // Reset staged changes first
      await this.retryGitOperation(
        async () => await $`git reset HEAD`,
        'Reset staged changes'
      );

      // Handle the specific step path
      if (step.path) {
        const fileExists = fs.existsSync(step.path);

        if (fileExists) {
          // Check if this file existed in the last commit
          try {
            await this.retryGitOperation(
              async () => await $`git cat-file -e HEAD:${step.path}`,
              'Check file existence in HEAD'
            );
            // File existed before - restore it from git (only if it was staged)
            if (stagedFiles.includes(step.path)) {
              await this.retryGitOperation(
                async () => await $`git checkout HEAD -- ${step.path}`,
                'Restore file from HEAD'
              );
              console.log(chalk.yellow(`   ↩️  Restored ${step.path} from last commit`));
            }
          } catch {
            // File did not exist before - it's new, remove it
            await fs.remove(step.path);
            console.log(chalk.yellow(`   ↩️  Removed newly created ${step.path}`));
          }
        }
      }

      // Restore only files that were staged (modified by this step)
      // Exclude the step.path since we already handled it
      const filesToRestore = stagedFiles.filter(f => f !== step.path);

      if (filesToRestore.length > 0) {
        // Separate files into: existing in HEAD vs new files
        const filesToCheckout: string[] = [];
        const filesToRemove: string[] = [];

        for (const file of filesToRestore) {
          try {
            // Check if file exists in HEAD
            await this.retryGitOperation(
              async () => await $`git cat-file -e HEAD:${file}`,
              `Check file ${file} in HEAD`
            );
            filesToCheckout.push(file);
          } catch {
            filesToRemove.push(file);
          }
        }

        // Batch restore files that exist in HEAD
        if (filesToCheckout.length > 0) {
          await this.retryGitOperation(
            async () => await $`git checkout HEAD -- ${filesToCheckout}`,
            'Restore files from HEAD'
          );
          console.log(chalk.gray(`   ↩️  Restored ${filesToCheckout.length} file(s) from HEAD`));
        }

        // Remove new files (batch check existence first)
        if (filesToRemove.length > 0) {
          const existingFilesToRemove = filesToRemove.filter(f => fs.existsSync(f));
          for (const file of existingFilesToRemove) {
            await fs.remove(file);
          }
          if (existingFilesToRemove.length > 0) {
            console.log(chalk.gray(`   ↩️  Removed ${existingFilesToRemove.length} new file(s)`));
          }
        }
      }

      console.log(chalk.green('   ✅ Rollback complete'));

      // Audit log: Rollback completed successfully
      this.logAuditEvent('rollback_success', {
        stepId: step.id,
        stepType: step.type,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`   ⚠️  Rollback failed: ${message}`));
      console.log(chalk.yellow('   ℹ️  Manual cleanup may be required'));

      // Audit log: Rollback failed
      this.logAuditEvent('rollback_failed', {
        stepId: step.id,
        stepType: step.type,
        error: message,
      });
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

    } catch (error) {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed++;
      console.error(chalk.red(`❌ Failed: ${path.basename(template)}`));
      console.error(chalk.red(`   Error: ${message}`));
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