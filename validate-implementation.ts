#!/usr/bin/env tsx

import { deepStrictEqual } from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';
import { RLHFSystem } from './rlhf-system.js';
import Logger from './logger.js';
import { resolveLogDirectory } from './utils/log-path-resolver.js';



// --- Interfaces para Tipagem Alinhadas com o Novo Template ---
type StepType = 'folder' | 'create_file' | 'refactor_file' | 'delete_file' | 'branch' | 'pull_request';
type StepStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';

interface Reference {
  type: 'external_pattern' | 'internal_code_analysis' | 'internal_guideline' | 'internal_correction';
  source: string;
  description: string;
  [key: string]: unknown;
}

interface StepAction {
  branch_name?: string;
  target_branch?: string;
  source_branch?: string;
  [key: string]: unknown;
}

interface Step {
  id: string;
  type: StepType;
  description: string;
  status: StepStatus;
  rlhf_score: number | null;
  execution_log: string;
  references: Reference[];
  validation_script?: string;
  action?: StepAction;
  [key: string]: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  matches: string[];
  rlhf_score?: number;
  quality_indicators?: string[];
  catastrophic_issues?: string[];
}
/**
 * Validates a feature implementation YAML file against the master template.
 */
class ImplementationValidator {
  private templateContent: Record<string, any> = {};
  private implementationContent: Record<string, any> = {};
  private rlhf: RLHFSystem;
  private logger: Logger;
  private result: ValidationResult = {
    valid: true,
    errors: [],
    matches: [],
    quality_indicators: [],
    catastrophic_issues: [],
  };

  constructor(
    private templatePath: string,
    private implementationPath: string,
  ) {
    this.rlhf = new RLHFSystem(this.implementationPath);

    // Create logs directory for validation
    const logDir = resolveLogDirectory(this.implementationPath, 'validation');
    this.logger = new Logger(logDir);
  }

  /**
   * Runs all validation checks.
   */
  async validate(): Promise<ValidationResult> {
    this.logger.log(`🔍 Starting validation of '${this.implementationPath}' against template '${this.templatePath}'`);

    this.templateContent = yaml.parse(fs.readFileSync(this.templatePath, 'utf-8'));
    this.implementationContent = yaml.parse(fs.readFileSync(this.implementationPath, 'utf-8'));

    console.log(`🔍 Validating implementation '${this.implementationPath}' against template '${this.templatePath}'...\n`);

    this.validateNoPlaceholders();
    this.validateImmutableSections();
    this.validateStructure();
    this.validateSteps();
    this.validateEvaluationSection();
    this.validateArchitecturalQuality(); // <-- NOVA VALIDAÇÃO ARQUITETURAL
    await this.calculateRLHFScore(); // <-- SCORE RLHF

    this.printResults();

    this.logger.log(`✅ Validation completed. Valid: ${this.result.valid}, RLHF Score: ${this.result.rlhf_score}`);
    return this.result;
  }

  /**
   * CRITICAL CHECK: Ensures no __PLACEHOLDER__ variables are left in the dynamic sections of the file.
   * It ignores placeholders found in immutable documentation sections.
   */
  private validateNoPlaceholders(): void {
    console.log('🔎 Checking for unresolved placeholders...');

    // Criamos uma cópia profunda do objeto para poder modificá-lo sem afetar outras funções.
    const contentToCheck = JSON.parse(JSON.stringify(this.implementationContent));

    // Seções que são cópias literais do template e podem conter [placeholders] de exemplo.
    const immutableDocSections = ['troubleshooting', 'refactoring', 'recovery', 'ai_guidelines'];

    // Remove as seções imutáveis da cópia antes de procurar por placeholders.
    for (const section of immutableDocSections) {
      delete contentToCheck[section];
    }

    const contentString = JSON.stringify(contentToCheck);
    const placeholderRegex = /__([A-Z_]+)__/g;
    const matches = contentString.match(placeholderRegex);

    if (matches) {
      const uniqueMatches = [...new Set(matches)];
      this.logger.log(`❌ Found unresolved placeholders: ${uniqueMatches.join(', ')}`);
      this.result.errors.push(
        `❌ CRITICAL ERROR: Found unresolved placeholders in dynamic sections: ${uniqueMatches.join(', ')}.\n` +
        `   ➡️ AI ACTION: You MUST replace every placeholder variable (like __FEATURE_NAME_KEBAB_CASE__) with a specific value for your feature.`
      );
    } else {
      this.logger.log('✅ No unresolved placeholders found');
      this.result.matches.push('✅ No unresolved placeholders found in dynamic content.');
    }
  }

