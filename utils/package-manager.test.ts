/**
 * Unit tests for package-manager utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeScriptName,
  buildPackageManagerCommand,
  clearPackageManagerCache,
} from './package-manager';

describe('sanitizeScriptName', () => {
  it('should allow valid script names', () => {
    expect(sanitizeScriptName('test')).toBe('test');
    expect(sanitizeScriptName('test-unit')).toBe('test-unit');
    expect(sanitizeScriptName('test:unit')).toBe('test:unit');
    expect(sanitizeScriptName('test_unit')).toBe('test_unit');
  });

  it('should remove dangerous characters', () => {
    expect(sanitizeScriptName('test; rm -rf /')).toBe('test rm -rf ');
    expect(sanitizeScriptName('test && echo pwned')).toBe('test  echo pwned');
    expect(sanitizeScriptName('test | cat /etc/passwd')).toBe('test  cat etcpasswd');
    expect(sanitizeScriptName('test`whoami`')).toBe('testwhoami');
    expect(sanitizeScriptName('test$(whoami)')).toBe('testwhoami');
  });

  it('should handle script names with spaces', () => {
    expect(sanitizeScriptName('test --run')).toBe('test --run');
    expect(sanitizeScriptName('test   --coverage')).toBe('test   --coverage');
  });
});

describe('buildPackageManagerCommand', () => {
  beforeEach(() => {
    clearPackageManagerCache();
  });

  it('should build npm command correctly', () => {
    const result = buildPackageManagerCommand('npm', 'test');
    expect(result.command).toBe('npm');
    expect(result.args).toEqual(['run', 'test']);
  });

  it('should build yarn command correctly', () => {
    const result = buildPackageManagerCommand('yarn', 'test');
    expect(result.command).toBe('yarn');
    expect(result.args).toEqual(['test']);
  });

  it('should build pnpm command correctly', () => {
    const result = buildPackageManagerCommand('pnpm', 'test');
    expect(result.command).toBe('pnpm');
    expect(result.args).toEqual(['test']);
  });

  it('should handle script with arguments', () => {
    const result = buildPackageManagerCommand('npm', 'test --coverage');
    expect(result.command).toBe('npm');
    expect(result.args).toEqual(['run', 'test', '--coverage']);
  });

  it('should sanitize dangerous script names', () => {
    const result = buildPackageManagerCommand('npm', 'test; rm -rf /');
    expect(result.args).not.toContain(';');
    // The dangerous characters are removed, but text remains
    const joinedArgs = result.args.join(' ');
    expect(joinedArgs).not.toContain(';');
    expect(joinedArgs).toContain('test');
  });
});