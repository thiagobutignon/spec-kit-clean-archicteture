#!/usr/bin/env tsx

import { deepStrictEqual } from 'assert';
import * as fs from 'fs';
import * as yaml from 'yaml';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  matches: string[];
}

/**
 * Validates a feature implementation YAML file against the master template.
 * It checks for placeholder completion, rule immutability, and structural integrity.
 */
class ImplementationValidator {
  private templateContent: any;
  private implementationContent: any;
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
   * CRITICAL CHECK: Ensures no __PLACEHOLDER__ variables are left in the implementation file,
   * except for exactly 2 allowed occurrences of __FEATURE_NAME_KEBAB_CASE__ in:
   * 1. AI-NOTE comment (line ~120)
   * 2. ai_guidelines section (immutable)
   */
  private validateNoPlaceholders(): void {
    console.log('🔎 Checking for unresolved placeholders...');

    // Read the raw file content to check placeholders accurately
    const rawContent = fs.readFileSync(this.implementationPath, 'utf-8');

    const placeholderRegex = /__([A-Z_]+)__/g; // Updated Regex for __PLACEHOLDER__
    const matches = rawContent.match(placeholderRegex);

    if (matches) {
      // Count occurrences of each placeholder
      const placeholderCounts: Record<string, number> = {};
      matches.forEach((match: string) => {
        placeholderCounts[match] = (placeholderCounts[match] || 0) + 1;
      });

      // Check if __FEATURE_NAME_KEBAB_CASE__ has exactly 2 occurrences
      const featurePlaceholder = '__FEATURE_NAME_KEBAB_CASE__';
      const featureCount = placeholderCounts[featurePlaceholder] || 0;

      // Remove __FEATURE_NAME_KEBAB_CASE__ from the counts if it has exactly 2 occurrences
      // These are allowed in: AI-NOTE comment and ai_guidelines section
      if (featureCount === 2) {
        delete placeholderCounts[featurePlaceholder];
      }

      // Check for any remaining placeholders
      const remainingPlaceholders = Object.keys(placeholderCounts);

      if (remainingPlaceholders.length > 0) {
        this.result.errors.push(
          `❌ CRITICAL ERROR: Found unresolved placeholders: ${remainingPlaceholders.join(', ')}.\n` +
          `   ➡️ AI ACTION: You MUST replace every __PLACEHOLDER__ with a specific value for your feature.`
        );
      } else if (featureCount !== 2 && featureCount > 0) {
        this.result.errors.push(
          `❌ ERROR: Found ${featureCount} occurrence(s) of __FEATURE_NAME_KEBAB_CASE__, but exactly 2 are expected.\n` +
          `   ➡️ AI ACTION: Ensure __FEATURE_NAME_KEBAB_CASE__ appears exactly twice: once in the AI-NOTE comment (line ~120) and once in ai_guidelines section.`
        );
      } else if (featureCount === 0) {
        // All placeholders replaced - this is valid
        this.result.matches.push('✅ All placeholders have been properly replaced.');
      } else {
        this.result.matches.push('✅ __FEATURE_NAME_KEBAB_CASE__ appears exactly 2 times as expected (AI-NOTE and ai_guidelines).');
      }
    } else {
      this.result.matches.push('✅ All placeholders have been properly replaced.');
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
          `❌ ERROR: The required section '${section}' is missing from the template or the implementation.\n` +
          `   ➡️ AI ACTION: You MUST include this section in your implementation file.`
        );
        continue;
      }
      try {
        deepStrictEqual(this.templateContent[section], this.implementationContent[section]);
        this.result.matches.push(`✅ Section '${section}' is a perfect copy of the template.`);
      } catch (error) {
        this.result.errors.push(
          `❌ ERROR: The content of the immutable section '${section}' has been modified.\n` +
          `   ➡️ AI ACTION: You MUST copy this section exactly as it is from the template file. Do not add, remove, or change any content within it.`
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
      this.result.errors.push(
        `❌ ERROR: The 'structure' section is missing.\n` +
        `   ➡️ AI ACTION: Your implementation file MUST contain a 'structure' section.`
      );
      return;
    }

    const templateBasePath = this.templateContent.structure.basePath;
    const implementationBasePath = this.implementationContent.structure.basePath;

    if (!templateBasePath || !implementationBasePath) {
      this.result.errors.push(
        `❌ ERROR: The 'basePath' key is missing inside the 'structure' section.\n` +
        `   ➡️ AI ACTION: Ensure the 'structure' section contains a 'basePath' key.`
      );
      return;
    }

    const featureNameRegex = /src\/features\/(.*?)\/domain/;
    const featureNameMatch = implementationBasePath.match(featureNameRegex);

    if (!featureNameMatch) {
      this.result.errors.push(
        `❌ ERROR: The implementation 'basePath' ('${implementationBasePath}') does not match the expected pattern 'src/features/.../domain'.\n` +
        `   ➡️ AI ACTION: Correct the 'basePath' to follow the required directory structure.`
      );
      return;
    }

    const featureName = featureNameMatch[1];
    const expectedBasePath = templateBasePath.replace('__FEATURE_NAME_KEBAB_CASE__', featureName);

    if (expectedBasePath !== implementationBasePath) {
      this.result.errors.push(
        `❌ ERROR: The implementation 'basePath' ('${implementationBasePath}') does not correctly match the template pattern ('${expectedBasePath}').\n` +
        `   ➡️ AI ACTION: Ensure the basePath correctly replaces __FEATURE_NAME_KEBAB_CASE__ with your feature's name in kebab-case.`
      );
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
      this.result.errors.push(
        `❌ ERROR: The 'steps' section is missing.\n` +
        `   ➡️ AI ACTION: Your implementation file MUST contain a 'steps' section with instantiated tasks.`
      );
      return;
    }

    const templateSteps = this.templateContent.steps;
    const implementationSteps = this.implementationContent.steps;

    implementationSteps.forEach((implStep: any) => {
      const templateStep = templateSteps.find((ts: any) => implStep.id.startsWith(ts.id.split('__')[0]));

      if (!templateStep) {
        this.result.errors.push(
          `❌ ERROR: Could not find a matching template for the implementation step with id '${implStep.id}'.\n` +
          `   ➡️ AI ACTION: Ensure your step IDs are generated by replicating the generic step IDs from the template (e.g., 'create-use-case-__ACTION_ENTITY_KEBAB_CASE__' becomes 'create-use-case-add-item').`
        );
        return;
      }

      console.log(`  -> Validating step: ${implStep.id}`);

      const script = implStep.validation_script;
      if (!script || !script.includes('yarn lint') || !script.includes('yarn test') || !script.includes('git commit')) {
          this.result.errors.push(
            `❌ ERROR: The 'validation_script' for step '${implStep.id}' is missing or incomplete.\n` +
            `   ➡️ AI ACTION: Each step MUST have a complete validation script that includes 'yarn lint', 'yarn test', and 'git commit' commands, based on the template.`
          );
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

if (require.main === module) {
  main().catch(console.error);
}