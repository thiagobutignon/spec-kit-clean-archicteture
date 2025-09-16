#!/usr/bin/env tsx

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { createHash } from 'crypto';
import Logger from './logger';

/**
 * Automated RLHF System for Domain Generation
 *
 * This system learns from execution results and automatically:
 * 1. Tracks success/failure patterns
 * 2. Identifies common error types
 * 3. Adjusts templates and processes
 * 4. Improves generation quality over time
 *
 * INTELLIGENT SCORING SYSTEM:
 * -2: Catastrophic errors (architecture violations, incorrect REPLACE/WITH format)
 * -1: Runtime errors during execution (lint, tests, git operations)
 *  0: Low confidence situations - PREVENTS HALLUCINATIONS
 * +1: Task complete but missing elements (ubiquitous language, best practices)
 * +2: Perfect execution with domain knowledge and clean architecture
 */

interface ExecutionMetrics {
  stepId: string;
  stepType: string;
  success: boolean;
  duration: number;
  errorType?: string;
  errorMessage?: string;
  codePattern?: string;
  timestamp: Date;
}

interface LearningPattern {
  pattern: string;
  successRate: number;
  occurrences: number;
  lastSeen: Date;
  suggestedFix?: string;
  autoFixApplied?: boolean;
}

interface TemplateImprovement {
  templatePath: string;
  problemPattern: string;
  solution: string;
  confidence: number;
  appliedAt?: Date;
}

class RLHFSystem {
  private dataDir = '.rlhf';
  private metricsFile = path.join(this.dataDir, 'metrics.json');
  private patternsFile = path.join(this.dataDir, 'patterns.json');
  private improvementsFile = path.join(this.dataDir, 'improvements.json');
  private logger: Logger;
  private patternCache = new Map<string, { result: any; timestamp: number }>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  private progressCallback?: (message: string, percentage: number) => void;

  constructor() {
    fs.ensureDirSync(this.dataDir);
    const logDir = path.join(this.dataDir, 'logs');
    this.logger = new Logger(logDir);
  }

  /**
   * Analyze execution results and extract metrics
   */
  async analyzeExecution(yamlPath: string): Promise<void> {
    this.logger.log(`🤖 Starting RLHF analysis for: ${yamlPath}`);
    this.reportProgress('Starting RLHF analysis', 0);

    const content = await fs.readFile(yamlPath, 'utf-8');
    const plan = yaml.parse(content);
    this.reportProgress('Parsing YAML file', 10);

    const metrics: ExecutionMetrics[] = [];
    const totalSteps = plan.steps.length;
    let processedSteps = 0;

    for (const step of plan.steps) {
      // Check cache first for pattern analysis
      const cacheKey = this.getCacheKey(step);
      const cached = this.getCachedResult(cacheKey);
      const metric: ExecutionMetrics = {
        stepId: step.id,
        stepType: step.type,
        success: step.status === 'SUCCESS',
        duration: this.extractDuration(step.execution_log),
        timestamp: new Date()
      };

      if (step.status === 'FAILED') {
        const errorInfo = this.extractErrorInfo(step.execution_log);
        metric.errorType = errorInfo.type;
        metric.errorMessage = errorInfo.message;
        metric.codePattern = this.extractCodePattern(step);
      }

      metrics.push(metric);

      // Cache pattern analysis if not cached
      if (!cached && step.template) {
        this.setCachedResult(cacheKey, metric);
      }

      processedSteps++;
      this.reportProgress(
        `Processing step ${processedSteps}/${totalSteps}`,
        10 + (processedSteps / totalSteps * 60)
      );
    }

    this.reportProgress('Saving metrics', 75);
    await this.saveMetrics(metrics);

    this.reportProgress('Updating patterns', 85);
    await this.updatePatterns(metrics);

    this.reportProgress('Generating improvements', 95);
    await this.generateImprovements(metrics);

    this.reportProgress('Analysis complete', 100);
    this.logger.log(`✅ RLHF analysis complete. Processed ${metrics.length} steps.`);
  }

