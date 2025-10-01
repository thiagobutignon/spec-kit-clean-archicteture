import { describe, it, expect } from 'vitest';
import {
  resolveLogDirectory,
  resolveDebugDirectory,
  resolveRLHFDirectory
} from './log-path-resolver';

describe('Log Path Resolver', () => {
  describe('resolveLogDirectory', () => {
    it('should resolve spec structure paths correctly', () => {
      const result = resolveLogDirectory('spec/001-user-registration/domain/implementation.yaml');
      expect(result).toBe('spec/001-user-registration/logs');
    });

    it('should handle spec paths with multiple digits', () => {
      const result = resolveLogDirectory('spec/1234-complex-feature/domain/implementation.yaml');
      expect(result).toBe('spec/1234-complex-feature/logs');
    });

    it('should handle spec paths with subdirectory', () => {
      const result = resolveLogDirectory('spec/001-user-registration/domain/implementation.yaml', 'validation');
      expect(result).toBe('spec/001-user-registration/logs/validation');
    });

    it('should fallback to legacy structure for non-spec paths', () => {
      const result = resolveLogDirectory('/home/user/project/implementation.yaml');
      expect(result).toBe('/home/user/project/.logs/implementation');
    });

    it('should fallback to legacy structure with subdirectory', () => {
      const result = resolveLogDirectory('/home/user/project/implementation.yaml', 'validation');
      expect(result).toBe('/home/user/project/.logs/implementation/validation');
    });

    it('should throw error for empty context path', () => {
      expect(() => resolveLogDirectory('')).toThrow('Context path is required for resolveLogDirectory');
    });

    it('should throw error for null context path', () => {
      expect(() => resolveLogDirectory(null as unknown as string)).toThrow('Context path is required for resolveLogDirectory');
    });

    it('should throw error for non-string context path', () => {
      expect(() => resolveLogDirectory(123 as unknown as string)).toThrow('Context path must be a string, received: number');
    });

    it('should handle spec paths with hyphens and underscores in feature name', () => {
      const result = resolveLogDirectory('spec/001-user_registration-v2/domain/implementation.yaml');
      expect(result).toBe('spec/001-user_registration-v2/logs');
    });
  });

  describe('resolveDebugDirectory', () => {
    it('should resolve spec structure paths correctly', () => {
      const result = resolveDebugDirectory('spec/002-payment-processing/domain/implementation.yaml');
      expect(result).toBe('spec/002-payment-processing/debug');
    });

    it('should handle spec paths with subdirectory', () => {
      const result = resolveDebugDirectory('spec/002-payment-processing/domain/implementation.yaml', 'validation');
      expect(result).toBe('spec/002-payment-processing/debug/validation');
    });

    it('should fallback to legacy structure for non-spec paths', () => {
      const result = resolveDebugDirectory('/home/user/project/implementation.yaml');
      expect(result).toBe('/home/user/project/.debug/implementation');
    });

    it('should throw error for empty context path', () => {
      expect(() => resolveDebugDirectory('')).toThrow('Context path is required for resolveDebugDirectory');
    });

    it('should throw error for null context path', () => {
      expect(() => resolveDebugDirectory(null as unknown as string)).toThrow('Context path is required for resolveDebugDirectory');
    });

    it('should throw error for non-string context path', () => {
      expect(() => resolveDebugDirectory({} as unknown as string)).toThrow('Context path must be a string, received: object');
    });
  });

  describe('resolveRLHFDirectory', () => {
    it('should resolve spec structure paths correctly', () => {
      const result = resolveRLHFDirectory('spec/003-authentication/domain/implementation.yaml');
      expect(result).toBe('spec/003-authentication/metrics');
    });

    it('should handle spec paths with multiple digits', () => {
      const result = resolveRLHFDirectory('spec/9999-final-feature/domain/implementation.yaml');
      expect(result).toBe('spec/9999-final-feature/metrics');
    });

    it('should fallback to legacy structure for non-spec paths', () => {
      const result = resolveRLHFDirectory('/home/user/project/implementation.yaml');
      expect(result).toBe('.rlhf');
    });

    it('should fallback to legacy structure when no context path provided', () => {
      const result = resolveRLHFDirectory();
      expect(result).toBe('.rlhf');
    });

    it('should throw error for non-string context path', () => {
      expect(() => resolveRLHFDirectory([] as unknown as string)).toThrow('Context path must be a string, received: object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested spec paths', () => {
      const result = resolveLogDirectory('/very/deep/path/spec/456-nested-feature/domain/subdomain/implementation.yaml');
      expect(result).toBe('spec/456-nested-feature/logs');
    });

    it('should not match invalid spec patterns', () => {
      const result = resolveLogDirectory('spec/abc-invalid-number/domain/implementation.yaml');
      expect(result).toBe('spec/abc-invalid-number/domain/.logs/implementation');
    });

    it('should not match spec without feature name', () => {
      const result = resolveLogDirectory('spec/001/domain/implementation.yaml');
      expect(result).toBe('spec/001/domain/.logs/implementation');
    });

    it('should handle paths with spec in the middle', () => {
      const result = resolveLogDirectory('/project/spec/123-feature/domain/implementation.yaml');
      expect(result).toBe('spec/123-feature/logs');
    });
  });
});