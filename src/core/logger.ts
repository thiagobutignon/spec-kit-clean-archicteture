// Using namespace import for native Node.js 'fs' module (not fs-extra)
// This is correct and not affected by the ESM bug - native fs works fine with namespace imports
// Only fs-extra requires default import in ESM/tsx context
import * as fs from 'fs';
import { Writable } from 'stream';
import path from 'path';
import chalk from 'chalk';

// We use a consistent log file name for each execution
const LOG_FILE_NAME = 'execution.log';

// Valid RLHF score range for validation
const VALID_RLHF_SCORES = [-2, -1, 0, 1, 2] as const;

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
}

export interface LogContext {
  stepId?: string;
  layer?: string;
  action?: string;
  progress?: string;
  duration?: number;
  file?: string;
  [key: string]: unknown;
}

export interface LoggerOptions {
  logDirectory: string;
  verbose?: boolean;
  quiet?: boolean;
  showTimestamp?: boolean;
  timestampFormat?: 'iso' | 'relative' | 'elapsed';
  colorize?: boolean;
  logLevel?: LogLevel;
}

export interface ExecutionSummary {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  totalDuration: number;
  averageStepDuration: number;
  qualityChecks: {
    passed: number;
    failed: number;
    skipped: number;
  };
  rlhfScore: {
    average: number;
    total: number;
    breakdown: Record<number, number>;
  };
}

class Logger {
  private logFilePath: string;
  private logStream: fs.WriteStream;
  private verbose: boolean;
  private quiet: boolean;
  private showTimestamp: boolean;
  private timestampFormat: 'iso' | 'relative' | 'elapsed';
  private colorize: boolean;
  private logLevel: LogLevel;
  private startTime: number;
  private executionSummary: ExecutionSummary;
  private currentStepStartTime?: number;
  private expectedTotalSteps?: number;
  private shutdownHandlersRegistered = false;
  private shutdownInProgress = false;
  private closeStreamHandler?: () => void;

  constructor(options: LoggerOptions | string) {
    // Backward compatibility: support old string constructor
    if (typeof options === 'string') {
      options = { logDirectory: options };
    }

    const {
      logDirectory,
      verbose = false,
      quiet = false,
      showTimestamp = true,
      timestampFormat = 'iso',
      colorize = true,
      logLevel = LogLevel.INFO,
    } = options;

    // Ensure the log directory exists
    try {
      fs.mkdirSync(logDirectory, { recursive: true });
      this.logFilePath = path.join(logDirectory, LOG_FILE_NAME);

      // Create a write stream for the log file
      // The 'a' flag means 'append', so we don't overwrite the log on each execution
      this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });

