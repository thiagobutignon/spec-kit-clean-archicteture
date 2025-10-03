# Logger API Documentation

## Overview

The enhanced Logger system provides structured, informative logging with support for multiple log levels, progress tracking, execution summaries, and RLHF score visualization.

## Features

- **Structured Logging**: Log messages with contextual information
- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR, SUCCESS
- **Progress Tracking**: Visual progress bars with ETA
- **Execution Summary**: Comprehensive summary of execution metrics
- **RLHF Score Tracking**: Track and visualize RLHF scores
- **Quality Check Logging**: Track quality check results
- **Flexible Configuration**: Verbose/quiet modes, timestamp formats, colorization
- **Backward Compatible**: Supports legacy string constructor

## Installation

```typescript
import Logger, { LogLevel, type LoggerOptions } from './core/logger';
```

## Basic Usage

### Creating a Logger Instance

```typescript
// Simple usage (backward compatible)
const logger = new Logger('/path/to/logs');

// Advanced usage with options
const logger = new Logger({
  logDirectory: '/path/to/logs',
  verbose: true,
  quiet: false,
  showTimestamp: true,
  timestampFormat: 'iso', // 'iso' | 'relative' | 'elapsed'
  colorize: true,
  logLevel: LogLevel.INFO,
});
```

### Environment Variables

The logger respects the following environment variables:

- `LOG_VERBOSE=true` - Enable verbose mode (shows context)
- `LOG_QUIET=true` - Enable quiet mode (only errors)

### Logging Methods

```typescript
// Basic logging levels
logger.debug('Debug message', { stepId: 'step-1' });
logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message');
logger.success('Success message');

// Legacy method (maps to info)
logger.log('Legacy log message');
```

### Structured Logging with Context

```typescript
interface LogContext {
  stepId?: string;
  layer?: string;
  action?: string;
  progress?: string;
  duration?: number;
  file?: string;
  [key: string]: unknown; // Custom properties
}

logger.info('Processing step', {
  stepId: 'step-1-domain-model',
  layer: 'domain',
  action: 'create_file',
  progress: '1/50',
  file: 'src/domain/models/user.ts',
});
```

### Step Tracking

```typescript
// Start a step
logger.startStep('step-1-domain-model', 'Creating domain model', 'domain');

// Complete a step (success)
logger.completeStep('step-1-domain-model', true, 'File created successfully');

// Complete a step (failure)
logger.completeStep('step-1-domain-model', false, 'Failed to create file');
```

### Quality Check Logging

```typescript
logger.logQualityCheck('Lint', true, 'No linting errors');
logger.logQualityCheck('Tests', false, '3 tests failed');
logger.logQualityCheck('Build', true);
```

### RLHF Score Logging

```typescript
const breakdown = `
  Base score: 1 (success)
  Quality bonus: +0 (all checks passed)
  Layer context: backend/all
`;

logger.logRLHFScore(1, breakdown);
```

### Progress Tracking

```typescript
// Show progress bar
logger.logProgress(10, 50); // 10 out of 50 steps complete

// Show progress bar with ETA
logger.logProgress(10, 50, 180000); // ETA: 3m 0s
```

### Execution Summary

```typescript
// Print summary at the end of execution
logger.printExecutionSummary();

// Get summary programmatically
const summary = logger.getExecutionSummary();
console.log(`Completed ${summary.completedSteps}/${summary.totalSteps} steps`);
```

## Log Levels

```typescript
enum LogLevel {
  DEBUG = 0,    // Detailed internal state
  INFO = 1,     // Standard execution flow
  WARN = 2,     // Non-blocking issues
  ERROR = 3,    // Failures requiring attention
  SUCCESS = 4,  // Completed actions
}
```

## Configuration Options

### Timestamp Formats

- **`iso`**: ISO 8601 format (`[2025-01-03T10:30:45.123Z]`)
- **`relative`**: Time since logger initialization (`[+5.2s]`)
- **`elapsed`**: Elapsed time in HH:MM:SS format (`[00:05:12]`)

### Modes