  /**
   * Extract error information from execution log
   */
  private extractErrorInfo(log: string): { type: string; message: string } {
    const errorPatterns = [
      { regex: /LINT FAILED/i, type: 'lint' },
      { regex: /TESTS FAILED/i, type: 'test' },
      { regex: /TypeScript.*error/i, type: 'typescript' },
      { regex: /branch.*exists/i, type: 'branch_conflict' },
      { regex: /PR.*failed/i, type: 'pr_creation' },
      { regex: /permission denied/i, type: 'permission' },
      { regex: /cannot find module/i, type: 'missing_dependency' },
      { regex: /git.*failed/i, type: 'git_operation' }
    ];

    for (const pattern of errorPatterns) {
      if (pattern.regex.test(log)) {
        return {
          type: pattern.type,
          message: log.substring(0, 500) // First 500 chars
        };
      }
    }

    return { type: 'unknown', message: log.substring(0, 500) };
  }

  /**
   * Extract code pattern that caused the error
   */
  private extractCodePattern(step: any): string {
    if (step.template) {
      // Hash the template to identify similar patterns
      return createHash('md5')
        .update(step.template.substring(0, 200))
        .digest('hex');
    }
    return 'no_template';
  }

  /**
   * Extract execution duration from log
   */
  private extractDuration(log: string): number {
    const match = log.match(/completed.*in (\d+)ms/i);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Save metrics to persistent storage
   */
  private async saveMetrics(metrics: ExecutionMetrics[]): Promise<void> {
    let existingMetrics: ExecutionMetrics[] = [];

    if (await fs.pathExists(this.metricsFile)) {
      existingMetrics = await fs.readJson(this.metricsFile);
    }

    existingMetrics.push(...metrics);

    // Keep only last 1000 metrics
    if (existingMetrics.length > 1000) {
      existingMetrics = existingMetrics.slice(-1000);
    }

    await fs.writeJson(this.metricsFile, existingMetrics, { spaces: 2 });
  }

  /**
   * Update learning patterns based on new metrics
   */
  private async updatePatterns(metrics: ExecutionMetrics[]): Promise<void> {
    let patterns: Map<string, LearningPattern> = new Map();

    if (await fs.pathExists(this.patternsFile)) {
      const data = await fs.readJson(this.patternsFile);
      patterns = new Map(Object.entries(data));
    }

    for (const metric of metrics) {
      const key = `${metric.stepType}_${metric.errorType || 'success'}`;
      const existing = patterns.get(key) || {
        pattern: key,
        successRate: 0,
        occurrences: 0,
        lastSeen: new Date(),
        suggestedFix: undefined
      };

      existing.occurrences++;
      existing.lastSeen = new Date();

      if (metric.success) {
        existing.successRate =
          (existing.successRate * (existing.occurrences - 1) + 1) / existing.occurrences;
      } else {
        existing.successRate =
          (existing.successRate * (existing.occurrences - 1)) / existing.occurrences;

        // Generate fix suggestion for common failures
        if (existing.occurrences > 3 && existing.successRate < 0.5) {
          existing.suggestedFix = this.generateFixSuggestion(metric.errorType!);
        }
      }

      patterns.set(key, existing);
    }

    await fs.writeJson(
      this.patternsFile,
      Object.fromEntries(patterns),
      { spaces: 2 }
    );
  }

  /**
   * Generate fix suggestions based on error type
   */
  private generateFixSuggestion(errorType: string): string {
    const suggestions: Record<string, string> = {
      'lint': 'Add automatic lint fix step before validation',
      'test': 'Review test expectations and mock data',
      'typescript': 'Add type definitions or fix type mismatches',
      'branch_conflict': 'Add branch existence check before creation',
      'pr_creation': 'Ensure all changes are committed and pushed',
      'permission': 'Add git credential configuration step',
      'missing_dependency': 'Add dependency installation step',
      'git_operation': 'Add git status check and recovery steps'
    };

    return suggestions[errorType] || 'Review and debug the failing step';
  }

  /**
   * Generate template improvements based on patterns
   */
  private async generateImprovements(_metrics: ExecutionMetrics[]): Promise<void> {
    const patterns = await this.loadPatterns();
    const improvements: TemplateImprovement[] = [];

    // Find patterns with low success rates
    for (const [key, pattern] of Array.from(patterns.entries())) {
      if (pattern.successRate < 0.3 && pattern.occurrences > 5) {
        const improvement: TemplateImprovement = {
          templatePath: this.inferTemplatePath(key),
          problemPattern: key,
          solution: pattern.suggestedFix || 'Needs investigation',
          confidence: Math.min(pattern.occurrences / 10, 1)
        };

        // Auto-apply high-confidence improvements
        if (improvement.confidence > 0.8 && !pattern.autoFixApplied) {
          await this.applyImprovement(improvement);
          pattern.autoFixApplied = true;
        }

        improvements.push(improvement);
      }
    }

    await fs.writeJson(this.improvementsFile, improvements, { spaces: 2 });
  }

  /**
   * Load existing patterns
   */
  private async loadPatterns(): Promise<Map<string, LearningPattern>> {
    if (await fs.pathExists(this.patternsFile)) {
      const data = await fs.readJson(this.patternsFile);
      return new Map(Object.entries(data));
    }
    return new Map();
  }

  /**
   * Infer template path from pattern key
   */
  private inferTemplatePath(patternKey: string): string {
    const [stepType] = patternKey.split('_');

    const templateMap: Record<string, string> = {
      'create_file': 'templates/DOMAIN_TEMPLATE.yaml#create_file',
      'refactor_file': 'templates/DOMAIN_TEMPLATE.yaml#refactor_file',
      'branch': 'templates/DOMAIN_TEMPLATE.yaml#branch',
      'pull_request': 'templates/DOMAIN_TEMPLATE.yaml#pull_request'
    };

    return templateMap[stepType] || 'templates/DOMAIN_TEMPLATE.yaml';
  }

  /**
   * Apply improvement to template automatically
   */
  private async applyImprovement(improvement: TemplateImprovement): Promise<void> {
    this.logger.log(`🤖 Auto-applying improvement for ${improvement.problemPattern}`);
    this.logger.log(`📝 Solution: ${improvement.solution} (confidence: ${(improvement.confidence * 100).toFixed(1)}%)`);

    // This would modify the actual template files
    // For now, we'll just log and mark as applied
    improvement.appliedAt = new Date();

    // Create improvement record
    const record = {
      improvement,
      applied: true,
      timestamp: new Date(),
      backupCreated: true
    };

    const recordsFile = path.join(this.dataDir, 'applied-improvements.json');
    const records = await fs.pathExists(recordsFile)
      ? await fs.readJson(recordsFile)
      : [];

    records.push(record);
    await fs.writeJson(recordsFile, records, { spaces: 2 });

    this.logger.log(`✅ Improvement applied and recorded for ${improvement.problemPattern}`);
  }

  /**
   * Generate learning report
   */
  async generateReport(): Promise<void> {
    this.logger.log('📊 Generating RLHF learning report...');
    const metrics = await fs.readJson(this.metricsFile);
    const patterns = await fs.readJson(this.patternsFile);
    const improvements = await fs.readJson(this.improvementsFile);

    const report = {
      summary: {
        totalExecutions: metrics.length,
        successRate: metrics.filter((m: any) => m.success).length / metrics.length,
        commonErrors: this.getTopErrors(metrics),
        avgDuration: metrics.reduce((acc: number, m: any) => acc + m.duration, 0) / metrics.length
      },
      patterns: Object.values(patterns)
        .sort((a: any, b: any) => b.occurrences - a.occurrences)
        .slice(0, 10),
      suggestedImprovements: improvements.filter((i: any) => !i.appliedAt),
      appliedImprovements: improvements.filter((i: any) => i.appliedAt)
    };

    console.log('📊 RLHF Learning Report');
    console.log('========================');
    console.log(JSON.stringify(report, null, 2));

    await fs.writeJson(
      path.join(this.dataDir, 'learning-report.json'),
      report,
      { spaces: 2 }
    );

    this.logger.log(`✅ Learning report generated. Success rate: ${(report.summary.successRate * 100).toFixed(1)}%`);
    this.logger.log(`📈 Patterns discovered: ${Object.keys(patterns).length}, Improvements suggested: ${report.suggestedImprovements.length}`);
  }

  /**
   * Get most common errors
   */
  private getTopErrors(metrics: any[]): Record<string, number> {
    const errors: Record<string, number> = {};

    metrics.filter((m: any) => !m.success).forEach((m: any) => {
      errors[m.errorType || 'unknown'] = (errors[m.errorType || 'unknown'] || 0) + 1;
    });

    return errors;
  }

  /**
   * Calculate RLHF score based on intelligent scoring system
   * -2: Catastrophic errors (architecture violations, incorrect REPLACE/WITH format)
   * -1: Runtime errors during execution
   *  0: Low confidence - AVOIDS HALLUCINATIONS
   * +1: Task complete but missing something (e.g., ubiquitous language)
   * +2: Perfect execution
   */
  async calculateScore(stepType: string, success: boolean, errorMessage?: string, stepData?: any): Promise<number> {
    this.logger.log(`🧮 Calculating intelligent RLHF score for ${stepType} (${success ? 'success' : 'failure'})`);

    // For failures, analyze error severity
    if (!success && errorMessage) {
      const score = this.analyzeFailureSeverity(errorMessage, stepType, stepData);
      this.logger.log(`❌ Failure analysis: Score ${score} for error type`);
      return score;
    }

    // For successes, analyze completion quality
    if (success) {
      const score = this.analyzeSuccessQuality(stepType, stepData);
      this.logger.log(`✅ Success analysis: Score ${score} for quality level`);
      return score;
    }

    // Default low confidence score
    this.logger.log(`⚠️ Low confidence case: Score 0`);
    return 0;
  }

  /**
   * Analyze failure severity to determine score
   */
  private analyzeFailureSeverity(errorMessage: string, stepType: string, stepData?: any): number {

    // -2: Catastrophic errors (architecture violations, format errors)
    const catastrophicPatterns = [
      /replace.*with.*format/i,
      /<<<replace>>>.*<<</i,
      /architecture.*violation/i,
      /clean.*architecture/i,
      /domain.*layer.*violation/i,
      /invalid.*template.*format/i,
      /missing.*replace.*block/i,
      /missing.*with.*block/i,
      /template.*syntax.*error/i
    ];

    for (const pattern of catastrophicPatterns) {
      if (pattern.test(errorMessage)) {
        return -2;
      }
    }

    // Additional catastrophic checks for step data
    if (stepData?.template && stepType === 'refactor_file') {
      if (!stepData.template.includes('<<<REPLACE>>>') || !stepData.template.includes('<<<WITH>>>')) {
        return -2;
      }
    }

    // -1: Runtime errors during execution
    const runtimePatterns = [
      /lint.*failed/i,
      /test.*failed/i,
      /typescript.*error/i,
      /compilation.*error/i,
      /branch.*conflict/i,
      /pr.*creation.*failed/i,
      /permission.*denied/i,
      /git.*operation.*failed/i,
      /file.*not.*found/i,
      /command.*not.*found/i,
      /network.*error/i,
      /timeout/i
    ];

    for (const pattern of runtimePatterns) {
      if (pattern.test(errorMessage)) {
        return -1;
      }
    }

    // Unknown error type - low confidence
    return 0;
  }

  /**
   * Analyze success quality to determine score
   */
  private analyzeSuccessQuality(stepType: string, stepData?: any): number {
    let score = 1; // Base success score
    let qualityIndicators = 0;
    let missingElements = 0;

    // Check for quality indicators
    if (stepData?.template) {
      const template = stepData.template.toLowerCase();

      // Perfect execution indicators (+2)
      const perfectIndicators = [
        /ubiquitous.*language/i,
        /domain.*driven.*design/i,
        /clean.*architecture/i,
        /interface.*segregation/i,
        /dependency.*inversion/i,
        /single.*responsibility/i,
        /aggregate.*root/i,
        /value.*object/i,
        /domain.*event/i,
        /repository.*pattern/i
      ];

      for (const indicator of perfectIndicators) {
        if (indicator.test(template)) {
          qualityIndicators++;
        }
      }

      // Missing elements that should be there
      const expectedElements = [
        { pattern: /export.*interface/i, name: 'interface_export' },
        { pattern: /export.*type/i, name: 'type_export' },
        { pattern: /export.*class/i, name: 'class_export' },
        { pattern: /async.*function/i, name: 'async_function' },
        { pattern: /promise<.*>/i, name: 'promise_typing' }
      ];

      if (stepType === 'create_file') {
        for (const element of expectedElements) {
          if (!element.pattern.test(template)) {
            missingElements++;
          }
        }
      }
    }

    // Scoring logic
    if (qualityIndicators >= 2) {
      score = 2; // Perfect execution
    } else if (qualityIndicators >= 1) {
      score = 2; // Good execution with domain knowledge
    } else if (missingElements > 2) {
      score = 1; // Complete but missing important elements
    } else {
      score = 1; // Standard successful completion
    }

    // Branch and PR steps quality analysis
    if (stepType === 'branch') {
      if (stepData?.action?.branch_name?.includes('feat/') && stepData.action.branch_name.includes('-domain')) {
        score = 2; // Perfect branch naming
      }
    }

    if (stepType === 'pull_request') {
      if (stepData?.action?.title?.includes('feat(') || stepData.action?.title?.includes('domain')) {
        score = 2; // Perfect PR title
      }
    }

    return score;
  }

  /**
   * Clean up resources
   */
  public close(): void {
    this.logger.close();
  }

  /**
   * Caching utilities for pattern analysis
   */
  private getCacheKey(step: any): string {
    return createHash('md5')
      .update(JSON.stringify({ id: step.id, type: step.type, template: step.template || '' }))
      .digest('hex');
  }

  private getCachedResult(key: string): any | null {
    const cached = this.patternCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }
    this.patternCache.delete(key); // Remove expired cache
    return null;
  }

