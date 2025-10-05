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
 * Environment variable names for execution options
 */
const ENV_VARS = {
  REGENT_NON_INTERACTIVE: 'REGENT_NON_INTERACTIVE',
  REGENT_AUTO_CONFIRM: 'REGENT_AUTO_CONFIRM',
  REGENT_STRICT: 'REGENT_STRICT',
  CI: 'CI',
  CLAUDE_CODE: 'CLAUDE_CODE',
  AI_ORCHESTRATOR: 'AI_ORCHESTRATOR',
} as const;

/**
 * Valid boolean values for environment variables (case-insensitive)
 */
const TRUTHY_VALUES = ['1', 'true', 'yes', 'on'] as const;

/**
 * Check if environment variable is set to a truthy value
 * Accepts: '1', 'true', 'yes', 'on' (case-insensitive)
 */
function isEnvTrue(varName: string): boolean {
  const value = process.env[varName]?.toLowerCase();
  if (!value) return false;
  return TRUTHY_VALUES.includes(value as typeof TRUTHY_VALUES[number]);
}

/**
 * Check if environment variable is set (any value)
 */
function isEnvSet(varName: string): boolean {
  return !!process.env[varName];
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
      isEnvTrue(ENV_VARS.REGENT_NON_INTERACTIVE) ||
      isEnvTrue(ENV_VARS.CI) ||
      isEnvSet(ENV_VARS.CLAUDE_CODE) ||
      isEnvSet(ENV_VARS.AI_ORCHESTRATOR);
  }

  if (parsed.autoConfirm === undefined) {
    parsed.autoConfirm = isEnvTrue(ENV_VARS.REGENT_AUTO_CONFIRM);
  }

  if (parsed.strict === undefined) {
    parsed.strict = isEnvTrue(ENV_VARS.REGENT_STRICT);
  }

  // Validate conflicting flags
  if (parsed.strict && parsed.autoConfirm) {
    console.warn(chalk.yellow`   ⚠️  --strict overrides --yes flag`);
    parsed.autoConfirm = false;
  }

  // Log execution mode
  if (parsed.nonInteractive) {
    console.log(chalk.cyan`   ℹ️  Running in non-interactive mode`);
    if (parsed.strict) {
      console.log(chalk.yellow`   ⚠️  Strict mode: Will fail on warnings`);
    }
    if (parsed.autoConfirm) {
      console.log(chalk.yellow`   ⚠️  Auto-confirm mode: All prompts auto-approved`);
    }
  }

  return parsed;
}
