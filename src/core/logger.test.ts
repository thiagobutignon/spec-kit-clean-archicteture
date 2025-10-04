import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import Logger, { LogLevel, type LoggerOptions } from './logger';
import os from 'os';

describe('Logger', () => {
  let tempDir: string;
  let logger: Logger;

  beforeEach(() => {
    // Create a temporary directory for logs
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logger-test-'));
  });

  afterEach(async () => {
    // Clean up
    if (logger) {
      logger.close();
      // Wait a bit for the stream to close
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    // Remove temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // Helper to flush logs and read content
  const getLogContent = async (): Promise<string> => {
    // Flush the stream and wait for it
    if (logger && logger['logStream']) {
      await new Promise<void>((resolve) => {
        const stream = logger['logStream'];
        if (stream.writableEnded || stream.closed) {
          resolve();
        } else {
          stream.once('drain', () => resolve());
          stream.write('', () => resolve());
        }
      });
    }

    const logPath = path.join(tempDir, 'execution.log');
    if (!fs.existsSync(logPath)) {
      return '';
    }
    return fs.readFileSync(logPath, 'utf-8');
  };

  describe('Constructor', () => {
    it('should create logger with string path (backward compatibility)', async () => {
      logger = new Logger(tempDir);
      expect(logger).toBeDefined();
      // Log something to create the file
      logger.info('test');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(fs.existsSync(path.join(tempDir, 'execution.log'))).toBe(true);
    });

    it('should create logger with options object', () => {
      const options: LoggerOptions = {
        logDirectory: tempDir,
        verbose: true,
        quiet: false,
        showTimestamp: true,
        timestampFormat: 'iso',
        colorize: false,
        logLevel: LogLevel.DEBUG,
      };
      logger = new Logger(options);
      expect(logger).toBeDefined();
    });

    it('should respect LOG_VERBOSE environment variable', () => {
      process.env.LOG_VERBOSE = 'true';
      logger = new Logger({ logDirectory: tempDir });
      // Logger should be in verbose mode
      delete process.env.LOG_VERBOSE;
    });

    it('should respect LOG_QUIET environment variable', () => {
      process.env.LOG_QUIET = 'true';
      logger = new Logger({ logDirectory: tempDir });
      // Logger should be in quiet mode
      delete process.env.LOG_QUIET;
    });
  });

  describe('Log Levels', () => {
    beforeEach(() => {
      logger = new Logger({
        logDirectory: tempDir,
        colorize: false,
        showTimestamp: false,
        logLevel: LogLevel.DEBUG, // Set to DEBUG to allow all log levels
      });
    });

    it('should write debug messages', async () => {
      logger.debug('Debug message');
      const logContent = await getLogContent();
      expect(logContent).toContain('[DEBUG] Debug message');
    });

    it('should write info messages', async () => {
      logger.info('Info message');
      const logContent = await getLogContent();
      expect(logContent).toContain('[INFO] Info message');
    });

    it('should write warn messages', async () => {
      logger.warn('Warning message');
      const logContent = await getLogContent();
      expect(logContent).toContain('[WARN] Warning message');
    });

    it('should write error messages', async () => {
      logger.error('Error message');
      const logContent = await getLogContent();
      expect(logContent).toContain('[ERROR] Error message');
    });

    it('should write success messages', async () => {
      logger.success('Success message');
      const logContent = await getLogContent();
      expect(logContent).toContain('[SUCCESS] Success message');
    });

    it('should support legacy log method', async () => {
      logger.log('Legacy log message');
      const logContent = await getLogContent();
      expect(logContent).toContain('[INFO] Legacy log message');
    });
  });

  describe('Structured Context', () => {
    beforeEach(() => {
      logger = new Logger({
        logDirectory: tempDir,
        verbose: true,
        colorize: false,
        showTimestamp: false,
      });
    });

    it('should log with context', async () => {
      logger.info('Processing step', {
        stepId: 'step-1',
        layer: 'domain',
        action: 'create_file',
      });
      const logContent = await getLogContent();
      expect(logContent).toContain('step=step-1');
      expect(logContent).toContain('layer=domain');
      expect(logContent).toContain('action=create_file');
    });

    it('should handle custom context properties', async () => {
      logger.info('Custom context', {
        customProp: 'value',
        nested: { key: 'value' },
      });
      const logContent = await getLogContent();
      expect(logContent).toContain('customProp');
    });
  });

  describe('Timestamp Formats', () => {
    it('should format ISO timestamps', async () => {
      logger = new Logger({
        logDirectory: tempDir,
        timestampFormat: 'iso',
        colorize: false,
      });
      logger.info('Test message');
      const logContent = await getLogContent();
      expect(logContent).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should format relative timestamps', async () => {
      logger = new Logger({
        logDirectory: tempDir,
        timestampFormat: 'relative',
        colorize: false,
      });
      logger.info('Test message');
      const logContent = await getLogContent();
      expect(logContent).toMatch(/\[\+\d+\.\d+s\]/);
    });

    it('should format elapsed timestamps', async () => {
      logger = new Logger({
        logDirectory: tempDir,
        timestampFormat: 'elapsed',
        colorize: false,
      });
      logger.info('Test message');
      const logContent = await getLogContent();
      expect(logContent).toMatch(/\[\d{2}:\d{2}:\d{2}\]/);
    });

    it('should hide timestamps when showTimestamp is false', async () => {
      logger = new Logger({
        logDirectory: tempDir,
        showTimestamp: false,
        colorize: false,
      });
      logger.info('Test message');
      const logContent = await getLogContent();
      expect(logContent).not.toMatch(/\[.*\d.*\]/);
    });
  });

  describe('Step Tracking', () => {
    beforeEach(() => {
      logger = new Logger({
        logDirectory: tempDir,
        colorize: false,
        showTimestamp: false,
        quiet: true, // Quiet mode to avoid console output in tests
      });
    });

    it('should track step start', () => {
      logger.startStep('step-1', 'Test step', 'domain');
      const summary = logger.getExecutionSummary();
      expect(summary.totalSteps).toBe(1);
    });

    it('should track successful step completion', () => {
      logger.startStep('step-1', 'Test step');
      logger.completeStep('step-1', true);
      const summary = logger.getExecutionSummary();
      expect(summary.completedSteps).toBe(1);
      expect(summary.failedSteps).toBe(0);
    });

    it('should track failed step completion', () => {
      logger.startStep('step-1', 'Test step');
      logger.completeStep('step-1', false);
      const summary = logger.getExecutionSummary();
      expect(summary.completedSteps).toBe(0);
      expect(summary.failedSteps).toBe(1);
    });

    it('should calculate average duration', () => {
      logger.startStep('step-1', 'Test step');
      logger.completeStep('step-1', true);
      const summary = logger.getExecutionSummary();
      expect(summary.averageStepDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Quality Check Logging', () => {
    beforeEach(() => {
      logger = new Logger({
        logDirectory: tempDir,
        colorize: false,
        quiet: true,
      });
    });

    it('should track passed quality checks', () => {
      logger.logQualityCheck('Lint', true);
      const summary = logger.getExecutionSummary();
      expect(summary.qualityChecks.passed).toBe(1);
    });

    it('should track failed quality checks', () => {
      logger.logQualityCheck('Tests', false, '3 tests failed');
      const summary = logger.getExecutionSummary();
      expect(summary.qualityChecks.failed).toBe(1);
    });

    it('should track multiple quality checks', () => {
      logger.logQualityCheck('Lint', true);
      logger.logQualityCheck('Tests', true);
      logger.logQualityCheck('Build', false);
      const summary = logger.getExecutionSummary();
      expect(summary.qualityChecks.passed).toBe(2);
      expect(summary.qualityChecks.failed).toBe(1);
    });
  });

  describe('RLHF Score Tracking', () => {
    beforeEach(() => {
      logger = new Logger({
        logDirectory: tempDir,
        colorize: false,
        quiet: true,
      });
    });

    it('should track RLHF scores', () => {
      logger.startStep('step-1', 'Test step');
      logger.completeStep('step-1', true);
      logger.logRLHFScore(1, 'Test breakdown');

      const summary = logger.getExecutionSummary();
      expect(summary.rlhfScore.total).toBe(1);
      expect(summary.rlhfScore.average).toBe(1);
    });

    it('should calculate average RLHF score', () => {
      logger.startStep('step-1', 'Test step 1');
      logger.completeStep('step-1', true);
      logger.logRLHFScore(2, 'Perfect');

      logger.startStep('step-2', 'Test step 2');
      logger.completeStep('step-2', true);
      logger.logRLHFScore(1, 'Good');

      const summary = logger.getExecutionSummary();
      expect(summary.rlhfScore.average).toBe(1.5);
    });

    it('should track score breakdown', () => {
      logger.startStep('step-1', 'Test step 1');
      logger.completeStep('step-1', true);
      logger.logRLHFScore(2, 'Perfect');

      logger.startStep('step-2', 'Test step 2');
      logger.completeStep('step-2', true);
      logger.logRLHFScore(2, 'Perfect');

      logger.startStep('step-3', 'Test step 3');
      logger.completeStep('step-3', true);
      logger.logRLHFScore(1, 'Good');

      const summary = logger.getExecutionSummary();
      expect(summary.rlhfScore.breakdown[2]).toBe(2);
      expect(summary.rlhfScore.breakdown[1]).toBe(1);
    });
  });

  describe('Execution Summary', () => {
    beforeEach(() => {
      logger = new Logger({
        logDirectory: tempDir,
        colorize: false,
        quiet: true,
      });
    });

    it('should return complete execution summary', () => {
      logger.startStep('step-1', 'Test step');
      logger.completeStep('step-1', true);
      logger.logQualityCheck('Lint', true);
      logger.logRLHFScore(2, 'Perfect');

      const summary = logger.getExecutionSummary();

      expect(summary.totalSteps).toBe(1);
      expect(summary.completedSteps).toBe(1);
      expect(summary.failedSteps).toBe(0);
      expect(summary.qualityChecks.passed).toBe(1);
      expect(summary.rlhfScore.total).toBe(2);
    });

    it('should print execution summary without errors', () => {
      logger.startStep('step-1', 'Test step');
      logger.completeStep('step-1', true);

      // Should not throw
      expect(() => logger.printExecutionSummary()).not.toThrow();
    });
  });

  describe('Log Level Filtering', () => {
    it('should filter logs based on log level', async () => {
      logger = new Logger({
        logDirectory: tempDir,
        logLevel: LogLevel.WARN,
        colorize: false,
        showTimestamp: false,
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const logContent = await getLogContent();

      expect(logContent).not.toContain('[DEBUG] Debug message');
      expect(logContent).not.toContain('[INFO] Info message');
      expect(logContent).toContain('[WARN] Warning message');
      expect(logContent).toContain('[ERROR] Error message');
    });

    it('should always log SUCCESS messages', async () => {
      logger = new Logger({
        logDirectory: tempDir,
        logLevel: LogLevel.ERROR,
        colorize: false,
        showTimestamp: false,
      });

      logger.success('Success message');
      const logContent = await getLogContent();
      expect(logContent).toContain('[SUCCESS] Success message');
    });
  });

  describe('Quiet Mode', () => {
    it('should only log errors in quiet mode', () => {
      logger = new Logger({
        logDirectory: tempDir,
        quiet: true,
        colorize: false,
        showTimestamp: false,
      });

      const spy = vi.spyOn(process.stdout, 'write');
      const errorSpy = vi.spyOn(process.stderr, 'write');

      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(spy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      spy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('File Operations', () => {
    it('should create log directory if it does not exist', () => {
      const newDir = path.join(tempDir, 'nested', 'logs');
      logger = new Logger(newDir);
      expect(fs.existsSync(newDir)).toBe(true);
    });

    it('should append to existing log file', async () => {
      logger = new Logger(tempDir);
      logger.info('First message');
      await new Promise(resolve => setTimeout(resolve, 10));
      logger.close();

      logger = new Logger(tempDir);
      logger.info('Second message');
      await new Promise(resolve => setTimeout(resolve, 10));
      logger.close();

      const logContent = fs.readFileSync(path.join(tempDir, 'execution.log'), 'utf-8');
      expect(logContent).toContain('First message');
      expect(logContent).toContain('Second message');
    });

    it('should close log stream', () => {
      logger = new Logger(tempDir);
      expect(() => logger.close()).not.toThrow();
    });
  });
});
