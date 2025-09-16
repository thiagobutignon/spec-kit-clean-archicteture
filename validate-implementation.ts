#!/usr/bin/env tsx

import { deepStrictEqual } from 'assert';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import * as yaml from 'yaml';

// --- Interfaces para Tipagem ---
interface Step {
  id: string;
  type: 'file' | 'folder';
  validation_script?: string;
  [key: string]: unknown;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  matches: string[];
}

/**
 * Validates a feature implementation YAML file against the master template.
 */
class ImplementationValidator {
  private templateContent: Record<string, any> = {};
  private implementationContent: Record<string, any> = {};
  private result: ValidationResult = {
    valid: true,
    errors: [],
    matches: [],
  };

  constructor(
    private templatePath: string,
    private implementationPath: string,
  ) {}

  /**
   * Runs all validation checks.
   */
  async validate(): Promise<ValidationResult> {
    this.templateContent = yaml.parse(fs.readFileSync(this.templatePath, 'utf-8'));
    this.implementationContent = yaml.parse(fs.readFileSync(this.implementationPath, 'utf-8'));

    console.log(`🔍 Validating implementation '${this.implementationPath}' against template '${this.templatePath}'...\n`);

    this.validateNoPlaceholders();
    this.validateImmutableSections();
    this.validateStructure();
    this.validateSteps();

    this.printResults();
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
      this.result.errors.push(
        `❌ CRITICAL ERROR: Found unresolved placeholders in dynamic sections: ${uniqueMatches.join(', ')}.\n` +
        `   ➡️ AI ACTION: You MUST replace every placeholder variable (like __FEATURE_NAME_KEBAB_CASE__) with a specific value for your feature.`
      );
    } else {
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
    if (!this.templateContent.steps || !this.implementationContent.steps) {
      this.result.errors.push(`❌ ERROR: The 'steps' section is missing.`);
      return;
    }

    const templateSteps = this.templateContent.steps as Step[];
    const implementationSteps = this.implementationContent.steps as Step[];

    implementationSteps.forEach((implStep) => {
      const templateStep = templateSteps.find((ts) => implStep.id.startsWith(ts.id.split('__')[0]));

      if (!templateStep) {
        this.result.errors.push(`❌ ERROR: Could not find a matching template for the implementation step with id '${implStep.id}'.`);
        return;
      }

      console.log(`  -> Validating step: ${implStep.id}`);

      const script = implStep.validation_script;
      if (!script || !script.includes('yarn lint') || !script.includes('yarn test') || !script.includes('git commit')) {
          this.result.errors.push(`❌ ERROR: The 'validation_script' for step '${implStep.id}' is missing or incomplete.`);
      } else {
          this.result.matches.push(`✅ Validation script for step '${implStep.id}' seems correct.`);
      }
    });
  }

  /**
   * Prints the final validation results to the console.
   */
  private printResults(): void {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 Implementation Validation Results');
    console.log('═'.repeat(80));

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

  process.exit(result.valid ? 0 : 1);
}

// --- ES Module safe entry point check ---
const currentFilePath = fileURLToPath(import.meta.url);
const scriptPath = fs.realpathSync(process.argv[1]);

if (currentFilePath === scriptPath) {
  main().catch(console.error);
}