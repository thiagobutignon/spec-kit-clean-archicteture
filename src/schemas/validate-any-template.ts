#!/usr/bin/env node

import { readFileSync } from 'fs'
import { parse } from 'yaml'
import { resolve } from 'path'
import {
  validateTemplate,
  detectTemplateType,
  validateWorkflowOrder,
  findPlaceholders,
  calculateQualityScore
} from './unified-template-schema'

/**
 * Universal CLI tool to validate ANY template YAML file
 * Usage: npx tsx src/schemas/validate-any-template.ts [path-to-yaml]
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

function printHeader(text: string) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(70)}${colors.reset}`)
  console.log(`${colors.bright}${colors.blue}  ${text}${colors.reset}`)
  console.log(`${colors.bright}${colors.blue}${'='.repeat(70)}${colors.reset}\n`)
}

function printSection(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}▶ ${title}${colors.reset}`)
  console.log(`${colors.cyan}${'─'.repeat(50)}${colors.reset}`)
}

function printSuccess(message: string) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`)
}

function printError(message: string) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`)
}

function printWarning(message: string) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`)
}

function printInfo(key: string, value: string | number) {
  console.log(`  ${colors.bright}${key}:${colors.reset} ${value}`)
}

function printQualityScore(score: number) {
  let color = colors.green
  let emoji = '🏆'
  let level = 'EXCELLENT'

  if (score >= 90) {
    emoji = '🏆'
    level = 'EXCELLENT'
    color = colors.green
  } else if (score >= 70) {
    emoji = '✅'
    level = 'GOOD'
    color = colors.green
  } else if (score >= 50) {
    emoji = '⚠️'
    level = 'NEEDS IMPROVEMENT'
    color = colors.yellow
  } else {
    emoji = '❌'
    level = 'POOR'
    color = colors.red
  }

  console.log(`\n${colors.bright}Quality Score: ${color}${score}/100 ${emoji} (${level})${colors.reset}`)
}

function validateAnyTemplate(filePath: string) {
  printHeader('UNIVERSAL TEMPLATE VALIDATOR')

  console.log(`📄 File: ${colors.magenta}${filePath}${colors.reset}`)

  try {
    // Load and parse YAML
    const fileContent = readFileSync(filePath, 'utf-8')
    const yamlData = parse(fileContent, { merge: true }) // Handle YAML anchors

    // Validate with unified schema
    printSection('Schema Validation')
    const result = validateTemplate(yamlData)

    if (!result.success) {
      printError('Template validation failed!')

      if (result.errors) {
        console.log('\n❌ Validation errors:')
        const errors = result.errors.errors.slice(0, 10) // Show first 10 errors
        errors.forEach((error, index) => {
          console.log(`\n${colors.red}Error ${index + 1}:${colors.reset}`)
          console.log(`  Path: ${colors.yellow}${error.path.join('.')}${colors.reset}`)
          console.log(`  Message: ${error.message}`)
        })

        if (result.errors.errors.length > 10) {
          console.log(`\n... and ${result.errors.errors.length - 10} more errors`)
        }
      }
      process.exit(1)
    }

    printSuccess('Schema validation passed!')

    // Show warnings if any
    if (result.warnings && result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      result.warnings.forEach(warning => {
        printWarning(warning)
      })
    }

    const template = result.data!

    // Detect template type
    const templateType = detectTemplateType(template)

    // Display template information
    printSection('Template Information')
    printInfo('Version', template.version)
    printInfo('Type', templateType.toUpperCase())
    printInfo('Title', template.metadata.title)
    printInfo('Source', template.metadata.source)
    printInfo('Layers', template.metadata.layers.join(', '))
    printInfo('Total Steps', template.steps.length)

    // Analyze steps
    printSection('Step Analysis')
    const stepTypes = new Map<string, number>()
    template.steps.forEach(step => {
      stepTypes.set(step.type, (stepTypes.get(step.type) || 0) + 1)
    })

    console.log('\nStep type distribution:')
    stepTypes.forEach((count, type) => {
      printInfo(`  ${type}`, count.toString())
    })

    // Template-specific analysis
    if (templateType === 'data') {
      console.log('\n📊 Data Layer Specific:')
      if (template.metadata.tdd_principles) {
        printInfo('  TDD Principles', template.metadata.tdd_principles.length)
      }
      if (template.required_protocols) {
        printInfo('  Required Protocols', template.required_protocols.length)
      }
    }

    // Validate workflow order
    printSection('Workflow Validation')
    const workflowValidation = validateWorkflowOrder(template.steps)

    if (workflowValidation.valid) {
      printSuccess('Workflow order is correct')
    } else {
      printWarning('Workflow issues detected:')
      workflowValidation.issues.forEach(issue => {
        console.log(`  • ${colors.yellow}${issue}${colors.reset}`)
      })
    }

    // Check for placeholders
    printSection('Placeholder Analysis')
    const placeholders = findPlaceholders(template)

    if (placeholders.length > 0) {
      console.log(`\nFound ${colors.yellow}${placeholders.length}${colors.reset} placeholders:`)

      // Group placeholders by category
      const categories: Record<string, string[]> = {
        feature: [],
        entity: [],
        useCase: [],
        other: []
      }

      placeholders.forEach(p => {
        if (p.includes('FEATURE')) {
          categories.feature.push(p)
        } else if (p.includes('ENTITY')) {
          categories.entity.push(p)
        } else if (p.includes('USE_CASE')) {
          categories.useCase.push(p)
        } else {
          categories.other.push(p)
        }
      })

      Object.entries(categories).forEach(([category, items]) => {
        if (items.length > 0) {
          console.log(`\n  ${colors.bright}${category}:${colors.reset}`)
          items.forEach(item => {
            console.log(`    ${colors.cyan}${item}${colors.reset}`)
          })
        }
      })
    } else {
      printSuccess('No placeholders found - template is ready for use')
    }

    // Check for ubiquitous language
    if (template.metadata.ubiquitousLanguage && template.metadata.ubiquitousLanguage.length > 0) {
      printSection('Ubiquitous Language')
      template.metadata.ubiquitousLanguage.forEach(item => {
        console.log(`  • ${colors.bright}${item.term}:${colors.reset} ${item.definition}`)
      })
    }

    // Check architecture
    if (template.architecture) {
      printSection('Architecture')
      if (template.architecture.dependency_rules) {
        console.log('  Dependency Rules:')
        Object.entries(template.architecture.dependency_rules).forEach(([layer, rules]) => {
          console.log(`    ${colors.bright}${layer}:${colors.reset}`)
          if (rules.can_import_from.length > 0) {
            console.log(`      Can import: ${rules.can_import_from.join(', ')}`)
          }
          if (rules.cannot_import_from.length > 0) {
            console.log(`      Cannot import: ${rules.cannot_import_from.join(', ')}`)
          }
        })
      }
    }

    // Calculate quality score
    printSection('Quality Assessment')
    const qualityScore = calculateQualityScore(template)
    printQualityScore(qualityScore.score)

    console.log('\nScore breakdown:')
    Object.entries(qualityScore.breakdown).forEach(([category, score]) => {
      const maxScore = 20
      const percentage = (score / maxScore) * 100
      const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10))

      let color = colors.green
      if (percentage < 50) color = colors.red
      else if (percentage < 80) color = colors.yellow

      console.log(`  ${category.padEnd(15)} ${color}${bar}${colors.reset} ${score}/${maxScore}`)
    })

    // Improvement suggestions
    if (qualityScore.score < 100) {
      printSection('Improvement Suggestions')

      if (!template.metadata.ubiquitousLanguage || template.metadata.ubiquitousLanguage.length === 0) {
        console.log('  • Add ubiquitous language definitions')
      }
      if (!template.architecture) {
        console.log('  • Add architecture section with dependency rules')
      }
      if (!template.ai_guidelines) {
        console.log('  • Add AI guidelines for better code generation')
      }
      if (!template.troubleshooting) {
        console.log('  • Add troubleshooting section')
      }
      if (workflowValidation.issues.length > 0) {
        console.log('  • Fix workflow order issues')
      }
    }

    // Final summary
    printSection('Summary')

    const status = qualityScore.score >= 70 ? 'PASSED' : 'NEEDS IMPROVEMENT'
    const statusColor = qualityScore.score >= 70 ? colors.green : colors.yellow

    console.log(`\n${statusColor}${colors.bright}Status: ${status}${colors.reset}`)
    console.log(`Template Type: ${templateType.toUpperCase()}`)
    console.log(`Quality Score: ${qualityScore.score}/100`)

    if (qualityScore.score >= 90) {
      console.log(`\n${colors.green}${colors.bright}🎉 Excellent template! Ready for production use.${colors.reset}`)
    } else if (qualityScore.score >= 70) {
      console.log(`\n${colors.green}Good template with room for improvement.${colors.reset}`)
    } else {
      console.log(`\n${colors.yellow}Template needs improvements before production use.${colors.reset}`)
    }

    // Exit with appropriate code
    process.exit(qualityScore.score >= 50 ? 0 : 1)

  } catch (error) {
    printError('Failed to process template file')

    if (error instanceof Error) {
      console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`)

      if (error.message.includes('ENOENT')) {
        console.log('\nFile not found. Check the path.')
      } else if (error.message.includes('Unexpected')) {
        console.log('\nInvalid YAML syntax. Check for errors.')
      }
    } else {
      console.error(error)
    }

    process.exit(1)
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
${colors.bright}Usage:${colors.reset} npx tsx src/schemas/validate-any-template.ts [path-to-yaml]

${colors.bright}Examples:${colors.reset}
  npx tsx src/schemas/validate-any-template.ts templates/DOMAIN_TEMPLATE.yaml
  npx tsx src/schemas/validate-any-template.ts templates/DATA_TEMPLATE_REFACTORED.yaml
  npx tsx src/schemas/validate-any-template.ts templates/TEMPLATE_REFACTORED.yaml

${colors.bright}Description:${colors.reset}
  Universal validator for all template YAML files.
  Validates structure, workflow, architecture, and calculates quality score.

${colors.bright}Exit codes:${colors.reset}
  0 - Template is valid (quality score >= 50)
  1 - Template has issues or low quality
    `)
    process.exit(0)
  }

  const filePath = resolve(args[0])
  validateAnyTemplate(filePath)
}

// Run the CLI
main()