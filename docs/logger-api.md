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

## Troubleshooting

### Logs Not Appearing in File

**Symptom**: Console shows logs but file is empty or missing

**Possible Causes & Solutions**:

1. **Stream not flushed**: Call `logger.close()` before process exits
   ```typescript
   process.on('exit', () => logger.close());
   ```

2. **Permission denied**: Logger falls back to console-only mode
   ```
   Warning: Could not create log directory at /path: EACCES: permission denied
   Logging will continue to console only.
   ```
   **Solution**: Check directory permissions or use a different path

3. **Log directory doesn't exist**: Logger creates it automatically, but parent must exist
   ```typescript
   // Ensure parent directory exists
   const logger = new Logger({ logDirectory: './logs' }); // ✅ Works
   const logger = new Logger({ logDirectory: './non/exist/logs' }); // ❌ May fail
   ```

### Colors Not Showing

**Symptom**: Console output shows raw ANSI codes or no colors

**Possible Causes & Solutions**:

1. **Not a TTY**: Colors are auto-disabled for non-TTY environments
   ```typescript
   // Force colorization (not recommended)
   const logger = new Logger({
     logDirectory: './logs',
     colorize: true,  // Usually auto-detected
   });
   ```

2. **CI/CD environment**: Most CI systems aren't TTYs
   **Solution**: Colors automatically disabled; check file logs instead

3. **Windows Command Prompt**: May not support ANSI colors
   **Solution**: Use Windows Terminal, PowerShell, or disable colors

### Context Not Showing in Logs

**Symptom**: Logs don't show `{step=..., layer=...}` context

**Possible Causes & Solutions**:

1. **Verbose mode disabled**: Context only shown when verbose=true
   ```typescript
   const logger = new Logger({
     logDirectory: './logs',
     verbose: true,  // Enable to see context
   });
   ```

2. **Environment variable**: Set `LOG_VERBOSE=true`
   ```bash
   LOG_VERBOSE=true node your-script.js
   ```

### Log Level Filtering Issues

**Symptom**: Expected log messages not appearing

**Possible Causes & Solutions**:

1. **Log level too high**: DEBUG messages won't show if logLevel=INFO
   ```typescript
   const logger = new Logger({
     logDirectory: './logs',
     logLevel: LogLevel.DEBUG,  // Show everything
   });
   ```

2. **Quiet mode enabled**: Only ERROR messages show in quiet mode
   ```typescript
   // Check quiet mode
   const logger = new Logger({
     logDirectory: './logs',
     quiet: false,  // Ensure not in quiet mode
   });
   ```

3. **SUCCESS messages**: These always show regardless of log level
   - This is intentional for critical milestones

### Performance Issues

**Symptom**: Logging is slow or blocking

**Possible Causes & Solutions**:

1. **Synchronous writes**: Use async patterns
   ```typescript
   // Don't do this in a tight loop
   for (let i = 0; i < 10000; i++) {
     logger.debug(`Item ${i}`);  // ❌ Slow
   }

   // Better approach
   logger.debug(`Processing ${items.length} items`);
   processItems();
   logger.debug(`Completed ${items.length} items`);
   ```

2. **Verbose logging in production**: Use appropriate log levels
   ```typescript
   const logger = new Logger({
     logDirectory: './logs',
     logLevel: process.env.NODE_ENV === 'production'
       ? LogLevel.INFO
       : LogLevel.DEBUG,
   });
   ```

3. **Large context objects**: Minimize context in hot paths
   ```typescript
   // ❌ Avoid large objects
   logger.debug('Processing', {
     data: hugeArray,  // Don't log entire arrays
   });

   // ✅ Log summary instead
   logger.debug('Processing', {
     count: hugeArray.length,
     first: hugeArray[0],
   });
   ```

### Step Progress Shows [N/N] Instead of [current/total]

**Symptom**: Progress shows `[1/1]`, `[2/2]` instead of `[1/50]`, `[2/50]`

**Solution**: Pass `totalSteps` parameter
```typescript
// ❌ Without totalSteps
logger.startStep('step-1', 'Processing', 'domain');
// Shows: [1/1] step-1

// ✅ With totalSteps
logger.startStep('step-1', 'Processing', 'domain', 50);
// Shows: [1/50] step-1
```

### Invalid RLHF Score Warning

**Symptom**: Warning message: `Unexpected RLHF score: X`

**Cause**: RLHF scores must be in range [-2, -1, 0, 1, 2]

**Solution**: Use valid score values
```typescript
// ✅ Valid scores
logger.logRLHFScore(-2, 'Major violations');
logger.logRLHFScore(-1, 'Minor violations');
logger.logRLHFScore(0, 'Neutral');
logger.logRLHFScore(1, 'Good');
logger.logRLHFScore(2, 'Perfect');

// ❌ Invalid score
logger.logRLHFScore(999, 'Invalid');  // Triggers warning
```

### Logs Contain Escaped Newlines

**Symptom**: Logs show `\n` instead of actual newlines

**Cause**: Log injection prevention sanitizes newlines

**This is intentional** to prevent log injection attacks:
```typescript
// Input: "test\ninjection"
// Logged as: "test\\ninjection"
```

**Solution**: If you need multiline output, use multiple log calls:
```typescript
// Instead of
logger.info(`Line 1\nLine 2\nLine 3`);

// Use
logger.info('Line 1');
logger.info('Line 2');
logger.info('Line 3');
```

### Memory Warnings: MaxListenersExceeded

**Symptom**: Warning about too many event listeners

**Cause**: Creating multiple Logger instances without closing them

**Solution**: Reuse logger instance and close properly
```typescript
// ✅ Good: Single instance
const logger = new Logger({ logDirectory: './logs' });
// ... use logger ...
logger.close();

// ❌ Bad: Multiple instances without closing
for (let i = 0; i < 20; i++) {
  const logger = new Logger({ logDirectory: './logs' });  // Memory leak!
}
```

### File Locks on Windows

**Symptom**: File is locked or can't be deleted

**Cause**: Stream not properly closed

**Solution**: Always call `close()` and wait for process exit
```typescript
const logger = new Logger({ logDirectory: './logs' });

// Setup cleanup
process.on('beforeExit', () => {
  logger.close();
});

// Or use try-finally
try {
  // ... logging ...
} finally {
  logger.close();
}
```

### Getting Help

If you encounter issues not covered here:

1. **Check the log file**: `execution.log` often has more details
2. **Enable DEBUG level**: See all internal logging
3. **Check file permissions**: Ensure write access to log directory
4. **Review examples**: See "Example: Complete Workflow" section
5. **File an issue**: Report bugs with minimal reproduction case