  /**
   * Ensures that architectural rules and documentation sections have not been modified.
   */
  private validateImmutableSections(): void {
    console.log('📜 Validating immutable rule and documentation sections...');
    const sectionsToCompare = [
      'layer_rules', 'domain_rules', 'use_case_rules', 'error_rules',
      'test_helper_rules', 'troubleshooting', 'refactoring', 'recovery', 'ai_guidelines'
    ];

    for (const section of sectionsToCompare) {
      if (!this.templateContent[section] || !this.implementationContent[section]) {
        this.result.errors.push(
          `❌ ERROR: The required section '${section}' is missing.\n` +
          `   ➡️ AI ACTION: You MUST include this section in your implementation file, copied exactly from the template.`
        );
        continue;
      }
      try {
        deepStrictEqual(this.templateContent[section], this.implementationContent[section]);
        this.result.matches.push(`✅ Section '${section}' is a perfect copy of the template.`);
      } catch (error) {
        this.result.errors.push(
          `❌ ERROR: The content of the immutable section '${section}' has been modified.\n` +
          `   ➡️ AI ACTION: You MUST copy this section exactly as it is from the template file. Do not change it.`
        );
      }
    }
  }

  /**
   * Validates the feature's folder structure definition.
   */
  private validateStructure(): void {
    console.log('📁 Validating folder structure definition...');
    if (!this.templateContent.structure || !this.implementationContent.structure) {
      this.result.errors.push(`❌ ERROR: The 'structure' section is missing.`);
      return;
    }

    const templateBasePath = this.templateContent.structure.basePath as string;
    const implementationBasePath = this.implementationContent.structure.basePath as string;

    if (!templateBasePath || !implementationBasePath) {
      this.result.errors.push(`❌ ERROR: The 'basePath' key is missing inside the 'structure' section.`);
      return;
    }

    const featureNameRegex = /src\/features\/(.*?)\/domain/;
    const featureNameMatch = implementationBasePath.match(featureNameRegex);

    if (!featureNameMatch) {
      this.result.errors.push(`❌ ERROR: The implementation 'basePath' ('${implementationBasePath}') does not match the expected pattern 'src/features/.../domain'.`);
      return;
    }

    const featureName = featureNameMatch[1];
    const expectedBasePath = templateBasePath.replace('__FEATURE_NAME_KEBAB_CASE__', featureName);

    if (expectedBasePath !== implementationBasePath) {
      this.result.errors.push(`❌ ERROR: The implementation 'basePath' ('${implementationBasePath}') does not correctly match the template pattern ('${expectedBasePath}').`);
    } else {
      this.result.matches.push('✅ Feature folder structure is correctly defined.');
    }
  }

