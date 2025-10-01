/**
 * Git Operations with Retry Logic
 * Provides safe git operations with proper error handling and retries
 */

import 'zx/globals';
import { RETRY, TIMING, type GitOperation, GIT_OPERATIONS } from './constants';

/**
 * Result of a git operation
 */
export interface GitOperationResult {
  success: boolean;
  output?: string;
  error?: string;
  retries?: number;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface CommandResult {
  stdout?: string;
  toString(): string;
}

interface GitError {
  stderr?: string;
  message?: string;
}

/**
 * Execute a git operation with retry logic
 * @param operation - Type of git operation
 * @param command - Git command to execute
 * @param maxRetries - Maximum number of retries
 * @returns Operation result
 */
export async function executeGitOperation(
  operation: GitOperation,
  command: () => Promise<CommandResult>,
  maxRetries: number = RETRY.MAX_GIT_RETRIES
): Promise<GitOperationResult> {
  let lastError: unknown = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await command();
      return {
        success: true,
        output: result.stdout || result.toString(),
        retries: attempt,
      };
    } catch (error: unknown) {
      lastError = error;
      attempt++;

      // Don't retry on certain errors
      const err = error as GitError;
      const errorMessage = err.stderr || err.message || '';
      if (shouldNotRetry(operation, errorMessage)) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt <= maxRetries) {
        await sleep(TIMING.GIT_RETRY_DELAY * attempt);
      }
    }
  }

  return {
    success: false,
    error: formatGitError(operation, lastError),
    retries: attempt - 1,
  };
}

/**
 * Determine if a git error should not be retried
 */
function shouldNotRetry(operation: GitOperation, errorMessage: string): boolean {
  const noRetryPatterns = [
    'not a git repository',
    'no changes added to commit',
    'nothing to commit',
    'pathspec.*did not match',
    'fatal: bad object',
    'Permission denied',
  ];

  return noRetryPatterns.some(pattern =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
    new RegExp(pattern, 'i').test(errorMessage)
  );
}

/**
 * Format git error message for user display
 */
function formatGitError(operation: GitOperation, error: unknown): string {
  const err = error as GitError;
  const errorMessage = err.stderr || err.message || 'Unknown git error';

  const suggestions: Record<GitOperation, string> = {
    [GIT_OPERATIONS.ADD]: 'Ensure the file exists and is not in .gitignore',
    [GIT_OPERATIONS.COMMIT]: 'Check that you have changes to commit and git is configured',
    [GIT_OPERATIONS.RESET]: 'Ensure you are in a git repository with a valid HEAD',
    [GIT_OPERATIONS.STATUS]: 'Verify you are in a valid git repository',
    [GIT_OPERATIONS.CHECKOUT]: 'Ensure the file/branch exists and there are no conflicts',
  };

  const suggestion = suggestions[operation] || 'Check git status and try again';

  return `Git ${operation} failed: ${errorMessage}\nSuggestion: ${suggestion}`;
}

/**
 * Safely add files to git with retry
 */
export async function gitAdd(files: string | string[]): Promise<GitOperationResult> {
  const fileList = Array.isArray(files) ? files : [files];

  return executeGitOperation(
    GIT_OPERATIONS.ADD,
    async () => {
      // Add files one by one to catch specific errors
      let lastResult;
      for (const file of fileList) {
        // Sanitize file path to prevent injection
        const sanitizedFile = file.replace(/[;&|`$()]/g, '');
        lastResult = await $`git add ${sanitizedFile}`;
      }
      return lastResult || { stdout: '', toString: () => '' };
    }
  );
}

/**
 * Safely commit with retry
 */
export async function gitCommit(message: string): Promise<GitOperationResult> {
  return executeGitOperation(
    GIT_OPERATIONS.COMMIT,
    async () => {
      // Use heredoc to safely pass message without injection risk
      return await $`git commit -m ${message}`;
    }
  );
}

/**
 * Safely reset with retry
 */
export async function gitReset(options?: string[]): Promise<GitOperationResult> {
  return executeGitOperation(
    GIT_OPERATIONS.RESET,
    async () => {
      if (options && options.length > 0) {
        return await $`git reset ${options}`;
      }
      return await $`git reset HEAD`;
    }
  );
}

/**
 * Safely get git status
 */
export async function gitStatus(porcelain = false): Promise<GitOperationResult> {
  return executeGitOperation(
    GIT_OPERATIONS.STATUS,
    async () => {
      if (porcelain) {
        return await $`git status --porcelain`;
      }
      return await $`git status`;
    },
    1 // Status shouldn't need retries
  );
}

/**
 * Safely checkout files with retry
 */
export async function gitCheckout(files: string | string[]): Promise<GitOperationResult> {
  const fileList = Array.isArray(files) ? files : [files];

  return executeGitOperation(
    GIT_OPERATIONS.CHECKOUT,
    async () => {
      let lastResult;
      for (const file of fileList) {
        // Sanitize file path
        const sanitizedFile = file.replace(/[;&|`$()]/g, '');
        lastResult = await $`git checkout -- ${sanitizedFile}`;
      }
      return lastResult || { stdout: '', toString: () => '' };
    }
  );
}

/**
 * Get current commit hash
 */
export async function getCurrentCommitHash(short = true): Promise<GitOperationResult> {
  return executeGitOperation(
    'status' as GitOperation,
    async () => {
      if (short) {
        return await $`git rev-parse --short HEAD`;
      }
      return await $`git rev-parse HEAD`;
    },
    1
  );
}