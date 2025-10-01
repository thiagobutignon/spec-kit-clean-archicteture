#!/usr/bin/env tsx
/**
 * Command Consistency Validator
 * Validates that key concepts are consistently referenced across all AI commands
 * Part of Issue #152 - Process for maintaining prompt consistency
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import chalk from 'chalk'

// Get script directory for path resolution
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface ConsistencyRule {
  term: string
  required_in: string[]
  description: string
  severity: 'error' | 'warning'
}

interface ValidationResult {
  passed: boolean
  errors: string[]
  warnings: string[]
}

// Define consistency rules for current architectural patterns
const CONSISTENCY_RULES: ConsistencyRule[] = [
  {
    term: 'sharedComponents',
    required_in: [
      '01-plan-layer-features.md',
      '02-validate-layer-plan.md',
      '03-generate-layer-code.md'
    ],
    description: 'Modular YAML structure field (Issue #117)',
    severity: 'error'
  },
  {
    term: 'useCases',
    required_in: [
      '01-plan-layer-features.md',
      '02-validate-layer-plan.md',
      '03-generate-layer-code.md'
    ],
    description: 'Modular YAML structure field (Issue #117)',
    severity: 'error'
  },
  {
    term: 'Edge Case',
    required_in: [
      '01-plan-layer-features.md',
      '03-generate-layer-code.md'
    ],
    description: 'Edge case guidance (Issue #145)',
    severity: 'warning'
  },
  {
    term: 'RLHF',
    required_in: [
      '01-plan-layer-features.md',
      '02-validate-layer-plan.md',
      '03-generate-layer-code.md',
      '04-reflect-layer-lessons.md',
      '05-evaluate-layer-results.md'
    ],
    description: 'RLHF scoring system',
    severity: 'error'
  },
  {
    term: 'Clean Architecture',
    required_in: [
      '01-plan-layer-features.md',
      '02-validate-layer-plan.md',
      '03-generate-layer-code.md',
      '05-evaluate-layer-results.md'
    ],
    description: 'Core architectural principle',
    severity: 'error'
  }
]

class CommandConsistencyValidator {
  private commandsDir: string
  private result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: []
  }

  constructor(projectRoot?: string) {
    // Resolve commands directory relative to project root
    // Default to script's parent directory (project root)
    const root = projectRoot || path.join(__dirname, '..')
    this.commandsDir = path.join(root, '.claude', 'commands')
  }

  async validate(): Promise<ValidationResult> {
    console.log(chalk.cyan.bold('\n🔍 Validating Command Consistency...\n'))

    for (const rule of CONSISTENCY_RULES) {
      await this.validateRule(rule)
    }

    this.printResults()
    return this.result
  }

  private async validateRule(rule: ConsistencyRule): Promise<void> {
    console.log(chalk.blue(`\n📋 Checking: ${rule.term}`))
    console.log(chalk.gray(`   Description: ${rule.description}`))

    for (const fileName of rule.required_in) {
      const filePath = path.join(this.commandsDir, fileName)

      try {
        const content = await fs.readFile(filePath, 'utf-8')

        if (!content.includes(rule.term)) {
          const message = `${fileName} missing term: "${rule.term}"`

          if (rule.severity === 'error') {
            this.result.errors.push(message)
            this.result.passed = false
            console.log(chalk.red(`   ❌ ${message}`))
          } else {
            this.result.warnings.push(message)
            console.log(chalk.yellow(`   ⚠️  ${message}`))
          }
        } else {
          console.log(chalk.green(`   ✅ ${fileName}`))
        }
      } catch (error) {
        const message = `Failed to read ${fileName}: ${error}`
        this.result.errors.push(message)
        this.result.passed = false
        console.log(chalk.red(`   ❌ ${message}`))
      }
    }
  }

  private printResults(): void {
    console.log('\n' + '═'.repeat(80))
    console.log(chalk.cyan.bold('📊 Validation Results'))
    console.log('═'.repeat(80))

    if (this.result.passed && this.result.warnings.length === 0) {
      console.log(chalk.green.bold('\n✅ ALL CHECKS PASSED'))
      console.log(chalk.green('All commands are consistent with current architectural patterns.'))
    } else {
      if (this.result.errors.length > 0) {
        console.log(chalk.red.bold('\n❌ VALIDATION FAILED'))
        console.log(chalk.red(`\nErrors (${this.result.errors.length}):`))
        this.result.errors.forEach(error => {
          console.log(chalk.red(`   • ${error}`))
        })
      }

      if (this.result.warnings.length > 0) {
        console.log(chalk.yellow(`\n⚠️  Warnings (${this.result.warnings.length}):`))
        this.result.warnings.forEach(warning => {
          console.log(chalk.yellow(`   • ${warning}`))
        })
      }

      console.log(chalk.blue('\n💡 Recommended Actions:'))
      console.log(chalk.blue('   1. Review the Definition of Done checklist:'))
      console.log(chalk.blue('      docs/processes/architectural-change-checklist.md'))
      console.log(chalk.blue('   2. Update missing commands to include required terms'))
      console.log(chalk.blue('   3. Ensure examples and documentation are consistent'))
      console.log(chalk.blue('   4. Run this validator again after making changes'))
    }

    console.log('\n' + '═'.repeat(80))

    if (this.result.passed) {
      console.log(chalk.green('✨ Commands are synchronized and consistent!'))
    } else {
      console.log(chalk.red('🔧 Please fix the errors above to maintain consistency.'))
    }

    console.log('═'.repeat(80) + '\n')
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.cyan.bold('\n📖 Command Consistency Validator\n'))
    console.log(chalk.gray('Validates that key architectural concepts are consistently'))
    console.log(chalk.gray('referenced across all AI command prompts.\n'))
    console.log(chalk.white('Usage:'))
    console.log('  npx tsx scripts/validate-command-consistency.ts')
    console.log('  npm run validate:commands\n')
    console.log(chalk.white('Purpose:'))
    console.log('  Prevents prompt drift by ensuring all commands use consistent')
    console.log('  terminology for core concepts like sharedComponents, useCases,')
    console.log('  RLHF scoring, and Clean Architecture principles.\n')
    console.log(chalk.white('Related:'))
    console.log('  Issue #152 - Process for maintaining prompt consistency')
    console.log('  docs/processes/architectural-change-checklist.md\n')
    process.exit(0)
  }

  const validator = new CommandConsistencyValidator()
  const result = await validator.validate()

  // Exit with error code if validation failed
  process.exit(result.passed ? 0 : 1)
}

// Run if called directly
// More robust check that works across different environments
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url)
  if (process.argv[1] === modulePath || process.argv[1].endsWith('validate-command-consistency.ts')) {
    main().catch(error => {
      console.error(chalk.red('Fatal error:'), error)
      process.exit(1)
    })
  }
}

export { CommandConsistencyValidator, ValidationResult, CONSISTENCY_RULES }