  /**
   * Validates the dynamically generated 'steps' section.
   */
  private validateSteps(): void {
    console.log('👣 Validating code generation steps...');
    if (!this.implementationContent.steps || !Array.isArray(this.implementationContent.steps)) {
      this.result.errors.push(`❌ ERROR: The 'steps' section is missing or is not an array.`);
      return;
    }

    const implementationSteps = this.implementationContent.steps as Step[];
    const allowedTypes: StepType[] = ['folder', 'create_file', 'refactor_file', 'delete_file', 'branch', 'pull_request'];

    // Check if first step is branch creation
    if (implementationSteps.length > 0 && implementationSteps[0].type !== 'branch') {
      this.result.errors.push(
        `❌ ERROR: The first step should be 'branch' type to create a feature branch.\n` +
        `   ➡️ AI ACTION: Add a 'create-feature-branch' step as the first step in your implementation.`
      );
    }

    // Check if last step is PR creation
    const lastStep = implementationSteps[implementationSteps.length - 1];
    if (lastStep && lastStep.type !== 'pull_request') {
      console.log(`⚠️ WARNING: Consider adding a 'pull_request' step at the end to automate PR creation to staging.`);
    }

    implementationSteps.forEach((implStep, index) => {
      const stepId = implStep.id || `step at index ${index}`;
      console.log(`  -> Validating step: ${stepId}`);

      // 1. Validar a presença e tipo dos campos obrigatórios
      if (implStep.execution_log !== '') {
        this.result.errors.push(`❌ ERROR in step '${stepId}': Initial execution_log must be empty.`);
      }

      if (!implStep.id || !implStep.type || !implStep.description || !implStep.status) {
        this.result.errors.push(`❌ ERROR in step '${stepId}': Missing one or more required fields: id, type, description, status.`);
      }
      if (implStep.status !== 'PENDING') {
        this.result.errors.push(`❌ ERROR in step '${stepId}': Initial status must be 'PENDING', but found '${implStep.status}'.`);
      }
      if (!allowedTypes.includes(implStep.type)) {
        this.result.errors.push(`❌ ERROR in step '${stepId}': Invalid type '${implStep.type}'.`);
      }

      // References are optional for some step types
      const stepsRequiringReferences = ['create_file', 'refactor_file'];
      if (stepsRequiringReferences.includes(implStep.type)) {
        if (!implStep.references || !Array.isArray(implStep.references) || implStep.references.length === 0) {
          this.result.errors.push(`❌ ERROR in step '${stepId}': The 'references' array must exist and cannot be empty for ${implStep.type} steps.`);
        }
      }

      // 2. Type-specific validations
      if (implStep.type === 'branch') {
        if (!implStep.action || !implStep.action.branch_name) {
          this.result.errors.push(
            `❌ ERROR in step '${stepId}': Branch step missing 'action.branch_name'.\n` +
            `   ➡️ AI ACTION: Add 'action.branch_name' with format 'feat/[feature-name]-domain'.`
          );
        } else if (!implStep.action.branch_name.startsWith('feat/')) {
          this.result.errors.push(
            `❌ ERROR in step '${stepId}': Branch name should follow pattern 'feat/[feature-name]-domain'.\n` +
            `   ➡️ AI ACTION: Update branch name to start with 'feat/' prefix.`
          );
        }
      }

      if (implStep.type === 'pull_request') {
        if (!implStep.action || !implStep.action.target_branch || !implStep.action.source_branch) {
          this.result.errors.push(
            `❌ ERROR in step '${stepId}': PR step missing required action fields.\n` +
            `   ➡️ AI ACTION: Add 'action.target_branch' (usually 'staging') and 'action.source_branch'.`
          );
        }
        if (implStep.action && implStep.action.target_branch !== 'staging') {
          console.log(`⚠️ WARNING in step '${stepId}': PR target branch is '${implStep.action.target_branch}' instead of 'staging'. Make sure this is intentional.`);
        }
      }

      // 3. Validar template REPLACE/WITH para refactor_file
      if (implStep.type === 'refactor_file') {
        this.validateRefactorTemplate(implStep, stepId);
      }

      // 4. Validar o script de validação (se existir)
      if (implStep.validation_script) {
        const script = implStep.validation_script;

        // Different validation rules for different step types
        if (implStep.type === 'branch') {
          if (!script.includes('git checkout')) {
            this.result.errors.push(
              `❌ ERROR in step '${stepId}': Branch validation script missing 'git checkout' command.\n` +
              `   ➡️ AI ACTION: Add branch creation/checkout logic to validation script.`
            );
          }
        } else if (implStep.type === 'pull_request') {
          if (!script.includes('gh pr create') && !script.includes('hub pull-request')) {
            console.log(`⚠️ WARNING in step '${stepId}': PR creation script doesn't use GitHub CLI. Manual PR creation may be required.`);
          }
        } else if (implStep.type !== 'folder') {
          // Other steps should have git commit
          if (!script.includes('git commit')) {
            this.result.errors.push(`❌ ERROR in step '${stepId}': The 'validation_script' is missing a 'git commit' command.`);
          }
        }

        this.result.matches.push(`✅ Validation script for step '${stepId}' seems correct.`);
      }
    });
  }

