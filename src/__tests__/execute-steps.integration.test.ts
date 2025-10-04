/**
 * Integration Tests for Execute Steps with Different Execution Modes
 * Tests that execution options are properly integrated with the EnhancedStepExecutor
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseExecutionOptions } from '../utils/execution-options';

describe('Execute Steps - Execution Options Integration', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.REGENT_NON_INTERACTIVE;
    delete process.env.REGENT_AUTO_CONFIRM;
    delete process.env.REGENT_STRICT;
    delete process.env.CI;
    delete process.env.CLAUDE_CODE;
    delete process.env.AI_ORCHESTRATOR;

    // Mock console to suppress output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Integration with real environment scenarios', () => {
    it('should work in CI environment (CI=true)', () => {
      process.env.CI = 'true';
      const options = parseExecutionOptions({});

      expect(options.nonInteractive).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Running in non-interactive mode')
      );
    });

    it('should work in Claude Code environment', () => {
      process.env.CLAUDE_CODE = '1';
      const options = parseExecutionOptions({});

      expect(options.nonInteractive).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Running in non-interactive mode')
      );
    });

    it('should work in AI Orchestrator environment', () => {
      process.env.AI_ORCHESTRATOR = '1';
      const options = parseExecutionOptions({});

      expect(options.nonInteractive).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Running in non-interactive mode')
      );
    });

    it('should handle strict mode in CI environment', () => {
      process.env.CI = 'true';
      process.env.REGENT_STRICT = '1';
      const options = parseExecutionOptions({});

      expect(options.nonInteractive).toBe(true);
      expect(options.strict).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Strict mode: Will fail on warnings')
      );
    });

    it('should handle auto-confirm in CI environment', () => {
      process.env.CI = 'true';
      process.env.REGENT_AUTO_CONFIRM = '1';
      const options = parseExecutionOptions({});

      expect(options.nonInteractive).toBe(true);
      expect(options.autoConfirm).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Auto-confirm mode: All prompts auto-approved')
      );
    });

    it('should override auto-confirm when strict is set in CI', () => {
      process.env.CI = 'true';
      process.env.REGENT_STRICT = '1';
      process.env.REGENT_AUTO_CONFIRM = '1';
      const options = parseExecutionOptions({});

      expect(options.strict).toBe(true);
      expect(options.autoConfirm).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('--strict overrides --yes flag')
      );
    });
  });

  describe('CLI flag simulation', () => {
    it('should simulate --non-interactive flag', () => {
      const options = parseExecutionOptions({ nonInteractive: true });

      expect(options.nonInteractive).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Running in non-interactive mode')
      );
    });

    it('should simulate --strict flag', () => {
      const options = parseExecutionOptions({
        nonInteractive: true,
        strict: true
      });

      expect(options.strict).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Strict mode: Will fail on warnings')
      );
    });

    it('should simulate --yes flag', () => {
      const options = parseExecutionOptions({
        nonInteractive: true,
        autoConfirm: true
      });

      expect(options.autoConfirm).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Auto-confirm mode: All prompts auto-approved')
      );
    });

    it('should simulate --strict --yes (conflicting flags)', () => {
      const options = parseExecutionOptions({
        nonInteractive: true,
        strict: true,
        autoConfirm: true
      });

      expect(options.strict).toBe(true);
      expect(options.autoConfirm).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('--strict overrides --yes flag')
      );
    });
  });

  describe('Priority hierarchy verification', () => {
    it('should prioritize CLI flags over environment variables', () => {
      // Environment says non-interactive
      process.env.REGENT_NON_INTERACTIVE = '1';

      // But CLI explicitly sets it to false (interactive mode)
      const options = parseExecutionOptions({ nonInteractive: false });

      expect(options.nonInteractive).toBe(false);
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should prioritize CLI strict over environment', () => {
      process.env.REGENT_STRICT = '1';
      const options = parseExecutionOptions({ strict: false });

      expect(options.strict).toBe(false);
    });

    it('should prioritize CLI autoConfirm over environment', () => {
      process.env.REGENT_AUTO_CONFIRM = '1';
      const options = parseExecutionOptions({ autoConfirm: false });

      expect(options.autoConfirm).toBe(false);
    });

    it('should use environment when CLI option is undefined', () => {
      process.env.REGENT_NON_INTERACTIVE = '1';
      process.env.REGENT_STRICT = '1';
      process.env.REGENT_AUTO_CONFIRM = '1';

      const options = parseExecutionOptions({});

      expect(options.nonInteractive).toBe(true);
      expect(options.strict).toBe(true);
      // autoConfirm should be false due to strict override
      expect(options.autoConfirm).toBe(false);
    });
  });
});
