/**
 * Unit tests for execution-options utilities
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { parseExecutionOptions } from './execution-options';
import { cleanupExecutionEnvVars } from '../__tests__/helpers/env-cleanup';

describe('parseExecutionOptions', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    cleanupExecutionEnvVars();

    // Mock console methods to suppress output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Clean env vars in afterEach too for safety
    cleanupExecutionEnvVars();

    vi.restoreAllMocks();
  });

  describe('CLI flag priority', () => {
    it('should prioritize CLI flags over environment variables', () => {
      process.env.REGENT_NON_INTERACTIVE = '1';
      const options = parseExecutionOptions({ nonInteractive: false });
      expect(options.nonInteractive).toBe(false);
    });

    it('should prioritize CLI autoConfirm flag over env var', () => {
      process.env.REGENT_AUTO_CONFIRM = '1';
      const options = parseExecutionOptions({ autoConfirm: false });
      expect(options.autoConfirm).toBe(false);
    });

    it('should prioritize CLI strict flag over env var', () => {
      process.env.REGENT_STRICT = '1';
      const options = parseExecutionOptions({ strict: false });
      expect(options.strict).toBe(false);
    });
  });

  describe('Environment variable detection', () => {
    it('should detect REGENT_NON_INTERACTIVE=1', () => {
      process.env.REGENT_NON_INTERACTIVE = '1';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect REGENT_NON_INTERACTIVE=true', () => {
      process.env.REGENT_NON_INTERACTIVE = 'true';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect REGENT_NON_INTERACTIVE=True (case-insensitive)', () => {
      process.env.REGENT_NON_INTERACTIVE = 'True';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect REGENT_NON_INTERACTIVE=TRUE (case-insensitive)', () => {
      process.env.REGENT_NON_INTERACTIVE = 'TRUE';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect REGENT_NON_INTERACTIVE=yes', () => {
      process.env.REGENT_NON_INTERACTIVE = 'yes';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect REGENT_NON_INTERACTIVE=YES (case-insensitive)', () => {
      process.env.REGENT_NON_INTERACTIVE = 'YES';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect REGENT_NON_INTERACTIVE=on', () => {
      process.env.REGENT_NON_INTERACTIVE = 'on';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect REGENT_NON_INTERACTIVE=ON (case-insensitive)', () => {
      process.env.REGENT_NON_INTERACTIVE = 'ON';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect CI=true', () => {
      process.env.CI = 'true';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect CLAUDE_CODE environment', () => {
      process.env.CLAUDE_CODE = 'some-value';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect AI_ORCHESTRATOR environment', () => {
      process.env.AI_ORCHESTRATOR = 'some-value';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBe(true);
    });

    it('should detect REGENT_AUTO_CONFIRM=1', () => {
      process.env.REGENT_AUTO_CONFIRM = '1';
      const options = parseExecutionOptions({});
      expect(options.autoConfirm).toBe(true);
    });

    it('should detect REGENT_AUTO_CONFIRM=true', () => {
      process.env.REGENT_AUTO_CONFIRM = 'true';
      const options = parseExecutionOptions({});
      expect(options.autoConfirm).toBe(true);
    });

    it('should detect REGENT_STRICT=1', () => {
      process.env.REGENT_STRICT = '1';
      const options = parseExecutionOptions({});
      expect(options.strict).toBe(true);
    });

    it('should detect REGENT_STRICT=true', () => {
      process.env.REGENT_STRICT = 'true';
      const options = parseExecutionOptions({});
      expect(options.strict).toBe(true);
    });

    it('should not set nonInteractive for other CI values', () => {
      process.env.CI = 'false';
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBeFalsy();
    });

    it('should not set autoConfirm for other values', () => {
      process.env.REGENT_AUTO_CONFIRM = 'false';
      const options = parseExecutionOptions({});
      expect(options.autoConfirm).toBeFalsy();
    });
  });

  describe('Conflicting flags validation', () => {
    it('should override autoConfirm when strict is set', () => {
      const options = parseExecutionOptions({ strict: true, autoConfirm: true });
      expect(options.strict).toBe(true);
      expect(options.autoConfirm).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('--strict overrides --yes flag')
      );
    });

    it('should override autoConfirm when strict is from env', () => {
      process.env.REGENT_STRICT = '1';
      const options = parseExecutionOptions({ autoConfirm: true });
      expect(options.strict).toBe(true);
      expect(options.autoConfirm).toBe(false);
    });

    it('should allow autoConfirm when strict is false', () => {
      const options = parseExecutionOptions({ strict: false, autoConfirm: true });
      expect(options.autoConfirm).toBe(true);
    });

    it('should allow autoConfirm when strict is not set', () => {
      const options = parseExecutionOptions({ autoConfirm: true });
      expect(options.autoConfirm).toBe(true);
    });
  });

  describe('Logging behavior', () => {
    it('should log non-interactive mode', () => {
      parseExecutionOptions({ nonInteractive: true });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Running in non-interactive mode')
      );
    });

    it('should log strict mode when non-interactive', () => {
      parseExecutionOptions({ nonInteractive: true, strict: true });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Strict mode: Will fail on warnings')
      );
    });

    it('should log auto-confirm mode when non-interactive', () => {
      parseExecutionOptions({ nonInteractive: true, autoConfirm: true });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Auto-confirm mode: All prompts auto-approved')
      );
    });

    it('should not log when interactive', () => {
      parseExecutionOptions({ nonInteractive: false });
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('Default behavior', () => {
    it('should return empty options when nothing is set', () => {
      const options = parseExecutionOptions({});
      expect(options.nonInteractive).toBeFalsy();
      expect(options.autoConfirm).toBeFalsy();
      expect(options.strict).toBeFalsy();
    });

    it('should preserve CLI flags when no env vars are set', () => {
      const options = parseExecutionOptions({
        nonInteractive: true,
        autoConfirm: true,
        strict: true,
      });
      // autoConfirm should be overridden by strict
      expect(options.nonInteractive).toBe(true);
      expect(options.strict).toBe(true);
      expect(options.autoConfirm).toBe(false);
    });
  });
});