  private validateEvaluationSection(): void {
    console.log('📊 Validating evaluation section...');
    if (!this.implementationContent.evaluation) {
      this.result.errors.push(`❌ ERROR: The 'evaluation' section is missing from the implementation file.`);
      return;
    }

    const evalSection = this.implementationContent.evaluation;
    if (evalSection.final_status !== 'PENDING') {
      this.result.errors.push(`❌ ERROR in 'evaluation': Initial final_status must be 'PENDING'.`);
    }
    if (evalSection.final_rlhf_score !== null) {
      this.result.errors.push(`❌ ERROR in 'evaluation': Initial final_rlhf_score must be null.`);
    }
    if (!evalSection.reviewer_summary || !evalSection.template_improvement_suggestions) {
      this.result.errors.push(`❌ ERROR in 'evaluation': Missing 'reviewer_summary' or 'template_improvement_suggestions' sections.`);
    }

    this.result.matches.push('✅ Evaluation section is correctly structured.');
  }

  /**
   * Validates REPLACE/WITH template syntax for refactor_file steps
   */
  private validateRefactorTemplate(step: Step, stepId: string): void {
    if (!step.template) {
      this.result.errors.push(
        `❌ CATASTROPHIC ERROR in step '${stepId}': refactor_file step missing 'template' field.\n` +
        `   ➡️ AI ACTION: Add 'template' field with <<<REPLACE>>> and <<<WITH>>> blocks.`
      );
      this.result.catastrophic_issues?.push(`Missing template in refactor_file step '${stepId}'`);
      return;
    }

    const template = step.template as string;

    // Check for REPLACE block
    if (!template.includes('<<<REPLACE>>>')) {
      this.result.errors.push(
        `❌ CATASTROPHIC ERROR in step '${stepId}': Missing '<<<REPLACE>>>' block in refactor template.\n` +
        `   ➡️ AI ACTION: Add '<<<REPLACE>>>' block with the code to be replaced.`
      );
      this.result.catastrophic_issues?.push(`Missing REPLACE block in step '${stepId}'`);
    }

    // Check for WITH block
    if (!template.includes('<<<WITH>>>')) {
      this.result.errors.push(
        `❌ CATASTROPHIC ERROR in step '${stepId}': Missing '<<<WITH>>>' block in refactor template.\n` +
        `   ➡️ AI ACTION: Add '<<<WITH>>>' block with the new code.`
      );
      this.result.catastrophic_issues?.push(`Missing WITH block in step '${stepId}'`);
    }

    // Check for closing tags
    if (!template.includes('<<</REPLACE>>>')) {
      this.result.errors.push(
        `❌ CATASTROPHIC ERROR in step '${stepId}': Missing '<<</REPLACE>>>' closing tag.\n` +
        `   ➡️ AI ACTION: Add '<<</REPLACE>>>' to close the REPLACE block.`
      );
      this.result.catastrophic_issues?.push(`Missing REPLACE closing tag in step '${stepId}'`);
    }

    if (!template.includes('<<</WITH>>>')) {
      this.result.errors.push(
        `❌ CATASTROPHIC ERROR in step '${stepId}': Missing '<<</WITH>>>' closing tag.\n` +
        `   ➡️ AI ACTION: Add '<<</WITH>>>' to close the WITH block.`
      );
      this.result.catastrophic_issues?.push(`Missing WITH closing tag in step '${stepId}'`);
    }

    // If all blocks are present, validate structure
    if (template.includes('<<<REPLACE>>>') && template.includes('<<<WITH>>>') &&
        template.includes('<<</REPLACE>>>') && template.includes('<<</WITH>>>')) {
      this.result.matches.push(`✅ Refactor template syntax is correct for step '${stepId}'.`);
    }
  }

