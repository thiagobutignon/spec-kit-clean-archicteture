/**
 * Commit Generator
 * Generates conventional commit messages for Clean Architecture steps
 */

import { extractScope } from './scope-extractor';

export type StepType = 'create_file' | 'refactor_file' | 'delete_file' | 'folder' | 'branch' | 'pull_request' | 'validation' | 'test' | 'conditional_file';
export type ConventionalCommitType = 'feat' | 'refactor' | 'chore' | 'fix' | 'test' | 'docs' | null;

/**
 * Configuration for commit generation
 */
export interface CommitConfig {
  enabled: boolean;
  qualityChecks: {
    lint: boolean;
    test: boolean;
  };
  conventionalCommits: {
    enabled: boolean;
    typeMapping: Record<string, ConventionalCommitType>;
  };
  coAuthor: string;
}

/**
 * Default commit configuration
 */
export const DEFAULT_COMMIT_CONFIG: CommitConfig = {
  enabled: true,
  qualityChecks: {
    lint: true,
    test: true,
  },
  conventionalCommits: {
    enabled: true,
    typeMapping: {
      create_file: 'feat',
      refactor_file: 'refactor',
      delete_file: 'chore',
      folder: 'chore',
      branch: null,
      pull_request: null,
      validation: null,
      test: 'test',
      conditional_file: 'feat',
    },
  },
  coAuthor: 'Claude <noreply@anthropic.com>',
};

/**
 * Maps step type to conventional commit type
 */
export function mapStepTypeToCommitType(
  stepType: StepType,
  config: CommitConfig = DEFAULT_COMMIT_CONFIG
): ConventionalCommitType {
  return config.conventionalCommits.typeMapping[stepType] || null;
}

/**
 * Generates a conventional commit message
 * @param stepType - Type of step being executed
 * @param description - Step description to use as commit message
 * @param filePath - Optional file path to extract scope from
 * @param config - Optional commit configuration
 * @returns Formatted commit message or null if step shouldn't be committed
 *
 * @example
 * generateCommitMessage('create_file', 'Create Product domain model', 'src/domain/models/product.ts')
 * // Returns: 'feat(domain): create Product domain model\n\n🤖 Generated with Claude Code\n\nCo-Authored-By: Claude <noreply@anthropic.com>'
 */
export function generateCommitMessage(
  stepType: StepType,
  description: string,
  filePath?: string,
  config: CommitConfig = DEFAULT_COMMIT_CONFIG
): string | null {
  if (!config.enabled || !config.conventionalCommits.enabled) {
    return null;
  }

  const commitType = mapStepTypeToCommitType(stepType, config);

  // No commit for certain step types (branch, pull_request, etc)
  if (!commitType) {
    return null;
  }

  // Extract scope from file path
  const scope = filePath ? extractScope(filePath) : 'core';

  // Normalize description: lowercase first letter for conventional commits
  const normalizedDescription = description.charAt(0).toLowerCase() + description.slice(1);

  // Build commit message
  const message = `${commitType}(${scope}): ${normalizedDescription}

🤖 Generated with Claude Code

Co-Authored-By: ${config.coAuthor}`;

  return message;
}

/**
 * Checks if a step type should trigger a commit
 */
export function shouldCommitStep(
  stepType: StepType,
  config: CommitConfig = DEFAULT_COMMIT_CONFIG
): boolean {
  if (!config.enabled || !config.conventionalCommits.enabled) {
    return false;
  }

  const commitType = mapStepTypeToCommitType(stepType, config);
  return commitType !== null;
}

/**
 * Formats a commit message for git commit command
 * Ensures proper escaping for shell execution
 */
export function formatCommitMessageForShell(message: string): string {
  // Escape single quotes and newlines for heredoc
  return message.replace(/'/g, "'\\''");
}

/**
 * Result of quality check execution
 */
export interface QualityCheckResult {
  lint: {
    passed: boolean;
    output?: string;
  };
  test: {
    passed: boolean;
    output?: string;
  };
  overallPassed: boolean;
}

/**
 * Dummy quality check - actual implementation will be in execute-steps.ts
 * This is just the interface
 */
export function createQualityCheckResult(
  lintPassed: boolean,
  testPassed: boolean,
  lintOutput?: string,
  testOutput?: string
): QualityCheckResult {
  return {
    lint: {
      passed: lintPassed,
      output: lintOutput,
    },
    test: {
      passed: testPassed,
      output: testOutput,
    },
    overallPassed: lintPassed && testPassed,
  };
}