      // Handle stream errors to prevent crashes
      this.logStream.on('error', (err) => {
        console.error('Logger stream error:', err.message);
        // Stream errors are non-fatal; logging will continue to console only
      });
    } catch (err) {
      // If directory creation fails (e.g., permissions), fall back to console-only logging
      console.warn(
        `Warning: Could not create log directory at ${logDirectory}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      console.warn('Logging will continue to console only.');
      this.logFilePath = '';
      // Create a dummy writable stream that does nothing
      this.logStream = new Writable({
        write(_chunk: unknown, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
          callback();
        },
      });
    }

    this.verbose = verbose || process.env.LOG_VERBOSE === 'true';
    this.quiet = quiet || process.env.LOG_QUIET === 'true';
    this.showTimestamp = showTimestamp;
    this.timestampFormat = timestampFormat;
    this.colorize = colorize && process.stdout.isTTY;
    this.logLevel = logLevel;
    this.startTime = Date.now();

    // Initialize execution summary
    this.executionSummary = {
      totalSteps: 0,
      completedSteps: 0,
      failedSteps: 0,
      skippedSteps: 0,
      totalDuration: 0,
      averageStepDuration: 0,
      qualityChecks: {
        passed: 0,
        failed: 0,
        skipped: 0,
      },
      rlhfScore: {
        average: 0,
        total: 0,
        breakdown: {},
      },
    };

    if (!this.quiet) {
      console.log(chalk.gray(`📝 Logging to: ${this.logFilePath}`));
    }

    // Setup graceful shutdown handlers
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    // Guard against multiple registrations
    // This is safe because setupGracefulShutdown is private and only called once in the constructor
    // The flag ensures idempotency in case of future refactoring
    if (this.shutdownHandlersRegistered) return;

    this.closeStreamHandler = () => {
      // Protect against concurrent shutdown signals
      if (this.shutdownInProgress) return;
      this.shutdownInProgress = true;

      if (this.logStream && !this.logStream.closed) {
        this.logStream.end();
      }
    };

    process.on('SIGINT', this.closeStreamHandler);
    process.on('SIGTERM', this.closeStreamHandler);
    process.on('exit', this.closeStreamHandler);

    this.shutdownHandlersRegistered = true;
  }

  private sanitizeMessage(message: string): string {
    // Replace newlines with escaped newlines to prevent log injection
    return message.replace(/\r?\n/g, '\\n');
  }

  private formatTimestamp(): string {
    if (!this.showTimestamp) return '';

    const now = Date.now();

    switch (this.timestampFormat) {
      case 'iso':
        return `[${new Date().toISOString()}]`;
      case 'relative':
        return `[+${((now - this.startTime) / 1000).toFixed(1)}s]`;
      case 'elapsed':
        const elapsed = now - this.startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        // Use 3-digit padding for hours to support processes up to 999 hours (~41 days)
        // For even longer processes, hours will naturally expand beyond 3 digits
        return `[${hours.toString().padStart(3, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
      default:
        return `[${new Date().toISOString()}]`;
    }
  }

  private formatContext(context?: LogContext): string {
    if (!context || Object.keys(context).length === 0) return '';

    const parts: string[] = [];

    // Sanitize string values to prevent log injection through context fields
    if (context.stepId) parts.push(`step=${this.sanitizeMessage(context.stepId)}`);
    if (context.layer) parts.push(`layer=${this.sanitizeMessage(context.layer)}`);
    if (context.action) parts.push(`action=${this.sanitizeMessage(context.action)}`);
    if (context.progress) parts.push(`progress=${this.sanitizeMessage(context.progress)}`);
    if (context.duration !== undefined) parts.push(`duration=${context.duration.toFixed(1)}s`);
    if (context.file) parts.push(`file=${this.sanitizeMessage(context.file)}`);

    // Add any other context properties with sanitization
    for (const [key, value] of Object.entries(context)) {
      if (!['stepId', 'layer', 'action', 'progress', 'duration', 'file'].includes(key)) {
        // Sanitize the stringified value to prevent injection
        const sanitizedValue = this.sanitizeMessage(JSON.stringify(value));
        parts.push(`${key}=${sanitizedValue}`);
      }
    }

    return parts.length > 0 ? ` {${parts.join(', ')}}` : '';
  }

  private getLevelPrefix(level: LogLevel): string {
    if (!this.colorize) {
      switch (level) {
        case LogLevel.DEBUG:
          return '[DEBUG]';
        case LogLevel.INFO:
          return '[INFO]';
        case LogLevel.WARN:
          return '[WARN]';
        case LogLevel.ERROR:
          return '[ERROR]';
        case LogLevel.SUCCESS:
          return '[SUCCESS]';
      }
    }

    switch (level) {
      case LogLevel.DEBUG:
        return chalk.gray('[DEBUG]');
      case LogLevel.INFO:
        return chalk.blue('[INFO]');
      case LogLevel.WARN:
        return chalk.yellow('[WARN]');
      case LogLevel.ERROR:
        return chalk.red('[ERROR]');
      case LogLevel.SUCCESS:
        return chalk.green('[SUCCESS]');
    }
  }

  private writeLog(level: LogLevel, message: string, context?: LogContext): void {
    // Skip if log level is too low
    // SUCCESS messages bypass log level filtering because they represent critical milestones
    // that should always be visible regardless of verbosity settings
    if (level < this.logLevel && level !== LogLevel.SUCCESS) return;
    if (this.quiet && level !== LogLevel.ERROR) return;

    // Sanitize message to prevent log injection
    const sanitizedMessage = this.sanitizeMessage(message);

    const timestamp = this.formatTimestamp();
    const levelPrefix = this.getLevelPrefix(level);
    const contextStr = this.verbose ? this.formatContext(context) : '';
    const formattedMessage = `${timestamp} ${levelPrefix} ${sanitizedMessage}${contextStr}\n`;

    // Write to file (always, without color)
    const fileMessage = `${timestamp} [${LogLevel[level]}] ${sanitizedMessage}${contextStr}\n`;
    this.logStream.write(fileMessage);

    // Write to console (with color if enabled)
    if (!this.quiet || level === LogLevel.ERROR) {
      if (level === LogLevel.ERROR) {
        process.stderr.write(formattedMessage);
      } else {
        process.stdout.write(formattedMessage);
      }
    }
  }

  /**
   * Logs a debug message. Only displayed when logLevel is set to DEBUG.
   * @param message - The message to log
   * @param context - Optional structured context information
   */
  public debug(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs an informational message.
   * @param message - The message to log
   * @param context - Optional structured context information
   */
  public info(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  /**
   * Logs a warning message.
   * @param message - The message to log
   * @param context - Optional structured context information
   */
  public warn(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.WARN, message, context);
  }

  /**
   * Logs an error message. Always displayed even in quiet mode.
   * @param message - The message to log
   * @param context - Optional structured context information
   */
  public error(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.ERROR, message, context);
  }

  /**
   * Logs a success message. Always displayed regardless of log level (critical milestone).
   * @param message - The message to log
   * @param context - Optional structured context information
   */
  public success(message: string, context?: LogContext): void {
    this.writeLog(LogLevel.SUCCESS, message, context);
  }

  /**
   * Legacy logging method for backward compatibility. Maps to info().
   * @param message - The message to log
   * @deprecated Use info() instead for better semantic clarity
   */
  public log(message: string): void {
    // Backward compatibility
    this.info(message);
  }

  /**
   * Starts tracking a new execution step with progress indication.
   * @param stepId - Unique identifier for the step
   * @param description - Human-readable description of what the step does
   * @param layer - Optional layer name (e.g., 'domain', 'infrastructure')
   * @param totalSteps - Optional total number of expected steps for accurate progress display
   * @example
   * logger.startStep('validate-schema', 'Validating input schema', 'domain', 5);
   */
  public startStep(stepId: string, description: string, layer?: string, totalSteps?: number): void {
    this.currentStepStartTime = Date.now();
    this.executionSummary.totalSteps++;

    // Store expected total steps if provided
    if (totalSteps !== undefined) {
      this.expectedTotalSteps = totalSteps;
    }

    if (!this.quiet) {
      const layerInfo = layer ? chalk.gray(`(${layer})`) : '';
      const total = this.expectedTotalSteps || this.executionSummary.totalSteps;
      console.log(
        `\n${chalk.cyan('▶️')}  ${chalk.bold(`[${this.executionSummary.totalSteps}/${total}] ${stepId}`)} ${layerInfo}`,
      );
      console.log(`   ${description}`);
    }

    this.info(`Starting step: ${stepId}`, { stepId, layer, action: 'start' });
  }

  /**
   * Completes a previously started step and updates execution summary.
   * @param stepId - The identifier of the step being completed
   * @param success - Whether the step completed successfully
   * @param details - Optional details about the completion (success message or error details)
   * @example
   * logger.completeStep('validate-schema', true, 'All validations passed');
   * logger.completeStep('build-app', false, 'TypeScript compilation errors');
   */
  public completeStep(stepId: string, success: boolean, details?: string): void {
    const duration = this.currentStepStartTime ? (Date.now() - this.currentStepStartTime) / 1000 : 0;

    if (success) {
      this.executionSummary.completedSteps++;
      this.executionSummary.totalDuration += duration;

      if (!this.quiet) {
        console.log(`   ${chalk.green('✅')} Step completed in ${duration.toFixed(1)}s`);
        if (details) console.log(`   ${chalk.gray(details)}`);
      }

      this.success(`Completed step: ${stepId}`, { stepId, duration });
    } else {
      this.executionSummary.failedSteps++;

      if (!this.quiet) {
        console.log(`   ${chalk.red('❌')} Step failed after ${duration.toFixed(1)}s`);
        if (details) console.log(`   ${chalk.red(details)}`);
      }

      this.error(`Failed step: ${stepId}`, { stepId, duration });
    }

    this.currentStepStartTime = undefined;

    // Update average
    if (this.executionSummary.completedSteps > 0) {
      this.executionSummary.averageStepDuration =
        this.executionSummary.totalDuration / this.executionSummary.completedSteps;
    }
  }

  /**
   * Logs the result of a quality check (e.g., lint, tests, build).
   * @param name - Name of the quality check
   * @param passed - Whether the quality check passed
   * @param details - Optional details about the check result
   * @example
   * logger.logQualityCheck('TypeScript Lint', true);
   * logger.logQualityCheck('Unit Tests', false, '3 tests failed');
   */
  public logQualityCheck(name: string, passed: boolean, details?: string): void {
    if (passed) {
      this.executionSummary.qualityChecks.passed++;
      if (!this.quiet) {
        console.log(`      ${chalk.green('✅')} ${name}: Passed`);
        if (details && this.verbose) console.log(`         ${chalk.gray(details)}`);
      }
    } else {
      this.executionSummary.qualityChecks.failed++;
      if (!this.quiet) {
        console.log(`      ${chalk.red('❌')} ${name}: Failed`);
        if (details) console.log(`         ${chalk.red(details)}`);
      }
    }
  }

  /**
   * Logs an RLHF (Reinforcement Learning from Human Feedback) score for code quality.
   * Valid scores are -2, -1, 0, 1, 2. Invalid scores will trigger a warning but still be tracked.
   * @param score - The RLHF score (-2 to +2)
   * @param breakdown - Detailed breakdown explanation of the score
   * @example
   * logger.logRLHFScore(2, 'Perfect implementation with comprehensive tests');
   * logger.logRLHFScore(-1, 'Multiple violations detected');
   */
  public logRLHFScore(score: number, breakdown: string): void {
    // Validate RLHF score is in expected range
    // We warn instead of throwing to maintain execution flow and allow debugging
    // Invalid scores are still tracked but logged for investigation
    if (!VALID_RLHF_SCORES.includes(score as typeof VALID_RLHF_SCORES[number])) {
      this.warn(`Unexpected RLHF score: ${score}. Expected one of: ${VALID_RLHF_SCORES.join(', ')}`);
    }

    this.executionSummary.rlhfScore.total += score;
    this.executionSummary.rlhfScore.breakdown[score] =
      (this.executionSummary.rlhfScore.breakdown[score] || 0) + 1;

    const completedCount = this.executionSummary.completedSteps;
    if (completedCount > 0) {
      this.executionSummary.rlhfScore.average = this.executionSummary.rlhfScore.total / completedCount;
    }

    if (!this.quiet) {
      console.log(`\n   ${chalk.cyan('🧮')} RLHF Analysis:`);
      console.log(`      ${breakdown}`);
      console.log(
        `      ${chalk.bold('📊 Final score:')} ${score >= 0 ? chalk.green(score) : chalk.red(score)}/2`,
      );
    }
  }

  /**
   * Displays a progress bar for long-running operations.
   * @param current - Current progress value
   * @param total - Total expected value (must be > 0 for meaningful percentage)
   * @param eta - Optional estimated time remaining in milliseconds
   * @example
   * logger.logProgress(25, 100, 5000); // 25% complete, 5s ETA
   */
  public logProgress(current: number, total: number, eta?: number): void {
    if (this.quiet) return;

    // Guard against division by zero
    const percentage = total > 0 ? Math.floor((current / total) * 100) : 0;
    const completed = Math.floor(percentage / 5);
    const remaining = 20 - completed;
    const progressBar = chalk.green('█'.repeat(completed)) + chalk.gray('░'.repeat(remaining));

    const etaStr = eta ? ` | ETA: ${this.formatDuration(eta)}` : '';
    console.log(`\nProgress: ${progressBar} ${percentage}%${etaStr}\n`);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Prints a comprehensive execution summary to the console.
   * Includes step counts, quality check results, RLHF scores, and performance metrics.
   * Not displayed in quiet mode.
   * @example
   * logger.printExecutionSummary();
   */
  public printExecutionSummary(): void {
    if (this.quiet) return;

    const totalDuration = Date.now() - this.startTime;

    console.log('\n' + chalk.bold('═'.repeat(60)));
    console.log(chalk.bold.cyan('📊 Execution Summary'));
    console.log(chalk.bold('═'.repeat(60)));

    console.log('\n' + chalk.bold('Steps:'));
    console.log(`   Total:     ${this.executionSummary.totalSteps}`);
    console.log(`   ${chalk.green('✅ Completed:')} ${this.executionSummary.completedSteps}`);
    console.log(`   ${chalk.red('❌ Failed:')}    ${this.executionSummary.failedSteps}`);
    console.log(`   ${chalk.yellow('⊘  Skipped:')}   ${this.executionSummary.skippedSteps}`);

    console.log('\n' + chalk.bold('Quality Checks:'));
    console.log(`   ${chalk.green('✅ Passed:')}  ${this.executionSummary.qualityChecks.passed}`);
    console.log(`   ${chalk.red('❌ Failed:')}  ${this.executionSummary.qualityChecks.failed}`);
    console.log(`   ${chalk.yellow('⊘  Skipped:')} ${this.executionSummary.qualityChecks.skipped}`);

    console.log('\n' + chalk.bold('RLHF Scores:'));
    console.log(`   Average:   ${this.executionSummary.rlhfScore.average.toFixed(2)}/2`);
    console.log(`   Total:     ${this.executionSummary.rlhfScore.total}`);
    console.log(`   Breakdown:`);
    for (const [score, count] of Object.entries(this.executionSummary.rlhfScore.breakdown)) {
      const scoreNum = Number(score);
      const color = scoreNum >= 0 ? chalk.green : chalk.red;
      console.log(`      ${color(`Score ${score}:`)} ${count} step(s)`);
    }

    console.log('\n' + chalk.bold('Performance:'));
    console.log(`   Total duration:   ${this.formatDuration(totalDuration)}`);
    console.log(`   Average per step: ${this.executionSummary.averageStepDuration.toFixed(1)}s`);

    console.log('\n' + chalk.bold('═'.repeat(60)));

    this.info('Execution summary printed', {
      totalSteps: this.executionSummary.totalSteps,
      completedSteps: this.executionSummary.completedSteps,
      failedSteps: this.executionSummary.failedSteps,
      averageRLHFScore: this.executionSummary.rlhfScore.average,
    });
  }

  /**
   * Returns a copy of the current execution summary with all metrics.
   * @returns A copy of the execution summary object
   * @example
   * const summary = logger.getExecutionSummary();
   * console.log(`Completed ${summary.completedSteps} of ${summary.totalSteps} steps`);
   */
  public getExecutionSummary(): ExecutionSummary {
    return { ...this.executionSummary };
  }

  /**
   * Closes the log file stream and removes shutdown handlers.
   * Should be called when the logger is no longer needed to prevent resource leaks.
   * @example
   * logger.close();
   */
  public close(): void {
    // Remove shutdown handlers to prevent memory leaks
    if (this.closeStreamHandler) {
      process.off('SIGINT', this.closeStreamHandler);
      process.off('SIGTERM', this.closeStreamHandler);
      process.off('exit', this.closeStreamHandler);
      this.shutdownHandlersRegistered = false;
    }

    this.logStream.end();
  }
}

export default Logger;