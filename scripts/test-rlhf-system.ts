#!/usr/bin/env tsx

/**
 * RLHF System Test
 *
 * This script tests the complete RLHF (Reinforcement Learning from Human Feedback) system
 * by creating a simple test execution and validating all components work correctly.
 */

import fs from 'fs-extra';
import * as path from 'path';
import { $ } from 'zx';
import chalk from 'chalk';

$.verbose = false;

interface TestResult {
  step: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(step: string, passed: boolean, message: string, details?: any) {
  results.push({ step, passed, message, details });
  const icon = passed ? '✅' : '❌';
  const color = passed ? chalk.green : chalk.red;
  console.log(color(`${icon} ${step}: ${message}`));
  if (details) {
    console.log(chalk.gray(`   ${JSON.stringify(details, null, 2)}`));
  }
}

async function main() {
  console.log(chalk.cyan('\n🧪 Testing RLHF System\n'));
  console.log(chalk.gray('This test validates that all RLHF components work correctly after the refactoring.\n'));

  try {
    // Test 1: Check if execute-steps.ts exists and has correct imports
    console.log(chalk.yellow('\n📋 Test 1: Verify execute-steps.ts imports'));
    const executeStepsPath = path.join(process.cwd(), 'src/execute-steps.ts');
    const executeStepsContent = await fs.readFile(executeStepsPath, 'utf-8');

    const hasCorrectFsImport = executeStepsContent.includes("import fsExtra from 'fs-extra'") &&
                               executeStepsContent.includes("const fs = fsExtra");
    const hasCorrectZxImport = executeStepsContent.includes("import { $, chalk, argv } from 'zx'");
    const noGlobalsImport = !executeStepsContent.includes("import 'zx/globals'");

    logTest(
      'Execute Steps Imports',
      hasCorrectFsImport && hasCorrectZxImport && noGlobalsImport,
      hasCorrectFsImport && hasCorrectZxImport && noGlobalsImport
        ? 'All imports are correct'
        : 'Import issues detected',
      {
        hasCorrectFsImport,
        hasCorrectZxImport,
        noGlobalsImport
      }
    );

    // Test 2: Check if rlhf-system.ts has correct imports
    console.log(chalk.yellow('\n📋 Test 2: Verify rlhf-system.ts imports'));
    const rlhfSystemPath = path.join(process.cwd(), 'src/core/rlhf-system.ts');
    const rlhfSystemContent = await fs.readFile(rlhfSystemPath, 'utf-8');

    const hasCorrectRlhfFsImport = rlhfSystemContent.includes("import fs from 'fs-extra'");

    logTest(
      'RLHF System Imports',
      hasCorrectRlhfFsImport,
      hasCorrectRlhfFsImport ? 'Correct fs-extra import' : 'Incorrect fs import',
      { hasCorrectRlhfFsImport }
    );

    // Test 3: Check TypeScript compilation
    console.log(chalk.yellow('\n📋 Test 3: TypeScript compilation'));
    try {
      await $`npx tsc --noEmit`;
      logTest('TypeScript Compilation', true, 'TypeScript compiles without errors');
    } catch (error) {
      logTest('TypeScript Compilation', false, 'TypeScript compilation failed', error);
    }

    // Test 4: Check ESLint
    console.log(chalk.yellow('\n📋 Test 4: ESLint validation'));
    try {
      await $`npm run lint`;
      logTest('ESLint', true, 'Code passes linting');
    } catch (error) {
      logTest('ESLint', false, 'Linting errors detected');
    }

    // Test 5: Check if RLHF directories exist
    console.log(chalk.yellow('\n📋 Test 5: RLHF directories'));
    const rlhfDirExists = await fs.pathExists('.rlhf');
    const metricsExists = await fs.pathExists('.rlhf/metrics.json');
    const patternsExists = await fs.pathExists('.rlhf/patterns.json');
    const improvementsExists = await fs.pathExists('.rlhf/improvements.json');

    logTest(
      'RLHF Directories',
      rlhfDirExists && metricsExists && patternsExists && improvementsExists,
      'All RLHF files present',
      {
        rlhfDirExists,
        metricsExists,
        patternsExists,
        improvementsExists
      }
    );

    // Test 6: Validate RLHF metrics structure
    console.log(chalk.yellow('\n📋 Test 6: RLHF metrics validation'));
    if (metricsExists) {
      const metrics = await fs.readJson('.rlhf/metrics.json');
      const hasSteps = Array.isArray(metrics.steps) && metrics.steps.length > 0;
      const hasScores = hasSteps ? metrics.steps.every((s: any) => typeof s.score === 'number') : false;

      logTest(
        'RLHF Metrics Structure',
        hasSteps && hasScores,
        hasSteps && hasScores ? 'Metrics are valid' : 'Invalid metrics structure',
        {
          totalSteps: metrics.steps?.length || 0,
          avgScore: hasSteps
            ? (metrics.steps.reduce((acc: number, s: any) => acc + s.score, 0) / metrics.steps.length).toFixed(2)
            : 'N/A'
        }
      );
    } else {
      logTest('RLHF Metrics Structure', false, 'Metrics file does not exist');
    }

    // Test 7: Create a minimal test YAML and validate it can be parsed
    console.log(chalk.yellow('\n📋 Test 7: YAML template validation'));
    const testYamlPath = path.join(process.cwd(), 'test-template.regent');
    const testYaml = `
name: Test Template
description: Minimal test for RLHF system
target: backend
layer: domain

steps:
  - id: test-step-1
    layer: domain
    action: create_file
    path: src/test-file.ts
    template: |
      export const test = 'hello';
`;

    await fs.writeFile(testYamlPath, testYaml);

    try {
      // Try to load and parse the YAML
      const yaml = await import('yaml');
      const content = await fs.readFile(testYamlPath, 'utf-8');
      const parsed = yaml.parse(content);

      logTest(
        'YAML Parsing',
        parsed.name === 'Test Template',
        'YAML template can be parsed correctly',
        { name: parsed.name, steps: parsed.steps?.length }
      );

      // Clean up
      await fs.remove(testYamlPath);
    } catch (error) {
      logTest('YAML Parsing', false, 'Failed to parse YAML template', error);
    }

    // Test 8: Verify fs-extra methods are available
    console.log(chalk.yellow('\n📋 Test 8: fs-extra methods availability'));
    const fsMethods = [
      'pathExists',
      'readFile',
      'writeFile',
      'remove',
      'ensureDir',
      'existsSync',
      'readFileSync'
    ];

    const allMethodsAvailable = fsMethods.every(method => typeof (fs as any)[method] === 'function');

    logTest(
      'fs-extra Methods',
      allMethodsAvailable,
      allMethodsAvailable ? 'All fs-extra methods available' : 'Some methods missing',
      {
        availableMethods: fsMethods.filter(m => typeof (fs as any)[m] === 'function'),
        missingMethods: fsMethods.filter(m => typeof (fs as any)[m] !== 'function')
      }
    );

    // Summary
    console.log(chalk.cyan('\n📊 Test Summary\n'));
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(chalk.white(`Total Tests: ${totalTests}`));
    console.log(chalk.green(`Passed: ${passedTests}`));
    console.log(chalk.red(`Failed: ${failedTests}`));
    console.log(chalk.yellow(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`));

    if (failedTests > 0) {
      console.log(chalk.red('\n❌ Some tests failed. Please review the issues above.\n'));
      process.exit(1);
    } else {
      console.log(chalk.green('\n✅ All tests passed! RLHF system is ready to use.\n'));
      console.log(chalk.cyan('You can now run the executor with:'));
      console.log(chalk.gray('  npx tsx src/execute-steps.ts path/to/your/template.regent\n'));
      process.exit(0);
    }

  } catch (error) {
    console.error(chalk.red('\n💥 Test suite failed with error:'));
    console.error(error);
    process.exit(1);
  }
}

main();
