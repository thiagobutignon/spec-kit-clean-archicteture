#!/usr/bin/env node

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Simple YAML parser (basic implementation)
function parseYAML(content) {
  const lines = content.split('\n');
  const result = {};
  let currentSection = null;
  let currentKey = null;
  let indentLevel = 0;

  for (let line of lines) {
    if (line.trim().startsWith('#') || line.trim() === '') continue;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    if (trimmed.includes(':') && !trimmed.startsWith('- ')) {
      const [key, value] = trimmed.split(':').map(s => s.trim());

      if (indent === 0) {
        currentSection = key;
        result[key] = value ? parseValue(value) : {};
        currentKey = key;
      } else if (indent === 2 && currentSection) {
        if (!result[currentSection]) result[currentSection] = {};
        result[currentSection][key] = value ? parseValue(value) : {};
        currentKey = key;
      }
    }
  }

  return result;
}

function parseValue(value) {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(value) && value !== '') return Number(value);
  return value;
}

// Enhanced YAML parser for the specific structure
function parseTestYAML(content) {
  const sections = {};
  let currentSection = null;
  let currentTask = null;
  let currentFileIndex = -1;
  let inFileContent = false;
  let fileContentLines = [];
  let inTasksSection = false;

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') {
      if (inFileContent) fileContentLines.push('');
      continue;
    }

    const indent = line.length - line.trimStart().length;

    // Section headers (0 indent)
    if (indent === 0 && trimmed.includes(':') && !trimmed.startsWith('-')) {
      const [key, value] = trimmed.split(':').map(s => s.trim());
      currentSection = key;
      sections[key] = { info: value || {}, tasks: [] };
      inTasksSection = false;
      currentTask = null;
      currentFileIndex = -1;
      inFileContent = false;
      continue;
    }

    // Tasks section
    if (trimmed === 'tasks:' && indent === 2) {
      inTasksSection = true;
      continue;
    }

    // Task definition
    if (trimmed.startsWith('- id:') && inTasksSection) {
      // Save previous file content if we were processing one
      if (inFileContent && currentSection && currentTask !== null && currentFileIndex >= 0 &&
          sections[currentSection] && sections[currentSection].tasks[currentTask] &&
          sections[currentSection].tasks[currentTask].files[currentFileIndex]) {
        sections[currentSection].tasks[currentTask].files[currentFileIndex].content =
          fileContentLines.join('\n').replace(/^\s{12}/gm, '');
        inFileContent = false;
        fileContentLines = [];
      }

      const taskId = trimmed.split('"')[1] || trimmed.split('id:')[1]?.trim();
      if (currentSection && sections[currentSection]) {
        currentTask = sections[currentSection].tasks.length;
        sections[currentSection].tasks.push({
          id: taskId,
          title: '',
          commands: [],
          files: []
        });
        currentFileIndex = -1;
        inFileContent = false;
      }
      continue;
    }

    // Task title
    if (trimmed.startsWith('title:') && inTasksSection && currentTask !== null &&
        currentSection && sections[currentSection] && sections[currentSection].tasks[currentTask]) {
      sections[currentSection].tasks[currentTask].title =
        trimmed.substring(6).trim().replace(/"/g, '');
      continue;
    }

    // Commands section
    if (trimmed === 'commands:' && inTasksSection) {
      continue;
    }

    // Command item
    if (trimmed.startsWith('- "') && inTasksSection && currentSection &&
        sections[currentSection] && sections[currentSection].tasks &&
        sections[currentSection].tasks[currentTask]) {
      const command = trimmed.substring(2).replace(/"/g, '');
      sections[currentSection].tasks[currentTask].commands.push(command);
      continue;
    }

    // Files section
    if (trimmed === 'files:' && inTasksSection) {
      continue;
    }

    // File definition
    if (trimmed.startsWith('- path:') && inTasksSection) {
      // Save previous file content if we were processing one
      if (inFileContent && currentSection && currentTask !== null && currentFileIndex >= 0 &&
          sections[currentSection] && sections[currentSection].tasks[currentTask] &&
          sections[currentSection].tasks[currentTask].files[currentFileIndex]) {
        sections[currentSection].tasks[currentTask].files[currentFileIndex].content =
          fileContentLines.join('\n').replace(/^\s{12}/gm, '');
        fileContentLines = [];
      }

      const filePath = trimmed.substring(7).trim().replace(/"/g, '');
      if (currentSection && sections[currentSection] && currentTask !== null &&
          sections[currentSection].tasks[currentTask]) {
        currentFileIndex = sections[currentSection].tasks[currentTask].files.length;
        sections[currentSection].tasks[currentTask].files.push({
          path: filePath,
          content: ''
        });
      }
      inFileContent = false;
      continue;
    }

    // File content start
    if (trimmed === 'content: |' && inTasksSection) {
      inFileContent = true;
      fileContentLines = [];
      continue;
    }

    // File content lines
    if (inFileContent && inTasksSection) {
      fileContentLines.push(line);
    }
  }

  // Save last file content if exists
  if (inFileContent && currentSection && currentTask !== null && currentFileIndex >= 0 &&
      sections[currentSection] && sections[currentSection].tasks[currentTask] &&
      sections[currentSection].tasks[currentTask].files[currentFileIndex]) {
    sections[currentSection].tasks[currentTask].files[currentFileIndex].content =
      fileContentLines.join('\n').replace(/^\s{12}/gm, '');
  }

  return sections;
}

// Logger class for intercepting and saving logs
class Logger {
  constructor(logFile = 'execution.log') {
    this.logFile = logFile;
    this.originalConsoleLog = console.log;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.setupLogFile();
    this.interceptConsole();
  }

  setupLogFile() {
    // Create logs directory if it doesn't exist
    const logDir = path.dirname(this.logFile);
    if (logDir !== '.' && !fsSync.existsSync(logDir)) {
      fsSync.mkdirSync(logDir, { recursive: true });
    }

    // Rotate log file if it exists and is large
    this.rotateLogIfNeeded();

    // Create log file with header
    const startTime = new Date().toISOString();
    const logHeader = `\n${'='.repeat(80)}\n` +
                     `EXECUTION LOG STARTED: ${startTime}\n` +
                     `Process ID: ${process.pid}\n` +
                     `Node Version: ${process.version}\n` +
                     `Platform: ${process.platform}\n` +
                     `Working Directory: ${process.cwd()}\n` +
                     `${'='.repeat(80)}\n\n`;

    fsSync.writeFileSync(this.logFile, logHeader, 'utf8');
  }

  rotateLogIfNeeded() {
    try {
      if (fsSync.existsSync(this.logFile)) {
        const stats = fsSync.statSync(this.logFile);
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (stats.size > maxSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedFile = this.logFile.replace(/\.log$/, `-${timestamp}.log`);
          fsSync.renameSync(this.logFile, rotatedFile);
          this.originalConsoleLog(`Rotated log file to: ${rotatedFile}`);
        }
      }
    } catch (error) {
      this.originalConsoleLog('Error rotating log file:', error.message);
    }
  }

  interceptConsole() {
    // Intercept console.log
    console.log = (...args) => {
      this.originalConsoleLog.apply(console, args);
      this.saveToFile(args, 'LOG');
    };

    // Intercept console.error
    console.error = (...args) => {
      this.originalConsoleError.apply(console, args);
      this.saveToFile(args, 'ERROR');
    };

    // Intercept console.warn
    console.warn = (...args) => {
      this.originalConsoleWarn.apply(console, args);
      this.saveToFile(args, 'WARN');
    };
  }

  saveToFile(args, consoleMethod = 'LOG') {
    try {
      const timestamp = new Date().toISOString();
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');

      // Remove ANSI color codes for file logging
      const cleanMessage = message.replace(/\x1b\[[0-9;]*m/g, '');

      // Remove duplicate timestamp if it's already in the message
      const finalMessage = cleanMessage.replace(/^\[[\d-T:.Z]+\]\s*/, '');

      // Detect log level from content or console method
      let level = this.detectLogLevel(finalMessage);
      if (consoleMethod === 'ERROR') level = 'error';
      if (consoleMethod === 'WARN') level = 'warn';

      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        method: consoleMethod,
        message: finalMessage,
        pid: process.pid
      };

      // Format log line with padding for better readability
      const paddedLevel = level.toUpperCase().padEnd(7);
      const logLine = `${timestamp} [${paddedLevel}] ${finalMessage}\n`;

      // Append to file (async to avoid blocking)
      fs.appendFile(this.logFile, logLine, 'utf8').catch(err => {
        this.originalConsoleLog('Error writing to log file:', err.message);
      });

    } catch (error) {
      this.originalConsoleLog('Error in log interceptor:', error.message);
    }
  }

  detectLogLevel(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('✗')) {
      return 'error';
    }
    if (lowerMessage.includes('warning') || lowerMessage.includes('warn') || lowerMessage.includes('skipping')) {
      return 'warn';
    }
    if (lowerMessage.includes('success') || lowerMessage.includes('completed') || lowerMessage.includes('✓')) {
      return 'success';
    }
    if (lowerMessage.includes('executing') || lowerMessage.includes('running') || lowerMessage.includes('creating')) {
      return 'action';
    }

    return 'info';
  }

  restore() {
    console.log = this.originalConsoleLog;
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
  }

  async saveExecutionSummary(stats) {
    const endTime = new Date().toISOString();
    const duration = Math.round((Date.now() - stats.startTime) / 1000);

    const summary = {
      timestamp: endTime,
      executionSummary: {
        totalTasks: stats.totalTasks,
        completedTasks: stats.completedTasks,
        failedTasks: stats.failedTasks,
        skippedTasks: stats.totalTasks - stats.completedTasks - stats.failedTasks,
        duration: `${duration} seconds`,
        successRate: `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%`,
        startTime: new Date(stats.startTime).toISOString(),
        endTime: endTime
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        workingDirectory: process.cwd(),
        pid: process.pid
      }
    };

    const summaryLine = `\n${'='.repeat(80)}\n` +
                       `EXECUTION SUMMARY\n` +
                       `${'='.repeat(80)}\n` +
                       `${JSON.stringify(summary, null, 2)}\n` +
                       `${'='.repeat(80)}\n` +
                       `LOG ENDED: ${endTime}\n` +
                       `${'='.repeat(80)}\n\n`;

    try {
      await fs.appendFile(this.logFile, summaryLine, 'utf8');
    } catch (error) {
      this.originalConsoleLog('Error writing summary to log file:', error.message);
    }
  }
}

