// Using namespace import for native Node.js 'fs' module (not fs-extra)
// This is correct and not affected by the ESM bug - native fs works fine with namespace imports
// Only fs-extra requires default import in ESM/tsx context
import * as fs from 'fs';
import path from 'path';
import chalk from 'chalk';
// Usaremos um nome de arquivo de log consistente para cada execução
const LOG_FILE_NAME = 'execution.log';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["SUCCESS"] = 4] = "SUCCESS";
})(LogLevel || (LogLevel = {}));
class Logger {
    logFilePath;
    logStream;
    verbose;
    quiet;
    showTimestamp;
    timestampFormat;
    colorize;
    logLevel;
    startTime;
    executionSummary;
    currentStepStartTime;
    constructor(options) {
        // Backward compatibility: support old string constructor
        if (typeof options === 'string') {
            options = { logDirectory: options };
        }
        const { logDirectory, verbose = false, quiet = false, showTimestamp = true, timestampFormat = 'iso', colorize = true, logLevel = LogLevel.INFO, } = options;
        // Garante que o diretório de logs exista
        fs.mkdirSync(logDirectory, { recursive: true });
        this.logFilePath = path.join(logDirectory, LOG_FILE_NAME);
        // Cria um stream de escrita para o arquivo de log.
        // A flag 'a' significa 'append', então não sobrescrevemos o log a cada execução.
        this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
        this.verbose = verbose || process.env.LOG_VERBOSE === 'true';
        this.quiet = quiet || process.env.LOG_QUIET === 'true';
        this.showTimestamp = showTimestamp;
        this.timestampFormat = timestampFormat;
        this.colorize = colorize && process.stdout.isTTY;
        this.logLevel = logLevel;
        this.startTime = Date.now();
        // Initialize execution summary
        this.executionSummary = {
            totalSteps: 0,
            completedSteps: 0,
            failedSteps: 0,
            skippedSteps: 0,
            totalDuration: 0,
            averageStepDuration: 0,
            qualityChecks: {
                passed: 0,
                failed: 0,
                skipped: 0,
            },
            rlhfScore: {
                average: 0,
                total: 0,
                breakdown: {},
            },
        };
        if (!this.quiet) {
            console.log(chalk.gray(`📝 Logging to: ${this.logFilePath}`));
        }
    }
    formatTimestamp() {
        if (!this.showTimestamp)
            return '';
        const now = Date.now();
        switch (this.timestampFormat) {
            case 'iso':
                return `[${new Date().toISOString()}]`;
            case 'relative':
                return `[+${((now - this.startTime) / 1000).toFixed(1)}s]`;
            case 'elapsed':
                const elapsed = now - this.startTime;
                const hours = Math.floor(elapsed / 3600000);
                const minutes = Math.floor((elapsed % 3600000) / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                return `[${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
            default:
                return `[${new Date().toISOString()}]`;
        }
    }
    formatContext(context) {
        if (!context || Object.keys(context).length === 0)
            return '';
        const parts = [];
        if (context.stepId)
            parts.push(`step=${context.stepId}`);
        if (context.layer)
            parts.push(`layer=${context.layer}`);
        if (context.action)
            parts.push(`action=${context.action}`);
        if (context.progress)
            parts.push(`progress=${context.progress}`);
        if (context.duration !== undefined)
            parts.push(`duration=${context.duration.toFixed(1)}s`);
        if (context.file)
            parts.push(`file=${context.file}`);
        // Add any other context properties
        for (const [key, value] of Object.entries(context)) {
            if (!['stepId', 'layer', 'action', 'progress', 'duration', 'file'].includes(key)) {
                parts.push(`${key}=${JSON.stringify(value)}`);
            }
        }
        return parts.length > 0 ? ` {${parts.join(', ')}}` : '';
    }
    getLevelPrefix(level) {
        if (!this.colorize) {
            switch (level) {
                case LogLevel.DEBUG:
                    return '[DEBUG]';
                case LogLevel.INFO:
                    return '[INFO]';
                case LogLevel.WARN:
                    return '[WARN]';
                case LogLevel.ERROR:
                    return '[ERROR]';
                case LogLevel.SUCCESS:
                    return '[SUCCESS]';
            }
        }
        switch (level) {
            case LogLevel.DEBUG:
                return chalk.gray('[DEBUG]');
            case LogLevel.INFO:
                return chalk.blue('[INFO]');
            case LogLevel.WARN:
                return chalk.yellow('[WARN]');
            case LogLevel.ERROR:
                return chalk.red('[ERROR]');
            case LogLevel.SUCCESS:
                return chalk.green('[SUCCESS]');
        }
    }
    writeLog(level, message, context) {
        // Skip if log level is too low
        if (level < this.logLevel && level !== LogLevel.SUCCESS)
            return;
        if (this.quiet && level !== LogLevel.ERROR)
            return;
        const timestamp = this.formatTimestamp();
        const levelPrefix = this.getLevelPrefix(level);
        const contextStr = this.verbose ? this.formatContext(context) : '';
        const formattedMessage = `${timestamp} ${levelPrefix} ${message}${contextStr}\n`;
        // Write to file (always, without color)
        const fileMessage = `${timestamp} [${LogLevel[level]}] ${message}${contextStr}\n`;
        this.logStream.write(fileMessage);
        // Write to console (with color if enabled)
        if (!this.quiet || level === LogLevel.ERROR) {
            if (level === LogLevel.ERROR) {
                process.stderr.write(formattedMessage);
            }
            else {
                process.stdout.write(formattedMessage);
            }
        }
    }
    debug(message, context) {
        this.writeLog(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        this.writeLog(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.writeLog(LogLevel.WARN, message, context);
    }
    error(message, context) {
        this.writeLog(LogLevel.ERROR, message, context);
    }
    success(message, context) {
        this.writeLog(LogLevel.SUCCESS, message, context);
    }
    log(message) {
        // Backward compatibility
        this.info(message);
    }
    startStep(stepId, description, layer) {
        this.currentStepStartTime = Date.now();
        this.executionSummary.totalSteps++;
        if (!this.quiet) {
            const layerInfo = layer ? chalk.gray(`(${layer})`) : '';
            console.log(`\n${chalk.cyan('▶️')}  ${chalk.bold(`[${this.executionSummary.totalSteps}/${this.executionSummary.totalSteps}] ${stepId}`)} ${layerInfo}`);
            console.log(`   ${description}`);
        }
        this.info(`Starting step: ${stepId}`, { stepId, layer, action: 'start' });
    }
    completeStep(stepId, success, details) {
        const duration = this.currentStepStartTime ? (Date.now() - this.currentStepStartTime) / 1000 : 0;
        if (success) {
            this.executionSummary.completedSteps++;
            this.executionSummary.totalDuration += duration;
            if (!this.quiet) {
                console.log(`   ${chalk.green('✅')} Step completed in ${duration.toFixed(1)}s`);
                if (details)
                    console.log(`   ${chalk.gray(details)}`);
            }
            this.success(`Completed step: ${stepId}`, { stepId, duration });
        }
        else {
            this.executionSummary.failedSteps++;
            if (!this.quiet) {
                console.log(`   ${chalk.red('❌')} Step failed after ${duration.toFixed(1)}s`);
                if (details)
                    console.log(`   ${chalk.red(details)}`);
            }
            this.error(`Failed step: ${stepId}`, { stepId, duration });
        }
        this.currentStepStartTime = undefined;
        // Update average
        if (this.executionSummary.completedSteps > 0) {
            this.executionSummary.averageStepDuration =
                this.executionSummary.totalDuration / this.executionSummary.completedSteps;
        }
    }
    logQualityCheck(name, passed, details) {
        if (passed) {
            this.executionSummary.qualityChecks.passed++;
            if (!this.quiet) {
                console.log(`      ${chalk.green('✅')} ${name}: Passed`);
                if (details && this.verbose)
                    console.log(`         ${chalk.gray(details)}`);
            }
        }
        else {
            this.executionSummary.qualityChecks.failed++;
            if (!this.quiet) {
                console.log(`      ${chalk.red('❌')} ${name}: Failed`);
                if (details)
                    console.log(`         ${chalk.red(details)}`);
            }
        }
    }
    logRLHFScore(score, breakdown) {
        this.executionSummary.rlhfScore.total += score;
        this.executionSummary.rlhfScore.breakdown[score] =
            (this.executionSummary.rlhfScore.breakdown[score] || 0) + 1;
        const completedCount = this.executionSummary.completedSteps;
        if (completedCount > 0) {
            this.executionSummary.rlhfScore.average = this.executionSummary.rlhfScore.total / completedCount;
        }
        if (!this.quiet) {
            console.log(`\n   ${chalk.cyan('🧮')} RLHF Analysis:`);
            console.log(`      ${breakdown}`);
            console.log(`      ${chalk.bold('📊 Final score:')} ${score >= 0 ? chalk.green(score) : chalk.red(score)}/2`);
        }
    }
    logProgress(current, total, eta) {
        if (this.quiet)
            return;
        const percentage = Math.floor((current / total) * 100);
        const completed = Math.floor(percentage / 5);
        const remaining = 20 - completed;
        const progressBar = chalk.green('█'.repeat(completed)) + chalk.gray('░'.repeat(remaining));
        const etaStr = eta ? ` | ETA: ${this.formatDuration(eta)}` : '';
        console.log(`\nProgress: ${progressBar} ${percentage}%${etaStr}\n`);
    }
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        else {
            return `${seconds}s`;
        }
    }
    printExecutionSummary() {
        if (this.quiet)
            return;
        const totalDuration = Date.now() - this.startTime;
        console.log('\n' + chalk.bold('═'.repeat(60)));
        console.log(chalk.bold.cyan('📊 Execution Summary'));
        console.log(chalk.bold('═'.repeat(60)));
        console.log('\n' + chalk.bold('Steps:'));
        console.log(`   Total:     ${this.executionSummary.totalSteps}`);
        console.log(`   ${chalk.green('✅ Completed:')} ${this.executionSummary.completedSteps}`);
        console.log(`   ${chalk.red('❌ Failed:')}    ${this.executionSummary.failedSteps}`);
        console.log(`   ${chalk.yellow('⊘  Skipped:')}   ${this.executionSummary.skippedSteps}`);
        console.log('\n' + chalk.bold('Quality Checks:'));
        console.log(`   ${chalk.green('✅ Passed:')}  ${this.executionSummary.qualityChecks.passed}`);
        console.log(`   ${chalk.red('❌ Failed:')}  ${this.executionSummary.qualityChecks.failed}`);
        console.log(`   ${chalk.yellow('⊘  Skipped:')} ${this.executionSummary.qualityChecks.skipped}`);
        console.log('\n' + chalk.bold('RLHF Scores:'));
        console.log(`   Average:   ${this.executionSummary.rlhfScore.average.toFixed(2)}/2`);
        console.log(`   Total:     ${this.executionSummary.rlhfScore.total}`);
        console.log(`   Breakdown:`);
        for (const [score, count] of Object.entries(this.executionSummary.rlhfScore.breakdown)) {
            const scoreNum = Number(score);
            const color = scoreNum >= 0 ? chalk.green : chalk.red;
            console.log(`      ${color(`Score ${score}:`)} ${count} step(s)`);
        }
        console.log('\n' + chalk.bold('Performance:'));
        console.log(`   Total duration:   ${this.formatDuration(totalDuration)}`);
        console.log(`   Average per step: ${this.executionSummary.averageStepDuration.toFixed(1)}s`);
        console.log('\n' + chalk.bold('═'.repeat(60)));
        this.info('Execution summary printed', {
            totalSteps: this.executionSummary.totalSteps,
            completedSteps: this.executionSummary.completedSteps,
            failedSteps: this.executionSummary.failedSteps,
            averageRLHFScore: this.executionSummary.rlhfScore.average,
        });
    }
    getExecutionSummary() {
        return { ...this.executionSummary };
    }
    close() {
        this.logStream.end();
    }
}
export default Logger;