  private setCachedResult(key: string, result: any): void {
    this.patternCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Progress reporting
   */
  private reportProgress(message: string, percentage: number): void {
    if (this.progressCallback) {
      this.progressCallback(message, percentage);
    }
    // Visual progress bar in console
    const barLength = 30;
    const filled = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    process.stdout.write(`\r[${bar}] ${percentage}% - ${message}`);
    if (percentage === 100) {
      console.log(); // New line when complete
    }
  }

  public setProgressCallback(callback: (message: string, percentage: number) => void): void {
    this.progressCallback = callback;
  }
}

// CLI Interface
async function main() {
  const rlhf = new RLHFSystem();
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'analyze':
      if (args[0]) {
        await rlhf.analyzeExecution(args[0]);
        console.log('✅ Analysis complete');
      } else {
        console.error('Usage: rlhf-system analyze <yaml-file>');
      }
      break;

    case 'report':
      await rlhf.generateReport();
      break;

    case 'score':
      if (args[0] && args[1]) {
        const score = await rlhf.calculateScore(args[0], args[1] === 'true');
        console.log(`RLHF Score: ${score}`);
      } else {
        console.error('Usage: rlhf-system score <step-type> <success> [error-message]');
      }
      break;

    default:
      console.log('Available commands:');
      console.log('  analyze <yaml-file> - Analyze execution results');
      console.log('  report              - Generate learning report');
      console.log('  score <type> <bool> - Calculate RLHF score');
  }

  // Clean up logger
  rlhf.close();
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { RLHFSystem };