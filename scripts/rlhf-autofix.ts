#!/usr/bin/env tsx

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import chalk from 'chalk';
import { execSync } from 'child_process';

/**
 * RLHF Auto-Fix System
 * Automatically fixes common issues based on RLHF scoring
 */

interface StepWithTemplate {
  id: string;
  type?: string;
  template?: string;
  validation_script?: string;
  action?: {
    branch_name?: string;
  };
  needsManualFix?: boolean;
  mockInput?: unknown;
  mockOutput?: unknown;
}

interface AutoFix {
  pattern: RegExp;
  errorType: string;
  rlhfScore: number;
  fix: (step: StepWithTemplate, error: string) => StepWithTemplate;
  description: string;
}

class RLHFAutoFix {
  private fixes: AutoFix[] = [
    {
      pattern: /missing semicolon/i,
      errorType: 'lint',
      rlhfScore: -1,
      description: 'Add missing semicolons',
      fix: (step) => {
        if (step.template) {
          // Add semicolons to interface methods
          step.template = step.template.replace(
            /(\): Promise<[^>]+>)(\s*\n\s*})/g,
            '$1;$2'
          );
        }
        return step;
      }
    },
    {
      pattern: /import.*from.*(axios|fetch|prisma|express)/,
      errorType: 'architecture',
      rlhfScore: -2,
      description: 'Remove external dependencies from domain layer',
      fix: (step) => {
        if (step.template) {
          // Remove external dependency imports
          step.template = step.template
            .replace(/import.*from.*['"]axios['"].*\n/g, '')
            .replace(/import.*from.*['"]fetch['"].*\n/g, '')
            .replace(/import.*from.*['"]prisma['"].*\n/g, '')
            .replace(/import.*from.*['"]express['"].*\n/g, '');

          // Add domain documentation
          if (!step.template.includes('@domainConcept')) {
            step.template = `/**
 * @domainConcept ${step.id.replace(/-/g, ' ')}
 * @pattern Clean Architecture - Domain Layer
 * @principle No external dependencies
 */
${step.template}`;
          }
        }
        return step;
      }
    },
    {
      pattern: /<<<REPLACE>>>.*<<<\/REPLACE>>>/s,
      errorType: 'template',
      rlhfScore: -2,
      description: 'Fix REPLACE/WITH syntax',
      fix: (step) => {
        if (step.template && step.type === 'refactor_file') {
          // Check if REPLACE/WITH blocks are malformed
          const hasReplace = step.template.includes('<<<REPLACE>>>');
          const hasWith = step.template.includes('<<<WITH>>>');

          if (!hasReplace || !hasWith) {
            console.log(chalk.red('⚠️ Missing REPLACE or WITH blocks - manual fix required'));
            step.needsManualFix = true;
          }
        }
        return step;
      }
    },
    {
      pattern: /branch.*already exists/i,
      errorType: 'git',
      rlhfScore: -1,
      description: 'Handle existing branch',
      fix: (step) => {
        if (step.validation_script) {
          // Update validation script to check and checkout existing branch
          step.validation_script = `
# Check if branch exists before creating
BRANCH_NAME="${step.action?.branch_name || 'feature-branch'}"
if git show-ref --quiet refs/heads/$BRANCH_NAME; then
  echo "🔀 Branch exists, checking out..."
  git checkout $BRANCH_NAME
else
  echo "🌿 Creating new branch..."
  git checkout -b $BRANCH_NAME
fi
`;
        }
        return step;
      }
    },
    {
      pattern: /uncommitted changes/i,
      errorType: 'git',
      rlhfScore: -1,
      description: 'Stash uncommitted changes',
      fix: (step) => {
        if (step.validation_script) {
          // Add git stash before operations
          step.validation_script = `
# Stash any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "📦 Stashing uncommitted changes..."
  git stash push -m "Auto-stash before ${step.id}"
fi

${step.validation_script}

# Pop stash if we stashed
if git stash list | grep -q "Auto-stash before ${step.id}"; then
  echo "📦 Restoring stashed changes..."
  git stash pop
fi
`;
        }
        return step;
      }
    },
    {
      pattern: /missing.*mock.*data/i,
      errorType: 'test',
      rlhfScore: 0,
      description: 'Add default mock data',
      fix: (step) => {
        if (step.mockInput === undefined) {
          step.mockInput = {
            id: 'test-id',
            name: 'Test Name',
            createdAt: new Date().toISOString()
          };
        }
        if (step.mockOutput === undefined) {
          step.mockOutput = {
            success: true,
            data: step.mockInput
          };
        }
        return step;
      }
    },
    {
      pattern: /missing.*@domainConcept/i,
      errorType: 'documentation',
      rlhfScore: 0,
      description: 'Add domain documentation',
      fix: (step) => {
        if (step.template && !step.template.includes('@domainConcept')) {
          const conceptName = step.id
            .replace(/create-/, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (l: string) => l.toUpperCase());

          step.template = `/**
 * @domainConcept ${conceptName}
 * @pattern ${step.type === 'create_file' ? 'Domain Entity' : 'Refactoring'}
 * @description Auto-generated domain documentation
 */
${step.template}`;
        }
        return step;
      }
    }
  ];

  async applyFixes(yamlPath: string): Promise<void> {
    console.log(chalk.cyan.bold('🔧 RLHF Auto-Fix System'));
    console.log(chalk.cyan('━'.repeat(50)));

    const content = await fs.readFile(yamlPath, 'utf-8');
    const plan = yaml.parse(content);

    let fixesApplied = 0;
    const fixLog: string[] = [];

    for (const step of plan.steps) {
      if (step.status === 'FAILED' && step.execution_log) {
        const applicableFixes = this.findApplicableFixes(step.execution_log);

        for (const fix of applicableFixes) {
          console.log(chalk.yellow(`\n📍 Applying fix for step: ${step.id}`));
          console.log(chalk.gray(`   Issue: ${fix.description}`));
          console.log(chalk.gray(`   RLHF Score Impact: ${fix.rlhfScore} → +1`));

          const fixedStep = fix.fix(step, step.execution_log);

          if (fixedStep.needsManualFix) {
            console.log(chalk.red(`   ⚠️ Manual intervention required`));
            fixLog.push(`MANUAL: ${step.id} - ${fix.description}`);
          } else {
            // Update the step in the plan
            const stepIndex = plan.steps.findIndex((s: StepWithTemplate) => s.id === step.id);
            plan.steps[stepIndex] = fixedStep;

            // Reset status for retry
            plan.steps[stepIndex].status = 'PENDING';
            plan.steps[stepIndex].execution_log = '';
            plan.steps[stepIndex].rlhf_score = null;

            fixesApplied++;
            fixLog.push(`FIXED: ${step.id} - ${fix.description}`);
            console.log(chalk.green(`   ✅ Fix applied successfully`));
          }
        }
      }
    }

    // Save the fixed plan
    if (fixesApplied > 0) {
      const fixedPath = yamlPath.replace('.yaml', '-fixed.yaml');
      await fs.writeFile(fixedPath, yaml.stringify(plan));

      console.log(chalk.green.bold(`\n✨ ${fixesApplied} fixes applied`));
      console.log(chalk.blue(`📄 Fixed plan saved to: ${fixedPath}`));

      // Save fix log
      const logPath = path.join('.rlhf', 'autofix-log.json');
      await fs.ensureDir('.rlhf');
      await fs.writeJson(logPath, {
        timestamp: new Date(),
        originalFile: yamlPath,
        fixedFile: fixedPath,
        fixesApplied,
        fixLog
      }, { spaces: 2 });

      console.log(chalk.gray(`📊 Fix log saved to: ${logPath}`));
    } else {
      console.log(chalk.yellow('\n⚠️ No automatic fixes available'));
      console.log(chalk.gray('   Manual intervention may be required'));
    }
  }

  private findApplicableFixes(errorLog: string): AutoFix[] {
    return this.fixes.filter(fix => fix.pattern.test(errorLog));
  }

  async validateFixes(yamlPath: string): Promise<boolean> {
    console.log(chalk.cyan('\n🔍 Validating fixed plan...'));

    try {
      // Run validation
      execSync(`npx tsx validate-implementation.ts templates/DOMAIN_TEMPLATE.yaml ${yamlPath}`, {
        stdio: 'inherit'
      });

      console.log(chalk.green('✅ Validation passed'));
      return true;
    } catch {
      console.log(chalk.red('❌ Validation failed'));
      return false;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log(chalk.red('Usage: npx tsx rlhf-autofix.ts <yaml-file>'));
    process.exit(1);
  }

  const yamlPath = args[0];

  if (!await fs.pathExists(yamlPath)) {
    console.log(chalk.red(`File not found: ${yamlPath}`));
    process.exit(1);
  }

  const autoFix = new RLHFAutoFix();
  await autoFix.applyFixes(yamlPath);

  // Optionally validate the fixed file
  if (args.includes('--validate')) {
    const fixedPath = yamlPath.replace('.yaml', '-fixed.yaml');
    if (await fs.pathExists(fixedPath)) {
      await autoFix.validateFixes(fixedPath);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { RLHFAutoFix };