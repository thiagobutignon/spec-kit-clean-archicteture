/**
 * Constants for execute-steps configuration
 * Centralizes magic numbers and configurable values
 */

/**
 * Time constants (in milliseconds)
 */
export const TIMING = {
  /** Time to wait before continuing when user has uncommitted changes */
  GIT_SAFETY_WARNING_DELAY: 5000,

  /** Maximum time to wait for a quality check (lint/test) */
  QUALITY_CHECK_TIMEOUT: 300000, // 5 minutes

  /** Delay before retrying failed git operations */
  GIT_RETRY_DELAY: 1000,
} as const;

/**
 * Retry configuration
 */
export const RETRY = {
  /** Maximum number of retries for git operations */
  MAX_GIT_RETRIES: 3,

  /** Maximum number of retries for quality checks */
  MAX_QUALITY_CHECK_RETRIES: 1,
} as const;

/**
 * Output limits
 */
export const OUTPUT_LIMITS = {
  /** Maximum number of error lines to display from quality checks */
  MAX_ERROR_LINES: 10,

  /** Maximum length of commit message body */
  MAX_COMMIT_MESSAGE_LENGTH: 500,

  /** Maximum length for commit subject line (conventional commits) */
  MAX_COMMIT_SUBJECT_LENGTH: 72,

  /** Maximum output to store in memory before streaming to file */
  MAX_OUTPUT_BUFFER_SIZE: 10000,
} as const;

/**
 * Process exit codes
 */
export const EXIT_CODES = {
  /** Successful execution */
  SUCCESS: 0,

  /** General error */
  ERROR: 1,

  /** Interrupted by user (Ctrl+C) */
  SIGINT: 130,

  /** Terminated by system */
  SIGTERM: 143,
} as const;

/**
 * Git operation types for error handling
 */
export const GIT_OPERATIONS = {
  ADD: 'add',
  COMMIT: 'commit',
  RESET: 'reset',
  STATUS: 'status',
  CHECKOUT: 'checkout',
} as const;

export type GitOperation = typeof GIT_OPERATIONS[keyof typeof GIT_OPERATIONS];