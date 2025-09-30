/**
 * Configuration Validator using Zod
 * Provides type-safe validation for execute.yml configuration
 */

import { z } from 'zod';
import type { CommitConfig } from './commit-generator';

/**
 * Zod schema for commit configuration
 */
const CommitTypeEnum = z.enum(['feat', 'fix', 'chore', 'refactor', 'test', 'docs']);

const TypeMappingSchema = z.object({
  create_file: z.union([CommitTypeEnum, z.null()]).optional(),
  refactor_file: z.union([CommitTypeEnum, z.null()]).optional(),
  delete_file: z.union([CommitTypeEnum, z.null()]).optional(),
  folder: z.union([CommitTypeEnum, z.null()]).optional(),
  branch: z.union([CommitTypeEnum, z.null()]).optional(),
  pull_request: z.union([CommitTypeEnum, z.null()]).optional(),
  validation: z.union([CommitTypeEnum, z.null()]).optional(),
  test: z.union([CommitTypeEnum, z.null()]).optional(),
  conditional_file: z.union([CommitTypeEnum, z.null()]).optional(),
});

/**
 * Email regex pattern for co-author validation
 * Format: "Name <email@example.com>"
 */
const EMAIL_PATTERN = /^.+\s+<[^@\s]+@[^@\s]+\.[^@\s]+>$/;

const CommitConfigSchema = z.object({
  commit: z.object({
    enabled: z.boolean().default(true),
    quality_checks: z.object({
      lint: z.boolean().default(true),
      lint_command: z.string().default('lint').optional(),
      test: z.boolean().default(true),
      test_command: z.string().default('test --run').optional(),
    }).default({ lint: true, test: true }),
    conventional_commits: z.object({
      enabled: z.boolean().default(true),
      type_mapping: TypeMappingSchema.optional(),
    }).default({ enabled: true }),
    co_author: z.string()
      .regex(EMAIL_PATTERN, 'Co-author must be in format "Name <email@example.com>"')
      .default('Claude <noreply@anthropic.com>'),
    emoji: z.object({
      enabled: z.boolean().default(true),
      robot: z.string().default('🤖'),
    }).optional(),
    interactive_safety: z.boolean().default(true).optional(),
  }),
});

export type ValidatedConfig = z.infer<typeof CommitConfigSchema>;

/**
 * Validates configuration using Zod schema
 * @param config - Raw configuration object
 * @returns Validation result with typed data or errors
 */
export function validateConfig(config: unknown): {
  success: boolean;
  data?: ValidatedConfig;
  errors?: string[];
} {
  try {
    const result = CommitConfigSchema.safeParse(config);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    } else {
      const errors = result.error.errors.map(err => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });

      return {
        success: false,
        errors,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      errors: [`Validation error: ${error.message}`],
    };
  }
}

/**
 * Validates commit message length and format
 * @param message - Commit message to validate
 * @param maxLength - Maximum allowed length
 * @returns Validation result
 */
export function validateCommitMessage(message: string, maxLength = 500): {
  valid: boolean;
  error?: string;
  truncated?: string;
} {
  if (!message || message.trim().length === 0) {
    return {
      valid: false,
      error: 'Commit message cannot be empty',
    };
  }

  // Extract first line (subject)
  const firstLine = message.split('\n')[0];

  // Check for conventional commit format
  const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/;
  if (!conventionalPattern.test(firstLine)) {
    return {
      valid: false,
      error: 'Commit message must follow conventional commit format: type(scope): description',
    };
  }

  if (firstLine.length > 72) {
    return {
      valid: false,
      error: 'Commit subject line should be 72 characters or less',
      truncated: firstLine.substring(0, 69) + '...',
    };
  }

  if (message.length > maxLength) {
    return {
      valid: false,
      error: `Commit message exceeds maximum length of ${maxLength} characters`,
      truncated: message.substring(0, maxLength - 3) + '...',
    };
  }

  return { valid: true };
}

/**
 * Validates file path for safety
 * Prevents path traversal attacks
 * @param filePath - File path to validate
 * @returns Validation result
 */
export function validateFilePath(filePath: string): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  if (!filePath || filePath.trim().length === 0) {
    return {
      valid: false,
      error: 'File path cannot be empty',
    };
  }

  // Check for path traversal patterns
  const dangerousPatterns = [
    '../',
    '..\\',
    '%2e%2e',
    '%252e%252e',
    '~/',
    '/etc/',
    '/proc/',
    '/sys/',
    'C:\\Windows',
    'C:\\Program Files',
  ];

  const lowerPath = filePath.toLowerCase();
  for (const pattern of dangerousPatterns) {
    if (lowerPath.includes(pattern.toLowerCase())) {
      return {
        valid: false,
        error: `Path contains dangerous pattern: ${pattern}`,
      };
    }
  }

  // Remove any null bytes
  const sanitized = filePath.replace(/\0/g, '');

  // Check for absolute paths (should be relative)
  if (filePath.startsWith('/') || /^[A-Za-z]:/.test(filePath)) {
    return {
      valid: false,
      error: 'Absolute paths are not allowed. Use relative paths only.',
    };
  }

  return {
    valid: true,
    sanitized,
  };
}