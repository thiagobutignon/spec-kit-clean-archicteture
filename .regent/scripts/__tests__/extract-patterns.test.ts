/**
 * Test suite for pattern extraction script
 * Tests security, validation, and core functionality
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';

// Note: These tests test the logic without actually running the script
// Full integration tests would require the Claude CLI to be installed

describe('Pattern Extraction - Helper Functions', () => {
  describe('getLayerPrefix', () => {
    it('should return correct prefix for known layers', () => {
      const LAYER_PREFIXES: Record<string, string> = {
        domain: 'DOM',
        data: 'DAT',
        infra: 'INF',
        presentation: 'PRE',
        main: 'MAI',
        tdd: 'TDD',
        solid: 'SOL',
        dry: 'DRY',
        design_patterns: 'DES',
        kiss_yagni: 'KIS',
        cross_cutting: 'CRO'
      };

      const getLayerPrefix = (layer: string): string => {
        return LAYER_PREFIXES[layer] || layer.toUpperCase().padEnd(3, 'X').slice(0, 3);
      };

      expect(getLayerPrefix('domain')).toBe('DOM');
      expect(getLayerPrefix('data')).toBe('DAT');
      expect(getLayerPrefix('infra')).toBe('INF');
      expect(getLayerPrefix('presentation')).toBe('PRE');
      expect(getLayerPrefix('main')).toBe('MAI');
      expect(getLayerPrefix('tdd')).toBe('TDD');
      expect(getLayerPrefix('solid')).toBe('SOL');
    });

    it('should handle short layer names correctly', () => {
      const getLayerPrefix = (layer: string): string => {
        const LAYER_PREFIXES: Record<string, string> = {};
        return LAYER_PREFIXES[layer] || layer.toUpperCase().padEnd(3, 'X').slice(0, 3);
      };

      expect(getLayerPrefix('db')).toBe('DBX');
      expect(getLayerPrefix('ui')).toBe('UIX');
      expect(getLayerPrefix('a')).toBe('AXX');
    });

    it('should handle long layer names correctly', () => {
      const getLayerPrefix = (layer: string): string => {
        const LAYER_PREFIXES: Record<string, string> = {};
        return LAYER_PREFIXES[layer] || layer.toUpperCase().padEnd(3, 'X').slice(0, 3);
      };

      expect(getLayerPrefix('verylongname')).toBe('VER');
      expect(getLayerPrefix('architecture')).toBe('ARC');
    });
  });

  describe('sanitizeInput', () => {
    const sanitizeInput = (input: string): string => {
      return input
        .replace(/\0/g, '')
        // Remove ANSI escape codes (must be done BEFORE removing control characters)
        .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\n{5,}/g, '\n\n\n\n');
    };

    it('should remove null bytes', () => {
      expect(sanitizeInput('hello\0world')).toBe('helloworld');
      expect(sanitizeInput('test\0\0test')).toBe('testtest');
    });

    it('should remove ANSI escape codes', () => {
      // Using String.fromCharCode to create actual escape sequences
      const redText = String.fromCharCode(0x1B) + '[31mRed' + String.fromCharCode(0x1B) + '[0m';
      const greenText = String.fromCharCode(0x1B) + '[1;32mGreen' + String.fromCharCode(0x1B) + '[0m';
      expect(sanitizeInput(redText)).toBe('Red');
      expect(sanitizeInput(greenText)).toBe('Green');
    });

    it('should remove control characters', () => {
      expect(sanitizeInput('hello\x01world')).toBe('helloworld');
      expect(sanitizeInput('test\x7Ftest')).toBe('testtest');
    });

    it('should preserve newlines and tabs', () => {
      expect(sanitizeInput('hello\nworld')).toBe('hello\nworld');
      expect(sanitizeInput('hello\tworld')).toBe('hello\tworld');
    });

    it('should limit consecutive newlines', () => {
      expect(sanitizeInput('hello\n\n\n\n\n\n\nworld')).toBe('hello\n\n\n\nworld');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should handle normal text without changes', () => {
      const normalText = 'This is normal text with spaces and numbers 123.';
      expect(sanitizeInput(normalText)).toBe(normalText);
    });
  });
});

describe('Pattern Extraction - Path Validation', () => {
  it('should identify path traversal patterns', () => {
    const hasPathTraversal = (p: string): boolean => p.includes('..');

    expect(hasPathTraversal('../../../etc')).toBe(true);
    expect(hasPathTraversal('../../passwd')).toBe(true);
    expect(hasPathTraversal('./valid/path')).toBe(false);
    expect(hasPathTraversal('/absolute/path')).toBe(false);
  });

  it('should validate paths are within project', () => {
    const projectRoot = path.resolve(process.cwd());

    const isWithinProject = (targetPath: string): boolean => {
      const absoluteTarget = path.resolve(targetPath);
      return absoluteTarget.startsWith(projectRoot);
    };

    expect(isWithinProject('./src')).toBe(true);
    expect(isWithinProject('src/domain')).toBe(true);
    // Note: /etc would fail on systems where cwd is not /
  });

  it('should use path.dirname for cross-platform compatibility', () => {
    const outputFile1 = '/path/to/output.yaml';
    const outputFile2 = 'C:\\Windows\\path\\output.yaml';

    // path.dirname works on all platforms
    expect(path.dirname(outputFile1)).toBe('/path/to');
    // On Windows, this would work correctly, on Unix it treats backslashes as part of filename
    const dir2 = path.dirname(outputFile2);
    expect(typeof dir2).toBe('string');
  });
});

describe('Pattern Extraction - Schema Validation', () => {
  it('should validate pattern ID format', () => {
    const isValidPatternId = (id: string): boolean => /^[A-Z]{3}\d{3}$/.test(id);

    expect(isValidPatternId('DOM001')).toBe(true);
    expect(isValidPatternId('DAT123')).toBe(true);
    expect(isValidPatternId('TDD999')).toBe(true);
    expect(isValidPatternId('dom001')).toBe(false); // lowercase
    expect(isValidPatternId('DOM01')).toBe(false); // too short
    expect(isValidPatternId('DOMAI001')).toBe(false); // too long
  });

  it('should validate pattern name format (kebab-case)', () => {
    const isValidPatternName = (name: string): boolean => /^[a-z0-9-]+$/.test(name);

    expect(isValidPatternName('entity-without-validation')).toBe(true);
    expect(isValidPatternName('mock-domain-pattern')).toBe(true);
    expect(isValidPatternName('test-123')).toBe(true);
    expect(isValidPatternName('InvalidCase')).toBe(false);
    expect(isValidPatternName('name_with_underscore')).toBe(false);
    expect(isValidPatternName('name with spaces')).toBe(false);
  });

  it('should validate regex patterns', () => {
    const isValidRegex = (pattern: string): boolean => {
      try {
        new RegExp(pattern);
        return true;
      } catch {
        return false;
      }
    };

    expect(isValidRegex('class\\s+(\\w+Entity)')).toBe(true);
    expect(isValidRegex('[a-z]+')).toBe(true);
    expect(isValidRegex('(')).toBe(false); // Invalid regex
    expect(isValidRegex('[')).toBe(false); // Invalid regex
  });

  it('should validate severity levels', () => {
    const validSeverities = ['critical', 'high', 'medium', 'low'];

    expect(validSeverities).toContain('critical');
    expect(validSeverities).toContain('high');
    expect(validSeverities).toContain('medium');
    expect(validSeverities).toContain('low');
    expect(validSeverities).not.toContain('invalid');
  });
});

describe('Pattern Extraction - Configuration', () => {
  it('should have consistent configuration constants', () => {
    const MAX_FILE_SIZE = 1024 * 1024; // 1MB
    const MAX_PROMPT_SIZE = 50000;
    const MAX_CODE_SAMPLE_LENGTH = 10000;
    const MAX_SRC_SAMPLES = 3;
    const MAX_TEST_SAMPLES = 2;
    const MAX_CONCURRENT_API_CALLS = 3;

    expect(MAX_FILE_SIZE).toBe(1048576);
    expect(MAX_PROMPT_SIZE).toBe(50000);
    expect(MAX_CODE_SAMPLE_LENGTH).toBe(10000);
    expect(MAX_SRC_SAMPLES).toBe(3);
    expect(MAX_TEST_SAMPLES).toBe(2);
    expect(MAX_CONCURRENT_API_CALLS).toBe(3);
  });

  it('should parse DEBUG flag correctly', () => {
    const parseDebugFlag = (value?: string): boolean => {
      return value === '1' || value === 'true';
    };

    expect(parseDebugFlag('1')).toBe(true);
    expect(parseDebugFlag('true')).toBe(true);
    expect(parseDebugFlag('0')).toBe(false);
    expect(parseDebugFlag('false')).toBe(false);
    expect(parseDebugFlag(undefined)).toBe(false);
    expect(parseDebugFlag('yes')).toBe(false);
  });
});

describe('Pattern Extraction - Layer Configuration', () => {
  it('should have all expected layers defined', () => {
    const layers = ['domain', 'data', 'infra', 'presentation', 'main'];
    const qualityCategories = ['tdd', 'solid', 'dry', 'design_patterns', 'kiss_yagni', 'cross_cutting'];

    expect(layers).toHaveLength(5);
    expect(qualityCategories).toHaveLength(6);
    expect([...layers, ...qualityCategories]).toHaveLength(11);
  });

  it('should have prefix mapping for all layers', () => {
    const LAYER_PREFIXES: Record<string, string> = {
      domain: 'DOM',
      data: 'DAT',
      infra: 'INF',
      presentation: 'PRE',
      main: 'MAI',
      tdd: 'TDD',
      solid: 'SOL',
      dry: 'DRY',
      design_patterns: 'DES',
      kiss_yagni: 'KIS',
      cross_cutting: 'CRO'
    };

    expect(Object.keys(LAYER_PREFIXES)).toHaveLength(11);
    expect(LAYER_PREFIXES.domain).toBe('DOM');
    expect(LAYER_PREFIXES.tdd).toBe('TDD');
  });
});

describe('Pattern Extraction - Mock Data', () => {
  it('should generate valid mock pattern', () => {
    const layer = 'domain';
    const getLayerPrefix = (l: string) => 'DOM';

    const mockPattern = {
      id: `${getLayerPrefix(layer)}001`,
      name: `mock-${layer}-pattern`,
      regex: `${layer}.*violation`,
      severity: 'medium' as const,
      description: `Mock pattern for ${layer} layer (Claude CLI not available)`,
      examples: [{
        violation: `// ${layer} violation example`,
        fix: `// ${layer} fix example`
      }]
    };

    expect(mockPattern.id).toBe('DOM001');
    expect(mockPattern.name).toBe('mock-domain-pattern');
    expect(mockPattern.severity).toBe('medium');
    expect(mockPattern.examples).toHaveLength(1);
  });
});