class TaskExecutor {
  constructor(logFile = 'logs/execution.log') {
    this.stats = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      startTime: Date.now()
    };

    // Initialize logger
    this.logger = new Logger(logFile);
    this.log('TaskExecutor initialized with logging enabled', 'info');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async executeCommand(command, workingDir = process.cwd()) {
    this.log(`Executing: ${command}`, 'info');

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: workingDir,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      if (stdout) this.log(`Output: ${stdout.trim()}`, 'success');
      if (stderr) this.log(`Stderr: ${stderr.trim()}`, 'warning');

      return { success: true, stdout, stderr };
    } catch (error) {
      this.log(`Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async createFile(filePath, content) {
    try {
      const fullPath = path.resolve(filePath);
      const dirPath = path.dirname(fullPath);

      // Create directory if it doesn't exist
      await fs.mkdir(dirPath, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, content, 'utf8');

      this.log(`Created file: ${filePath}`, 'success');
      return { success: true };
    } catch (error) {
      this.log(`Failed to create file ${filePath}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async executeTask(task, sectionName) {
    this.log(`\n=== Executing Task: ${task.id} - ${task.title} ===`, 'info');
    this.stats.totalTasks++;

    let taskSuccess = true;

    // Execute commands
    if (task.commands && task.commands.length > 0) {
      this.log(`Running ${task.commands.length} commands...`, 'info');

      for (const command of task.commands) {
        const result = await this.executeCommand(command);
        if (!result.success) {
          taskSuccess = false;
          this.log(`Task ${task.id} failed at command: ${command}`, 'error');
          break;
        }
      }
    }

    // Create files
    if (task.files && task.files.length > 0 && taskSuccess) {
      this.log(`Creating ${task.files.length} files...`, 'info');

      for (const file of task.files) {
        const result = await this.createFile(file.path, file.content);
        if (!result.success) {
          taskSuccess = false;
          this.log(`Task ${task.id} failed at file creation: ${file.path}`, 'error');
          break;
        }
      }
    }

    if (taskSuccess) {
      this.stats.completedTasks++;
      this.log(`Task ${task.id} completed successfully ✓`, 'success');
    } else {
      this.stats.failedTasks++;
      this.log(`Task ${task.id} failed ✗`, 'error');
    }

    return taskSuccess;
  }

  async executeSection(sectionName, section, filter = null) {
    this.log(`\n🚀 Starting Section: ${sectionName.toUpperCase()}`, 'info');

    if (!section.tasks || section.tasks.length === 0) {
      this.log(`No tasks found in section: ${sectionName}`, 'warning');
      return true;
    }

    let sectionSuccess = true;

    for (const task of section.tasks) {
      // Apply filter if provided
      if (filter && !filter(task, sectionName)) {
        this.log(`Skipping task ${task.id} (filtered)`, 'warning');
        continue;
      }

      const taskResult = await this.executeTask(task, sectionName);
      if (!taskResult) {
        sectionSuccess = false;
        this.log(`Section ${sectionName} failed at task ${task.id}`, 'error');

        // Ask user if they want to continue
        const continueExecution = await this.promptContinue(task.id);
        if (!continueExecution) {
          break;
        }
      }
    }

    this.log(`Section ${sectionName} ${sectionSuccess ? 'completed' : 'failed'}`,
      sectionSuccess ? 'success' : 'error');

    return sectionSuccess;
  }

  async promptContinue(failedTaskId) {
    // For automation, we'll continue by default
    // In interactive mode, you could prompt the user
    this.log(`Continuing execution despite failure in task ${failedTaskId}...`, 'warning');
    return true;
  }

  async printStats() {
    const duration = Math.round((Date.now() - this.stats.startTime) / 1000);

    this.log('\n📊 Execution Summary:', 'info');
    this.log(`Total Tasks: ${this.stats.totalTasks}`, 'info');
    this.log(`Completed: ${this.stats.completedTasks}`, 'success');
    this.log(`Failed: ${this.stats.failedTasks}`, this.stats.failedTasks > 0 ? 'error' : 'info');
    this.log(`Duration: ${duration} seconds`, 'info');
    this.log(`Success Rate: ${Math.round((this.stats.completedTasks / this.stats.totalTasks) * 100)}%`, 'info');

    // Save execution summary to log file
    await this.logger.saveExecutionSummary(this.stats);
    this.log(`\n📝 Execution log saved to: ${this.logger.logFile}`, 'info');
  }

  cleanup() {
    // Restore original console.log
    this.logger.restore();
  }
}

async function main() {
  const executor = new TaskExecutor();

  try {
    // Read and parse YAML file
    executor.log('🔄 Reading test.yaml...', 'info');
    const yamlContent = await fs.readFile('test.yaml', 'utf8');

    executor.log('🔄 Parsing YAML content...', 'info');
    const sections = parseTestYAML(yamlContent);

    executor.log(`Found ${Object.keys(sections).length} sections`, 'info');

    // Get command line arguments for filtering
    const args = process.argv.slice(2);
    const sectionFilter = args.find(arg => arg.startsWith('--section='))?.split('=')[1];
    const taskFilter = args.find(arg => arg.startsWith('--task='))?.split('=')[1];
    const dryRun = args.includes('--dry-run');

    if (dryRun) {
      executor.log('🔍 DRY RUN MODE - No commands will be executed', 'warning');
    }

    // Define execution order
    const executionOrder = ['setup', 'domain', 'presentation', 'pages', 'final'];

    // Execute sections in order
    for (const sectionName of executionOrder) {
      if (sections[sectionName]) {
        // Apply section filter
        if (sectionFilter && sectionName !== sectionFilter) {
          executor.log(`Skipping section: ${sectionName}`, 'warning');
          continue;
        }

        const filter = taskFilter ?
          (task) => task.id.includes(taskFilter) : null;

        if (!dryRun) {
          await executor.executeSection(sectionName, sections[sectionName], filter);
        } else {
          executor.log(`Would execute section: ${sectionName} with ${sections[sectionName].tasks?.length || 0} tasks`, 'info');
        }
      }
    }

    await executor.printStats();
    executor.log('🎉 Execution completed!', 'success');

    // Cleanup logger
    executor.cleanup();

  } catch (error) {
    executor.log(`Fatal error: ${error.message}`, 'error');
    console.error(error.stack);

    // Cleanup logger before exit
    if (executor && executor.cleanup) {
      executor.cleanup();
    }

    process.exit(1);
  }
}

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node execute-test.js [options]

Options:
  --section=<name>    Execute only specific section (setup, domain, presentation, pages, final)
  --task=<id>         Execute only tasks containing this ID
  --dry-run          Show what would be executed without running commands
  --help, -h         Show this help message

Examples:
  node execute-test.js                    # Execute all tasks
  node execute-test.js --section=setup    # Execute only setup section
  node execute-test.js --task=S001        # Execute only tasks with S001 in ID
  node execute-test.js --dry-run          # Preview execution without running
`);
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { TaskExecutor, parseTestYAML };