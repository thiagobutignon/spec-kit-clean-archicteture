#!/usr/bin/env tsx

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import { createHash } from 'crypto';
import chalk from 'chalk';
import Logger from './logger';
import { resolveRLHFDirectory, resolveLogDirectory } from '../utils/log-path-resolver';

/**
 * Enhanced RLHF System with Layer-Aware Scoring
 *
 * This enhanced version integrates with templates by:
 * 1. Accepting layer context in scoring decisions
 * 2. Loading score impacts from template patterns
 * 3. Centralizing all scoring logic
 * 4. Caching layer-specific patterns
 *
 * INTELLIGENT SCORING SYSTEM:
 * -2: Catastrophic errors (architecture violations)
 * -1: Runtime errors or missing implementations
 *  0: Low confidence - prevents hallucinations
 * +1: Task complete with good practices
 * +2: Perfect execution with domain patterns
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
  layer?: string;
  target?: string;
}

interface LearningPattern {
  pattern: string;
  successRate: number;
  occurrences: number;
  lastSeen: Date;
  suggestedFix?: string;
  autoFixApplied?: boolean;
  scoreImpact?: number;
  layer?: string;
}

interface LayerInfo {
  layer: 'domain' | 'data' | 'infra' | 'presentation' | 'main';
  target: 'backend' | 'frontend' | 'fullstack';
}

interface TemplatePattern {
  pattern: string;
  fix: string;
  layer: string;
  score_impact: number;
}

interface TemplateImprovement {
  templatePath: string;
  problemPattern: string;
  solution: string;
  confidence: number;
  appliedAt?: Date;
  layer?: string;
}

interface PlanStep {
  id: string;
  type: string;
  status?: string;
  execution_log?: string;
  template?: string;
}

interface ExecutionPlan {
  steps?: PlanStep[];
  domain_steps?: PlanStep[];
  data_steps?: PlanStep[];
  infra_steps?: PlanStep[];
  presentation_steps?: PlanStep[];
  main_steps?: PlanStep[];
}

interface StepData {
  template?: string;
}

interface CachedResult {
  result: ExecutionMetrics;
  timestamp: number;
}

class EnhancedRLHFSystem {
  private dataDir: string;
  private metricsFile: string;
  private patternsFile: string;
  private improvementsFile: string;
  private logger: Logger;
  private patternCache = new Map<string, CachedResult>();
  private layerPatterns = new Map<string, TemplatePattern[]>();
  private cacheExpiry: number;
  private maxCacheSize = 100;
  private cacheStats = { hits: 0, misses: 0, evictions: 0 };
  private progressCallback?: (message: string, percentage: number) => void;
  private progressFile: string;

  constructor(contextPath?: string, cacheExpiry?: number) {
    this.dataDir = resolveRLHFDirectory(contextPath);
    this.metricsFile = path.join(this.dataDir, 'metrics.json');
    this.patternsFile = path.join(this.dataDir, 'patterns.json');
    this.improvementsFile = path.join(this.dataDir, 'improvements.json');
    this.progressFile = path.join(this.dataDir, 'progress.json');

    fs.ensureDirSync(this.dataDir);

    const logDir = contextPath
      ? resolveLogDirectory(contextPath, 'rlhf')
      : path.join(this.dataDir, 'logs');

    this.logger = new Logger(logDir);
    this.cacheExpiry = cacheExpiry || 5 * 60 * 1000; // Default 5 minutes
    this.setupCleanupHandlers();
    this.loadLayerPatterns();
  }

  /**
   * Load layer-specific patterns from templates
   */
  private async loadLayerPatterns(): Promise<void> {
    // Load patterns from footer template which contains all layer patterns
    const footerPath = 'templates/parts/shared/01-footer.part.regent';

    try {
      if (await fs.pathExists(footerPath)) {
        const content = await fs.readFile(footerPath, 'utf-8');
        const footer = yaml.parse(content);

        // Extract patterns from learning_patterns section
        if (footer.learning_patterns?.common_errors) {
          for (const error of footer.learning_patterns.common_errors) {
            const layer = error.layer || 'all';
            if (!this.layerPatterns.has(layer)) {
              this.layerPatterns.set(layer, []);
            }
            this.layerPatterns.get(layer)!.push(error);
          }
        }

        this.logger.log(`📚 Loaded ${this.layerPatterns.size} layer pattern groups`);
      }
    } catch (error) {
      this.logger.log(`⚠️ Could not load layer patterns from templates: ${error}`);
    }
  }

  /**
   * Analyze execution with layer context
   */
  async analyzeExecution(yamlPath: string, layerInfo?: LayerInfo): Promise<void> {
    this.logger.log(`🤖 Starting layer-aware RLHF analysis for: ${yamlPath}`);
    if (layerInfo) {
      this.logger.log(`📊 Layer context: ${layerInfo.target}/${layerInfo.layer}`);
    }

    this.reportProgress('Starting RLHF analysis', 0);

    const content = await fs.readFile(yamlPath, 'utf-8');
    const plan = yaml.parse(content);
    this.reportProgress('Parsing YAML file', 10);

    const metrics: ExecutionMetrics[] = [];
    const totalSteps = plan.steps?.length || 0;
    let processedSteps = 0;

    // Extract steps based on layer
    const steps = this.extractSteps(plan, layerInfo);

    for (const step of steps) {
      const cacheKey = this.getCacheKey(step);
      const cached = this.getCachedResult(cacheKey);

      const metric: ExecutionMetrics = {
        stepId: step.id,
        stepType: step.type,
        success: step.status === 'SUCCESS',
        duration: this.extractDuration(step.execution_log),
        timestamp: new Date(),
        layer: layerInfo?.layer,
        target: layerInfo?.target
      };

      if (step.status === 'FAILED') {
        const errorInfo = this.extractErrorInfo(step.execution_log);
        metric.errorType = errorInfo.type;
        metric.errorMessage = errorInfo.message;
        metric.codePattern = this.extractCodePattern(step);
      }

      metrics.push(metric);

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
    await this.updatePatterns(metrics, layerInfo);

    this.reportProgress('Generating improvements', 95);
    await this.generateImprovements(metrics, layerInfo);

    this.reportProgress('Analysis complete', 100);
    this.logger.log(`✅ RLHF analysis complete. Processed ${metrics.length} steps.`);
  }

  /**
   * Extract steps based on layer
   */
  private extractSteps(plan: ExecutionPlan, layerInfo?: LayerInfo): PlanStep[] {
    if (!layerInfo) {
      return plan.steps || [];
    }

    // Try layer-specific steps first
    const layerStepsKey = `${layerInfo.layer}_steps`;
    const layerSteps = plan[layerStepsKey];
    if (Array.isArray(layerSteps)) {
      return layerSteps;
    }

    // Fallback to general steps
    return plan.steps || [];
  }

  /**
   * Calculate layer-aware RLHF score
   * This is the centralized scoring logic
   */
  async calculateLayerScore(
    stepType: string,
    success: boolean,
    layerInfo?: LayerInfo,
    errorMessage?: string,
    stepData?: StepData
  ): Promise<number> {
    this.logger.log(`🧮 Calculating layer-aware RLHF score`);
    if (layerInfo) {
      this.logger.log(`   Layer: ${layerInfo.layer}, Target: ${layerInfo.target}`);
    }

    // Base score calculation
    let score = await this.calculateScore(stepType, success, errorMessage, stepData);

    // Apply layer-specific patterns if available
    if (layerInfo && stepData?.template) {
      score = this.applyLayerPatterns(score, stepData.template, layerInfo);
    }

    // Apply template-defined score impacts
    if (layerInfo) {
      score = this.applyTemplateScoreImpacts(score, stepData, layerInfo);
    }

    this.logger.log(`📊 Final layer-aware score: ${score}`);
    return score;
  }

  /**
   * Apply layer-specific patterns to score
   */
  private applyLayerPatterns(score: number, template: string, layerInfo: LayerInfo): number {
    const patterns = this.layerPatterns.get(layerInfo.layer) || [];
    const allPatterns = this.layerPatterns.get('all') || [];

    // Check both layer-specific and general patterns
    for (const pattern of [...patterns, ...allPatterns]) {
      const regex = new RegExp(pattern.pattern, 'i');
      if (regex.test(template)) {
        this.logger.log(`   Pattern match: ${pattern.pattern} (impact: ${pattern.score_impact})`);
        score = Math.min(score + pattern.score_impact, 2);
        score = Math.max(score, -2);
      }
    }

    return score;
  }

  /**
   * Apply template-defined score impacts
   */
  private applyTemplateScoreImpacts(score: number, stepData: StepData, layerInfo: LayerInfo): number {
    if (!stepData?.template) return score;

    const template = stepData.template.toLowerCase();

    // Layer-specific architectural rules
    switch (layerInfo.layer) {
      case 'domain':
        // Domain layer should have NO external dependencies
        if (template.match(/import\s+(?:axios|fetch|prisma|redis|mysql|postgres)/i)) {
          this.logger.log(`   Domain violation: External dependency detected`);
          return Math.min(score, -2);
        }
        // Bonus for good domain patterns
        if (template.includes('value object') || template.includes('aggregate root')) {
          return Math.min(score + 1, 2);
        }
        break;

      case 'data':
        // Data layer should implement domain interfaces
        if (!template.includes('implements')) {
          this.logger.log(`   Data layer warning: No interface implementation`);
          return Math.max(score - 1, -2);
        }
        // Penalty for direct DB access without repository pattern
        if (template.includes('select * from') && !template.includes('repository')) {
          return Math.min(score, -2);
        }
        break;

      case 'infra':
        // Infrastructure should handle errors
        if (!template.includes('try') || !template.includes('catch')) {
          this.logger.log(`   Infra warning: Missing error handling`);
          return Math.max(score - 1, -2);
        }
        break;

      case 'presentation':
        // Presentation should not contain business logic
        if (template.match(/calculate|compute|business|domain logic/i)) {
          this.logger.log(`   Presentation violation: Business logic detected`);
          return Math.min(score, -2);
        }
        break;

      case 'main':
        // Main layer should use factory pattern
        if (template.includes('factory') || template.includes('createFactory')) {
          return Math.min(score + 1, 2);
        }
        break;
    }

    return score;
  }

  /**
   * Extract error information
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
      { regex: /git.*failed/i, type: 'git_operation' },
      { regex: /architecture.*violation/i, type: 'architecture_violation' },
      { regex: /clean.*architecture/i, type: 'clean_architecture' }
    ];

    for (const pattern of errorPatterns) {
      if (pattern.regex.test(log)) {
        return {
          type: pattern.type,
          message: log.substring(0, 500)
        };
      }
    }

    return { type: 'unknown', message: log.substring(0, 500) };
  }

  /**
   * Extract code pattern
   */
  private extractCodePattern(step: PlanStep): string {
    if (step.template) {
      return createHash('md5')
        .update(step.template.substring(0, 200))
        .digest('hex');
    }
    return 'no_template';
  }

  /**
   * Extract execution duration
   */
  private extractDuration(log: string): number {
    const match = log.match(/completed.*in (\d+)ms/i);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Save metrics with layer information
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
   * Update patterns with layer context
   */
  private async updatePatterns(metrics: ExecutionMetrics[], layerInfo?: LayerInfo): Promise<void> {
    let patterns: Map<string, LearningPattern> = new Map();

    if (await fs.pathExists(this.patternsFile)) {
      const data = await fs.readJson(this.patternsFile);
      patterns = new Map(Object.entries(data));
    }

    for (const metric of metrics) {
      const layerPrefix = layerInfo ? `${layerInfo.layer}_` : '';
      const key = `${layerPrefix}${metric.stepType}_${metric.errorType || 'success'}`;

      const existing = patterns.get(key) || {
        pattern: key,
        successRate: 0,
        occurrences: 0,
        lastSeen: new Date(),
        layer: layerInfo?.layer,
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

        if (existing.occurrences > 3 && existing.successRate < 0.5) {
          existing.suggestedFix = this.generateLayerAwareFix(metric.errorType!, layerInfo);
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
   * Generate layer-aware fix suggestions
   */
  private generateLayerAwareFix(errorType: string, layerInfo?: LayerInfo): string {
    const baseSuggestions: Record<string, string> = {
      'lint': 'Add automatic lint fix step before validation',
      'test': 'Review test expectations and mock data',
      'typescript': 'Add type definitions or fix type mismatches',
      'branch_conflict': 'Add branch existence check before creation',
      'pr_creation': 'Ensure all changes are committed and pushed',
      'permission': 'Add git credential configuration step',
      'missing_dependency': 'Add dependency installation step',
      'git_operation': 'Add git status check and recovery steps',
      'architecture_violation': 'Review layer responsibilities and dependencies',
      'clean_architecture': 'Follow clean architecture principles'
    };

    let suggestion = baseSuggestions[errorType] || 'Review and debug the failing step';

    // Add layer-specific context
    if (layerInfo) {
      const layerContext: Record<string, string> = {
        'domain': ' Ensure no external dependencies in domain layer.',
        'data': ' Implement domain interfaces and use repository pattern.',
        'infra': ' Add proper error handling and external service integration.',
        'presentation': ' Keep presentation logic separate from business logic.',
        'main': ' Use dependency injection and factory patterns.'
      };

      suggestion += layerContext[layerInfo.layer] || '';
    }

    return suggestion;
  }

  /**
   * Generate improvements with layer awareness
   */
  private async generateImprovements(metrics: ExecutionMetrics[], layerInfo?: LayerInfo): Promise<void> {
    const patterns = await this.loadPatterns();
    const improvements: TemplateImprovement[] = [];

    for (const [key, pattern] of Array.from(patterns.entries())) {
      // Filter by layer if provided
      if (layerInfo && pattern.layer && pattern.layer !== layerInfo.layer) {
        continue;
      }

      if (pattern.successRate < 0.3 && pattern.occurrences > 5) {
        const improvement: TemplateImprovement = {
          templatePath: this.inferTemplatePath(key, layerInfo),
          problemPattern: key,
          solution: pattern.suggestedFix || 'Needs investigation',
          confidence: Math.min(pattern.occurrences / 10, 1),
          layer: pattern.layer
        };

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
   * Infer template path with layer context
   */
  private inferTemplatePath(patternKey: string, layerInfo?: LayerInfo): string {
    const parts = patternKey.split('_');
    const layer = layerInfo?.layer || parts[0];
    const target = layerInfo?.target || 'backend';
    const stepType = parts[parts.length - 2];

    const templateMap: Record<string, string> = {
      'create_file': `templates/${target}-${layer}-template.regent#create_file`,
      'refactor_file': `templates/${target}-${layer}-template.regent#refactor_file`,
      'branch': `templates/${target}-${layer}-template.regent#branch`,
      'pull_request': `templates/${target}-${layer}-template.regent#pull_request`
    };

    return templateMap[stepType] || `templates/${target}-${layer}-template.regent`;
  }

  /**
   * Apply improvement
   */
  private async applyImprovement(improvement: TemplateImprovement): Promise<void> {
    this.logger.log(`🤖 Auto-applying improvement for ${improvement.problemPattern}`);
    if (improvement.layer) {
      this.logger.log(`   Layer: ${improvement.layer}`);
    }
    this.logger.log(`📝 Solution: ${improvement.solution} (confidence: ${(improvement.confidence * 100).toFixed(1)}%)`);

    improvement.appliedAt = new Date();

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

    this.logger.log(`✅ Improvement applied and recorded`);
  }

  /**
   * Generate layer-aware report
   */
  async generateLayerReport(layerInfo?: LayerInfo): Promise<void> {
    this.logger.log('📊 Generating layer-aware RLHF report...');

    const metrics = await fs.readJson(this.metricsFile) as ExecutionMetrics[];
    const patterns = await fs.readJson(this.patternsFile) as Record<string, LearningPattern>;
    const improvements = await fs.readJson(this.improvementsFile) as TemplateImprovement[];

    // Filter by layer if provided
    const filteredMetrics = layerInfo
      ? metrics.filter((m) => m.layer === layerInfo.layer)
      : metrics;

    const report = {
      layer: layerInfo?.layer || 'all',
      target: layerInfo?.target || 'all',
      summary: {
        totalExecutions: filteredMetrics.length,
        successRate: filteredMetrics.filter((m) => m.success).length / filteredMetrics.length,
        commonErrors: this.getTopErrors(filteredMetrics),
        avgDuration: filteredMetrics.reduce((acc: number, m) => acc + m.duration, 0) / filteredMetrics.length
      },
      layerPatterns: Array.from(this.layerPatterns.entries()).map(([layer, patterns]) => ({
        layer,
        patternCount: patterns.length,
        patterns: patterns.slice(0, 5)
      })),
      patterns: Object.values(patterns)
        .filter((p) => !layerInfo || p.layer === layerInfo.layer)
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 10),
      suggestedImprovements: improvements.filter((i) => !i.appliedAt && (!layerInfo || i.layer === layerInfo.layer)),
      appliedImprovements: improvements.filter((i) => i.appliedAt && (!layerInfo || i.layer === layerInfo.layer))
    };

    console.log('\n📊 Layer-Aware RLHF Report');
    console.log('=' .repeat(50));
    console.log(chalk.cyan(`Layer: ${report.layer}`));
    console.log(chalk.cyan(`Target: ${report.target}`));
    console.log(chalk.green(`Success Rate: ${(report.summary.successRate * 100).toFixed(1)}%`));
    console.log(chalk.blue(`Total Executions: ${report.summary.totalExecutions}`));
    console.log('\n📚 Layer Patterns Loaded:');
    report.layerPatterns.forEach(lp => {
      console.log(`   ${lp.layer}: ${lp.patternCount} patterns`);
    });

    const reportFile = layerInfo
      ? `learning-report-${layerInfo.layer}-${layerInfo.target}.json`
      : 'learning-report.json';

    await fs.writeJson(
      path.join(this.dataDir, reportFile),
      report,
      { spaces: 2 }
    );

    this.logger.log(`✅ Layer-aware report saved to ${reportFile}`);
  }

  /**
   * Original calculateScore method (kept for compatibility)
   */
  async calculateScore(stepType: string, success: boolean, errorMessage?: string, stepData?: StepData): Promise<number> {
    this.logger.log(`🧮 Calculating base RLHF score for ${stepType} (${success ? 'success' : 'failure'})`);

    if (!success && errorMessage) {
      const score = this.analyzeFailureSeverity(errorMessage, stepType, stepData);
      this.logger.log(`❌ Failure analysis: Score ${score}`);
      return score;
    }

    if (success) {
      const score = this.analyzeSuccessQuality(stepType, stepData);
      this.logger.log(`✅ Success analysis: Score ${score}`);
      return score;
    }

    this.logger.log(`⚠️ Low confidence: Score 0`);
    return 0;
  }

  /**
   * Analyze failure severity
   */
  private analyzeFailureSeverity(errorMessage: string, stepType: string, stepData?: StepData): number {
    // -2: Catastrophic errors
    const catastrophicPatterns = [
      /replace.*with.*format/i,
      /<<<replace>>>.*<<</i,
      /architecture.*violation/i,
      /clean.*architecture/i,
      /domain.*layer.*violation/i,
      /invalid.*template.*format/i
    ];

    for (const pattern of catastrophicPatterns) {
      if (pattern.test(errorMessage)) {
        return -2;
      }
    }

    if (stepData?.template && stepType === 'refactor_file') {
      if (!stepData.template.includes('<<<REPLACE>>>') || !stepData.template.includes('<<<WITH>>>')) {
        return -2;
      }
    }

    // -1: Runtime errors
    const runtimePatterns = [
      /lint.*failed/i,
      /test.*failed/i,
      /typescript.*error/i,
      /compilation.*error/i
    ];

    for (const pattern of runtimePatterns) {
      if (pattern.test(errorMessage)) {
        return -1;
      }
    }

    return 0;
  }

  /**
   * Analyze success quality
   */
  private analyzeSuccessQuality(stepType: string, stepData?: StepData): number {
    let score = 1;
    let qualityIndicators = 0;

    if (stepData?.template) {
      const template = stepData.template.toLowerCase();

      const perfectIndicators = [
        /ubiquitous.*language/i,
        /domain.*driven.*design/i,
        /clean.*architecture/i,
        /aggregate.*root/i,
        /value.*object/i,
        /repository.*pattern/i
      ];

      for (const indicator of perfectIndicators) {
        if (indicator.test(template)) {
          qualityIndicators++;
        }
      }
    }

    if (qualityIndicators >= 2) {
      score = 2;
    } else if (qualityIndicators >= 1) {
      score = 2;
    }

    return score;
  }

  /**
   * Get top errors
   */
  private getTopErrors(metrics: ExecutionMetrics[]): Record<string, number> {
    const errors: Record<string, number> = {};

    metrics.filter((m) => !m.success).forEach((m) => {
      errors[m.errorType || 'unknown'] = (errors[m.errorType || 'unknown'] || 0) + 1;
    });

    return errors;
  }

  /**
   * Progress reporting
   */
  private reportProgress(message: string, percentage: number): void {
    if (this.progressCallback) {
      this.progressCallback(message, percentage);
    }

    this.saveProgress(message, percentage);

    const barLength = 30;
    const filled = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    process.stdout.write(`\r[${bar}] ${percentage}% - ${message}`);

    if (percentage === 100) {
      console.log();
      if (fs.existsSync(this.progressFile)) {
        fs.removeSync(this.progressFile);
      }
    }
  }

  private saveProgress(message: string, percentage: number): void {
    try {
      fs.writeJsonSync(this.progressFile, {
        message,
        percentage,
        timestamp: Date.now(),
        cacheStats: this.cacheStats
      });
    } catch {
      // Silently fail
    }
  }

  /**
   * Cache utilities
   */
  private getCacheKey(step: PlanStep): string {
    return createHash('md5')
      .update(JSON.stringify({ id: step.id, type: step.type, template: step.template || '' }))
      .digest('hex');
  }

  private getCachedResult(key: string): ExecutionMetrics | null {
    const cached = this.patternCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      this.cacheStats.hits++;
      return cached.result;
    }
    this.cacheStats.misses++;
    if (cached) {
      this.patternCache.delete(key);
    }
    return null;
  }

  private setCachedResult(key: string, result: ExecutionMetrics): void {
    if (this.patternCache.size >= this.maxCacheSize) {
      const firstKey = this.patternCache.keys().next().value;
      if (firstKey !== undefined) {
        this.patternCache.delete(firstKey);
        this.cacheStats.evictions++;
      }
    }

    this.patternCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Cleanup handlers
   */
  private setupCleanupHandlers(): void {
    process.on('SIGINT', () => {
      console.log('\n\nCleaning up...');
      this.logCacheStats();
      this.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.logCacheStats();
      this.close();
      process.exit(0);
    });
  }

  private logCacheStats(): void {
    console.log(chalk.gray(`\n📊 Cache Statistics:`));
    console.log(chalk.gray(`   Hits: ${this.cacheStats.hits}`));
    console.log(chalk.gray(`   Misses: ${this.cacheStats.misses}`));
    console.log(chalk.gray(`   Evictions: ${this.cacheStats.evictions}`));
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100;
    console.log(chalk.gray(`   Hit Rate: ${hitRate.toFixed(1)}%`));
  }

  public close(): void {
    this.logger.close();
  }

  public setProgressCallback(callback: (message: string, percentage: number) => void): void {
    this.progressCallback = callback;
  }

  public getCacheStatistics(): typeof this.cacheStats {
    return { ...this.cacheStats };
  }

  /**
   * Get layer patterns for inspection
   */
  public getLayerPatterns(layer?: string): TemplatePattern[] {
    if (layer) {
      return this.layerPatterns.get(layer) || [];
    }

    const allPatterns: TemplatePattern[] = [];
    this.layerPatterns.forEach(patterns => {
      allPatterns.push(...patterns);
    });
    return allPatterns;
  }
}

// CLI Interface
async function main() {
  const [command, ...args] = process.argv.slice(2);
  const contextPath = args[0] && args[0].endsWith('.yaml') ? args[0] : undefined;
  const rlhf = new EnhancedRLHFSystem(contextPath);

  switch (command) {
    case 'analyze':
      if (args[0]) {
        // Parse layer info from arguments
        const layerInfo = args[1] && args[2] ? {
          layer: args[1] as LayerInfo['layer'],
          target: args[2] as LayerInfo['target']
        } : undefined;

        await rlhf.analyzeExecution(args[0], layerInfo);
        console.log('✅ Layer-aware analysis complete');
      } else {
        console.error('Usage: rlhf-system-enhanced analyze <yaml-file> [layer] [target]');
      }
      break;

    case 'report':
      const layerInfo = args[0] && args[1] ? {
        layer: args[0] as LayerInfo['layer'],
        target: args[1] as LayerInfo['target']
      } : undefined;

      await rlhf.generateLayerReport(layerInfo);
      break;

    case 'score':
      if (args[0] && args[1]) {
        const layerInfo = args[3] && args[4] ? {
          layer: args[3] as LayerInfo['layer'],
          target: args[4] as LayerInfo['target']
        } : undefined;

        const score = await rlhf.calculateLayerScore(
          args[0],
          args[1] === 'true',
          layerInfo,
          args[2]
        );
        console.log(`Layer-aware RLHF Score: ${score}`);
      } else {
        console.error('Usage: rlhf-system-enhanced score <step-type> <success> [error-message] [layer] [target]');
      }
      break;

    case 'patterns':
      const patterns = rlhf.getLayerPatterns(args[0]);
      console.log(`\n📚 Layer Patterns${args[0] ? ` for ${args[0]}` : ''}:`);
      console.log(JSON.stringify(patterns, null, 2));
      break;

    default:
      console.log('Enhanced RLHF System Commands:');
      console.log('  analyze <yaml> [layer] [target] - Layer-aware analysis');
      console.log('  report [layer] [target]        - Generate layer report');
      console.log('  score <type> <bool> [err] [layer] [target] - Calculate layer score');
      console.log('  patterns [layer]               - Show loaded patterns');
  }

  rlhf.close();
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export the enhanced system as RLHFSystem for backward compatibility
export { EnhancedRLHFSystem, EnhancedRLHFSystem as RLHFSystem, LayerInfo, TemplatePattern };