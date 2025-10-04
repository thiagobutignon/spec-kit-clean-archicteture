/**
 * Execution options utilities for non-interactive mode
 */

import chalk from 'chalk';

export interface ExecutionOptions {
  nonInteractive?: boolean;
  autoConfirm?: boolean;
  strict?: boolean;
}

/**
 * Parse execution options from CLI flags, environment variables, and config
 * Priority: CLI flags > Environment variables > Config file
 *
 * @param options - Options provided from CLI
 * @returns Parsed execution options with defaults applied
 */
export function parseExecutionOptions(options: ExecutionOptions): ExecutionOptions {
  // Start with provided options (from CLI)
  const parsed: ExecutionOptions = { ...options };

  // Check environment variables if not set by CLI
  if (parsed.nonInteractive === undefined) {
    parsed.nonInteractive =
      process.env.REGENT_NON_INTERACTIVE === '1' ||
      process.env.REGENT_NON_INTERACTIVE === 'true' ||
      process.env.CI === 'true' ||
      !!process.env.CLAUDE_CODE ||
      !!process.env.AI_ORCHESTRATOR;
  }

  if (parsed.autoConfirm === undefined) {
    parsed.autoConfirm =
      process.env.REGENT_AUTO_CONFIRM === '1' ||
      process.env.REGENT_AUTO_CONFIRM === 'true';
  }

  if (parsed.strict === undefined) {
    parsed.strict =
      process.env.REGENT_STRICT === '1' ||
      process.env.REGENT_STRICT === 'true';
  }

  // Validate conflicting flags
  if (parsed.strict && parsed.autoConfirm) {
    console.warn(chalk.yellow('   ⚠️  --strict overrides --yes flag'));
    parsed.autoConfirm = false;
  }

  // Log execution mode
  if (parsed.nonInteractive) {
    console.log(chalk.cyan('   ℹ️  Running in non-interactive mode'));
    if (parsed.strict) {
      console.log(chalk.yellow('   ⚠️  Strict mode: Will fail on warnings'));
    }
    if (parsed.autoConfirm) {
      console.log(chalk.yellow('   ⚠️  Auto-confirm mode: All prompts auto-approved'));
    }
  }

  return parsed;
}