  /**
   * Validates architectural quality indicators for RLHF +2 scoring
   */
  private validateArchitecturalQuality(): void {
    console.log('🏗️ Analyzing architectural quality and domain design...');

    const implementationString = JSON.stringify(this.implementationContent).toLowerCase();

    // Perfect execution indicators (+2 score)
    const qualityPatterns = [
      { pattern: /ubiquitous.*language/i, indicator: 'Uses ubiquitous language terminology' },
      { pattern: /domain.*driven.*design/i, indicator: 'Follows Domain-Driven Design principles' },
      { pattern: /clean.*architecture/i, indicator: 'Applies Clean Architecture concepts' },
      { pattern: /aggregate.*root/i, indicator: 'Implements Aggregate Root pattern' },
      { pattern: /value.*object/i, indicator: 'Uses Value Objects' },
      { pattern: /domain.*event/i, indicator: 'Implements Domain Events' },
      { pattern: /repository.*pattern/i, indicator: 'Uses Repository pattern' },
      { pattern: /interface.*segregation/i, indicator: 'Applies Interface Segregation' },
      { pattern: /dependency.*inversion/i, indicator: 'Uses Dependency Inversion' },
      { pattern: /single.*responsibility/i, indicator: 'Follows Single Responsibility Principle' }
    ];

    let qualityScore = 0;
    for (const { pattern, indicator } of qualityPatterns) {
      if (pattern.test(implementationString)) {
        this.result.quality_indicators?.push(indicator);
        this.result.matches.push(`🏆 ${indicator}`);
        qualityScore++;
      }
    }

    // Check for proper domain layer structure
    const steps = this.implementationContent.steps as Step[];
    const hasProperStructure = steps?.some(step =>
      step.type === 'folder' &&
      JSON.stringify(step).includes('domain')
    );

    if (hasProperStructure) {
      this.result.quality_indicators?.push('Proper domain layer structure');
      this.result.matches.push('🏆 Proper domain layer structure defined');
      qualityScore++;
    }

    // Check for proper branch naming convention
    const branchStep = steps?.find(step => step.type === 'branch');
    if (branchStep?.action?.branch_name?.includes('feat/') &&
        branchStep.action.branch_name.includes('-domain')) {
      this.result.quality_indicators?.push('Perfect branch naming convention');
      this.result.matches.push('🏆 Perfect branch naming convention');
      qualityScore++;
    }

    console.log(`   Found ${qualityScore} quality indicators for potential +2 RLHF score.`);
  }

  /**
   * Calculate RLHF score for the implementation
   */
  private async calculateRLHFScore(): Promise<void> {
    console.log('🤖 Calculating RLHF validation score...');
    this.logger.log('🤖 Starting RLHF score calculation for validation');

    // Determine success based on validation result
    const success = this.result.errors.length === 0;

    // Prepare error message if there are errors
    const errorMessage = this.result.errors.length > 0
      ? this.result.errors.join('\n')
      : undefined;

    // Calculate score using RLHF system
    this.result.rlhf_score = await this.rlhf.calculateScore(
      'validation',
      success,
      errorMessage,
      this.implementationContent
    );

    // Adjust score based on quality indicators and catastrophic issues
    if (this.result.catastrophic_issues && this.result.catastrophic_issues.length > 0) {
      this.result.rlhf_score = -2; // Force catastrophic score
    } else if (this.result.quality_indicators && this.result.quality_indicators.length >= 3) {
      this.result.rlhf_score = Math.max(this.result.rlhf_score || 0, 2); // Boost to perfect score
    }

    console.log(`   RLHF Validation Score: ${this.result.rlhf_score}`);
    this.logger.log(`📊 Final RLHF validation score: ${this.result.rlhf_score}`);
  }

