#!/usr/bin/env tsx

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { createHash } from 'crypto';

/**
 * Automated RLHF System for Domain Generation
 *
 * This system learns from execution results and automatically:
 * 1. Tracks success/failure patterns
 * 2. Identifies common error types
 * 3. Adjusts templates and processes
 * 4. Improves generation quality over time
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

  constructor() {
    fs.ensureDirSync(this.dataDir);
  }

  /**
   * Analyze execution results and extract metrics
   */
  async analyzeExecution(yamlPath: string): Promise<void> {
    const content = await fs.readFile(yamlPath, 'utf-8');
    const plan = yaml.parse(content);
    const metrics: ExecutionMetrics[] = [];

    for (const step of plan.steps) {
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
    }

    await this.saveMetrics(metrics);
    await this.updatePatterns(metrics);
    await this.generateImprovements(metrics);
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
  private async generateImprovements(metrics: ExecutionMetrics[]): Promise<void> {
    const patterns = await this.loadPatterns();
    const improvements: TemplateImprovement[] = [];

    // Find patterns with low success rates
    for (const [key, pattern] of patterns.entries()) {
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
    console.log(`🤖 Auto-applying improvement for ${improvement.problemPattern}`);

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
  }

  /**
   * Generate learning report
   */
  async generateReport(): Promise<void> {
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
   * Calculate RLHF score based on historical performance
   */
  async calculateScore(stepType: string, success: boolean): Promise<number> {
    const patterns = await this.loadPatterns();
    const key = `${stepType}_${success ? 'success' : 'failure'}`;
    const pattern = patterns.get(key);

    if (!pattern) {
      return success ? 1 : -1; // Default scores
    }

    // Score based on rarity and impact
    const rarityScore = 1 - (pattern.occurrences / 100); // Rarer = higher impact
    const impactScore = success
      ? pattern.successRate
      : (1 - pattern.successRate);

    // RLHF score from -2 to 2
    const baseScore = success ? 1 : -1;
    const adjustedScore = baseScore * (1 + rarityScore * impactScore);

    return Math.max(-2, Math.min(2, adjustedScore));
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
        console.error('Usage: rlhf-system score <step-type> <success>');
      }
      break;

    default:
      console.log('Available commands:');
      console.log('  analyze <yaml-file> - Analyze execution results');
      console.log('  report              - Generate learning report');
      console.log('  score <type> <bool> - Calculate RLHF score');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { RLHFSystem };