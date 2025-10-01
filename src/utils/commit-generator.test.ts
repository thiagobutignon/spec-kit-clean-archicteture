/**
 * Unit tests for commit-generator utility
 */

import { describe, it, expect } from 'vitest';
import {
  mapStepTypeToCommitType,
  generateCommitMessage,
  shouldCommitStep,
  formatCommitMessageForShell,
  createQualityCheckResult,
  DEFAULT_COMMIT_CONFIG,
  type CommitConfig,
} from './commit-generator';

describe('mapStepTypeToCommitType', () => {
  it('should map create_file to feat', () => {
    expect(mapStepTypeToCommitType('create_file')).toBe('feat');
  });

  it('should map refactor_file to refactor', () => {
    expect(mapStepTypeToCommitType('refactor_file')).toBe('refactor');
  });

  it('should map delete_file to chore', () => {
    expect(mapStepTypeToCommitType('delete_file')).toBe('chore');
  });

  it('should map folder to chore', () => {
    expect(mapStepTypeToCommitType('folder')).toBe('chore');
  });

  it('should map test to test', () => {
    expect(mapStepTypeToCommitType('test')).toBe('test');
  });

  it('should map conditional_file to feat', () => {
    expect(mapStepTypeToCommitType('conditional_file')).toBe('feat');
  });

  it('should return null for branch', () => {
    expect(mapStepTypeToCommitType('branch')).toBe(null);
  });

  it('should return null for pull_request', () => {
    expect(mapStepTypeToCommitType('pull_request')).toBe(null);
  });

  it('should return null for validation', () => {
    expect(mapStepTypeToCommitType('validation')).toBe(null);
  });

  it('should respect custom config mapping', () => {
    const customConfig: CommitConfig = {
      ...DEFAULT_COMMIT_CONFIG,
      conventionalCommits: {
        enabled: true,
        typeMapping: {
          create_file: 'fix', // Custom mapping
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
    };

    expect(mapStepTypeToCommitType('create_file', customConfig)).toBe('fix');
  });
});

describe('generateCommitMessage', () => {
  it('should generate conventional commit for create_file with domain scope', () => {
    const message = generateCommitMessage(
      'create_file',
      'Create Product entity',
      'src/domain/models/product.ts'
    );

    // Description already includes entity name and type, so it won't be enhanced
    expect(message).toBe(
      'feat(domain): create Product entity\n\n🤖 Generated with Claude Code\n\nCo-Authored-By: Claude <noreply@anthropic.com>'
    );
  });

  it('should generate conventional commit for refactor_file with data scope', () => {
    const message = generateCommitMessage(
      'refactor_file',
      'Refactor logic',
      'src/data/usecases/create-user.ts'
    );

    // Should enhance with entity name and type
    expect(message).toContain('refactor(data):');
    expect(message).toContain('🤖 Generated with Claude Code');
  });

  it('should generate conventional commit for delete_file with infra scope', () => {
    const message = generateCommitMessage(
      'delete_file',
      'Remove deprecated adapter',
      'src/infra/cache/old-cache.ts'
    );

    // Should enhance with file type info
    expect(message).toContain('chore(infra):');
    expect(message).toContain('remove deprecated adapter');
  });

  it('should lowercase first letter of description', () => {
    const message = generateCommitMessage(
      'create_file',
      'Add new user validator',
      'src/domain/validators/user-validator.ts'
    );

    expect(message).toContain('feat(domain): add new user validator');
  });

  it('should use core scope when no path provided', () => {
    const message = generateCommitMessage(
      'create_file',
      'Add configuration file'
    );

    expect(message).toContain('feat(core): add configuration file');
  });

  it('should return null for step types that should not commit', () => {
    expect(generateCommitMessage('branch', 'Create feature branch')).toBe(null);
    expect(generateCommitMessage('pull_request', 'Create PR')).toBe(null);
    expect(generateCommitMessage('validation', 'Run validation')).toBe(null);
  });

  it('should return null when commits are disabled in config', () => {
    const disabledConfig: CommitConfig = {
      ...DEFAULT_COMMIT_CONFIG,
      enabled: false,
    };

    const message = generateCommitMessage(
      'create_file',
      'Create file',
      'src/domain/models/user.ts',
      disabledConfig
    );

    expect(message).toBe(null);
  });

  it('should return null when conventional commits are disabled', () => {
    const disabledConfig: CommitConfig = {
      ...DEFAULT_COMMIT_CONFIG,
      conventionalCommits: {
        ...DEFAULT_COMMIT_CONFIG.conventionalCommits,
        enabled: false,
      },
    };

    const message = generateCommitMessage(
      'create_file',
      'Create file',
      'src/domain/models/user.ts',
      disabledConfig
    );

    expect(message).toBe(null);
  });

  it('should use custom co-author from config', () => {
    const customConfig: CommitConfig = {
      ...DEFAULT_COMMIT_CONFIG,
      coAuthor: 'Custom Bot <bot@example.com>',
    };

    const message = generateCommitMessage(
      'create_file',
      'Create file',
      'src/domain/models/user.ts',
      customConfig
    );

    expect(message).toContain('Co-Authored-By: Custom Bot <bot@example.com>');
  });

  it('should extract scope from complex path', () => {
    const message = generateCommitMessage(
      'create_file',
      'Create order entity',
      'product-catalog/src/features/order-management/shared/domain/entities/order.ts'
    );

    expect(message).toContain('feat(domain):');
  });

  it('should handle presentation scope', () => {
    const message = generateCommitMessage(
      'create_file',
      'Create user controller',
      'src/presentation/controllers/user-controller.ts'
    );

    expect(message).toContain('feat(presentation):');
  });

  it('should handle main scope', () => {
    const message = generateCommitMessage(
      'create_file',
      'Create user factory',
      'src/main/factories/user-factory.ts'
    );

    expect(message).toContain('feat(main):');
  });
});

describe('shouldCommitStep', () => {
  it('should return true for create_file', () => {
    expect(shouldCommitStep('create_file')).toBe(true);
  });

  it('should return true for refactor_file', () => {
    expect(shouldCommitStep('refactor_file')).toBe(true);
  });

  it('should return true for delete_file', () => {
    expect(shouldCommitStep('delete_file')).toBe(true);
  });

  it('should return true for test', () => {
    expect(shouldCommitStep('test')).toBe(true);
  });

  it('should return false for branch', () => {
    expect(shouldCommitStep('branch')).toBe(false);
  });

  it('should return false for pull_request', () => {
    expect(shouldCommitStep('pull_request')).toBe(false);
  });

  it('should return false for validation', () => {
    expect(shouldCommitStep('validation')).toBe(false);
  });

  it('should return false when commits disabled', () => {
    const disabledConfig: CommitConfig = {
      ...DEFAULT_COMMIT_CONFIG,
      enabled: false,
    };

    expect(shouldCommitStep('create_file', disabledConfig)).toBe(false);
  });

  it('should return false when conventional commits disabled', () => {
    const disabledConfig: CommitConfig = {
      ...DEFAULT_COMMIT_CONFIG,
      conventionalCommits: {
        ...DEFAULT_COMMIT_CONFIG.conventionalCommits,
        enabled: false,
      },
    };

    expect(shouldCommitStep('create_file', disabledConfig)).toBe(false);
  });
});

describe('formatCommitMessageForShell', () => {
  it('should escape single quotes', () => {
    const message = "feat(domain): add user's profile";
    const formatted = formatCommitMessageForShell(message);

    expect(formatted).toBe("feat(domain): add user'\\''s profile");
  });

  it('should handle multiple single quotes', () => {
    const message = "feat(domain): add user's friend's profile";
    const formatted = formatCommitMessageForShell(message);

    expect(formatted).toBe("feat(domain): add user'\\''s friend'\\''s profile");
  });

  it('should preserve newlines', () => {
    const message = 'feat(domain): add user\n\nDescription here';
    const formatted = formatCommitMessageForShell(message);

    expect(formatted).toContain('\n\n');
  });

  it('should handle empty string', () => {
    expect(formatCommitMessageForShell('')).toBe('');
  });
});

describe('createQualityCheckResult', () => {
  it('should create result with both passing', () => {
    const result = createQualityCheckResult(true, true, 'lint ok', 'test ok');

    expect(result.lint.passed).toBe(true);
    expect(result.test.passed).toBe(true);
    expect(result.overallPassed).toBe(true);
    expect(result.lint.output).toBe('lint ok');
    expect(result.test.output).toBe('test ok');
  });

  it('should create result with lint failing', () => {
    const result = createQualityCheckResult(false, true, 'lint error', 'test ok');

    expect(result.lint.passed).toBe(false);
    expect(result.test.passed).toBe(true);
    expect(result.overallPassed).toBe(false);
  });

  it('should create result with test failing', () => {
    const result = createQualityCheckResult(true, false, 'lint ok', 'test error');

    expect(result.lint.passed).toBe(true);
    expect(result.test.passed).toBe(false);
    expect(result.overallPassed).toBe(false);
  });

  it('should create result with both failing', () => {
    const result = createQualityCheckResult(false, false, 'lint error', 'test error');

    expect(result.lint.passed).toBe(false);
    expect(result.test.passed).toBe(false);
    expect(result.overallPassed).toBe(false);
  });

  it('should handle undefined output', () => {
    const result = createQualityCheckResult(true, true);

    expect(result.lint.output).toBeUndefined();
    expect(result.test.output).toBeUndefined();
    expect(result.overallPassed).toBe(true);
  });
});

describe('DEFAULT_COMMIT_CONFIG', () => {
  it('should have commits enabled by default', () => {
    expect(DEFAULT_COMMIT_CONFIG.enabled).toBe(true);
  });

  it('should have lint enabled by default', () => {
    expect(DEFAULT_COMMIT_CONFIG.qualityChecks.lint).toBe(true);
  });

  it('should have test enabled by default', () => {
    expect(DEFAULT_COMMIT_CONFIG.qualityChecks.test).toBe(true);
  });

  it('should have conventional commits enabled by default', () => {
    expect(DEFAULT_COMMIT_CONFIG.conventionalCommits.enabled).toBe(true);
  });

  it('should have correct type mappings', () => {
    const mappings = DEFAULT_COMMIT_CONFIG.conventionalCommits.typeMapping;

    expect(mappings.create_file).toBe('feat');
    expect(mappings.refactor_file).toBe('refactor');
    expect(mappings.delete_file).toBe('chore');
    expect(mappings.folder).toBe('chore');
    expect(mappings.test).toBe('test');
    expect(mappings.branch).toBe(null);
    expect(mappings.pull_request).toBe(null);
  });

  it('should have default co-author', () => {
    expect(DEFAULT_COMMIT_CONFIG.coAuthor).toBe('Claude <noreply@anthropic.com>');
  });
});