  /**
   * Prints the final validation results to the console.
   */
  private printResults(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 Implementation Validation Results');
    console.log('═'.repeat(80));

    // RLHF Score with visual feedback
    if (this.result.rlhf_score !== undefined) {
      const scoreEmoji = this.getScoreEmoji(this.result.rlhf_score);
      const scoreColor = this.getScoreColor(this.result.rlhf_score);
      console.log(scoreColor(`\n🤖 RLHF Validation Score: ${this.result.rlhf_score} ${scoreEmoji}`));

      if (this.result.rlhf_score >= 2) {
        console.log('🏆 PERFECT: Exceptional architectural quality with DDD principles!');
      } else if (this.result.rlhf_score >= 1) {
        console.log('✅ GOOD: Well-structured implementation following best practices.');
      } else if (this.result.rlhf_score >= 0) {
        console.log('⚠️ UNCERTAIN: Some quality concerns or missing architectural elements.');
      } else if (this.result.rlhf_score >= -1) {
        console.log('❌ RUNTIME ISSUES: Problems that will cause execution failures.');
      } else {
        console.log('💥 CATASTROPHIC: Fundamental architectural or format violations.');
      }
    }

    // Quality indicators
    if (this.result.quality_indicators && this.result.quality_indicators.length > 0) {
      console.log('\n🏆 Architectural Quality Indicators:');
      this.result.quality_indicators.forEach(qi => console.log(`   🎯 ${qi}`));
    }

    // Catastrophic issues
    if (this.result.catastrophic_issues && this.result.catastrophic_issues.length > 0) {
      console.log('\n💥 Catastrophic Issues Detected:');
      this.result.catastrophic_issues.forEach(ci => console.log(`   🚨 ${ci}`));
    }

    if (this.result.matches.length > 0) {
      console.log('\n✅ Checks Passed:');
      this.result.matches.forEach(m => console.log(`   ${m}`));
    }

    if (this.result.errors.length > 0) {
      this.result.valid = false;
      console.log('\n❌ VALIDATION FAILED. AI Action Required:');
      this.result.errors.forEach(e => console.log(`\n   ${e}`));
    }

    console.log('\n' + '═'.repeat(80));
    if (this.result.valid) {
      console.log('✅ SUCCESS: The implementation file is 100% compliant with the template!');
    } else {
      console.log('❌ FAILURE: The implementation file violates the template rules.');
      console.log('   To fix these errors, review the instructions above, modify your implementation file,');
      console.log('   and then re-run this validation script.');
    }
    console.log('═'.repeat(80));
  }

  /**
   * Get emoji based on RLHF score
   */
  private getScoreEmoji(score: number): string {
    if (score >= 2) return '🏆'; // Perfect execution
    if (score >= 1) return '✅'; // Good execution
    if (score >= 0) return '⚠️'; // Low confidence
    if (score >= -1) return '❌'; // Runtime error
    return '💥'; // Catastrophic error
  }

  /**
   * Get color function based on RLHF score
   */
  private getScoreColor(score: number): (text: string) => string {
    if (score >= 2) return (text: string) => `\x1b[32m\x1b[1m${text}\x1b[0m`; // Green bold
    if (score >= 1) return (text: string) => `\x1b[32m${text}\x1b[0m`; // Green
    if (score >= 0) return (text: string) => `\x1b[33m${text}\x1b[0m`; // Yellow
    if (score >= -1) return (text: string) => `\x1b[31m${text}\x1b[0m`; // Red
    return (text: string) => `\x1b[31m\x1b[1m${text}\x1b[0m`; // Red bold
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Error: Please provide paths for the template YAML and the implementation YAML.');
    console.log('Usage: tsx validate-implementation.ts <template.yaml> <implementation.yaml>');
    process.exit(1);
  }

  const [templatePath, implementationPath] = args;
  const validator = new ImplementationValidator(templatePath, implementationPath);
  const result = await validator.validate();

  // Clean up resources
  (validator as any).rlhf.close();
  (validator as any).logger.close();

  process.exit(result.valid ? 0 : 1);
}

// --- ES Module safe entry point check ---
const currentFilePath = fileURLToPath(import.meta.url);
const scriptPath = fs.realpathSync(process.argv[1]);

if (currentFilePath === scriptPath) {
  main().catch(console.error);
}