- **Verbose Mode**: Shows full context for all log messages
- **Quiet Mode**: Only shows ERROR level messages
- **Colorize**: Enables ANSI color codes (auto-detected for TTY)

## Output Format

### Console Output

```
🚀 Starting execution: implement-executor.regent
📊 Total: 50 steps | Layer: backend/all

▶️  [1/50] step-1-domain-commit-config-model (domain)
   Creating domain model for commit configuration
   [2025-01-03T10:30:45.123Z] [INFO] Starting step: step-1-domain-commit-config-model {step=step-1-domain-commit-config-model, layer=domain, action=start}
   📄 Creating: src/domain/models/commit-config.ts
   ✅ Step completed in 2.3s

   🔍 Quality checks:
      ✅ Lint: Passed
      ✅ Tests: Passed
      ✅ Build: Passed

   🧮 RLHF Analysis:
      Base score: 1 (success)
      Quality bonus: +0 (all checks passed)
      Layer context: backend/all
      📊 Final score: 1/2

Progress: ████░░░░░░░░░░░░░░░░ 2% | ETA: 5m 30s
```

### Execution Summary

```
════════════════════════════════════════════════════════════
📊 Execution Summary
════════════════════════════════════════════════════════════

Steps:
   Total:     50
   ✅ Completed: 48
   ❌ Failed:    1
   ⊘  Skipped:   1

Quality Checks:
   ✅ Passed:  144
   ❌ Failed:  3
   ⊘  Skipped: 0

RLHF Scores:
   Average:   0.96/2
   Total:     48
   Breakdown:
      Score 2: 10 step(s)
      Score 1: 38 step(s)
      Score -1: 1 step(s)

Performance:
   Total duration:   5m 30s
   Average per step: 6.9s

════════════════════════════════════════════════════════════
```

## Best Practices

1. **Use Structured Context**: Always provide context with log messages for better debugging
2. **Choose Appropriate Level**: Use the right log level for the message type
3. **Track Steps**: Use `startStep` and `completeStep` for trackable operations
4. **Print Summary**: Always call `printExecutionSummary()` at the end
5. **Close Logger**: Always call `logger.close()` when done

## Example: Complete Workflow

```typescript
import Logger, { LogLevel } from './core/logger';

// Initialize logger
const logger = new Logger({
  logDirectory: './logs',
  verbose: process.env.VERBOSE === 'true',
  logLevel: LogLevel.INFO,
});

try {
  logger.info('Starting execution');

  // Track a step
  logger.startStep('step-1', 'Process data', 'domain');

  // Do work...
  logger.debug('Processing item 1', { itemId: 'item-1' });

  // Log quality checks
  logger.logQualityCheck('Validation', true);
  logger.logQualityCheck('Tests', true);

  // Complete step
  logger.completeStep('step-1', true, 'Processed 100 items');

  // Log RLHF score
  logger.logRLHFScore(2, 'Perfect execution with domain patterns');

  // Show progress
  logger.logProgress(1, 10);

  logger.success('Execution completed successfully');
} catch (error) {
  logger.error('Execution failed', {
    error: error.message,
  });
} finally {
  // Print summary
  logger.printExecutionSummary();

  // Close logger
  logger.close();
}
```

## File Output

All logs are written to `execution.log` in the specified log directory. The file format is plain text without ANSI color codes:

```
[2025-01-03T10:30:45.123Z] [INFO] Starting step: step-1-domain-commit-config-model {step=step-1-domain-commit-config-model, layer=domain, action=start}
[2025-01-03T10:30:47.456Z] [SUCCESS] Completed step: step-1-domain-commit-config-model {step=step-1-domain-commit-config-model, duration=2.3s}
```

## Migration from Old Logger

The new logger is backward compatible with the old API:

```typescript
// Old API (still works)
const logger = new Logger('/path/to/logs');
logger.log('message');
logger.error('error message');
logger.close();

// New API (recommended)
const logger = new Logger({ logDirectory: '/path/to/logs' });
logger.info('message');
logger.error('error message', { context: 'details' });
logger.close();
```
