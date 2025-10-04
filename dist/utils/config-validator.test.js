/**
 * Unit tests for config-validator
 */
import { describe, it, expect } from 'vitest';
import { validateConfig, validateCommitMessage } from './config-validator';
describe('validateConfig', () => {
    it('should validate correct configuration', () => {
        const config = {
            commit: {
                enabled: true,
                quality_checks: {
                    lint: true,
                    test: true,
                },
                conventional_commits: {
                    enabled: true,
                    type_mapping: {
                        create_file: 'feat',
                        refactor_file: 'refactor',
                    },
                },
                co_author: 'Test <test@example.com>',
            },
        };
        const result = validateConfig(config);
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
    });
    it('should reject invalid configuration', () => {
        const config = {
            commit: {
                enabled: 'yes', // Should be boolean
                quality_checks: {
                    lint: true,
                    test: true,
                },
            },
        };
        const result = validateConfig(config);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
    });
    it('should reject configuration without commit field', () => {
        const config = {};
        const result = validateConfig(config);
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
    });
    it('should accept null values for type mappings', () => {
        const config = {
            commit: {
                enabled: true,
                quality_checks: {
                    lint: true,
                    test: true,
                },
                conventional_commits: {
                    enabled: true,
                    type_mapping: {
                        branch: null,
                        validation: null,
                    },
                },
            },
        };
        const result = validateConfig(config);
        expect(result.success).toBe(true);
    });
    it('should reject invalid commit types', () => {
        const config = {
            commit: {
                enabled: true,
                conventional_commits: {
                    enabled: true,
                    type_mapping: {
                        create_file: 'invalid-type',
                    },
                },
            },
        };
        const result = validateConfig(config);
        expect(result.success).toBe(false);
    });
});
describe('validateCommitMessage', () => {
    it('should validate valid commit message', () => {
        const message = 'feat(domain): add user entity';
        const result = validateCommitMessage(message);
        expect(result.valid).toBe(true);
    });
    it('should reject empty commit message', () => {
        const result = validateCommitMessage('');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('empty');
    });
    it('should reject commit message with long subject', () => {
        const longSubject = 'feat(domain): ' + 'a'.repeat(100);
        const result = validateCommitMessage(longSubject);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('72 characters');
        expect(result.truncated).toBeDefined();
    });
    it('should reject commit message exceeding max length', () => {
        const longMessage = 'feat(domain): short subject\n\n' + 'a'.repeat(1000);
        const result = validateCommitMessage(longMessage, 500);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('exceeds maximum length');
        expect(result.truncated).toBeDefined();
    });
    it('should validate multi-line commit message', () => {
        const message = `feat(domain): add user entity

This commit adds a new User entity to the domain layer.
It includes validation and business rules.`;
        const result = validateCommitMessage(message);
        expect(result.valid).toBe(true);
    });
});
