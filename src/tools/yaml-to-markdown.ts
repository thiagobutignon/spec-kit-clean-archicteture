#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import { parse } from 'yaml'

/**
 * Converts YAML templates to Markdown with frontmatter
 * Makes templates more readable and easier to navigate
 */

interface TemplateYAML {
  version: string
  metadata: {
    title: string
    description: string
    source: string
    lastUpdated: string
    layers?: string[]
    tdd_principles?: string[]
    ubiquitousLanguage?: Array<{
      term: string
      definition: string
    }>
  }
  structure?: any
  architecture?: any
  required_protocols?: any[]
  steps: any[]
  troubleshooting?: any
  refactoring?: any
  recovery?: any
  ai_guidelines?: string[]
  evaluation?: any
  [key: string]: any
}

/**
 * Format a step into readable markdown
 */
function formatStep(step: any, index: number): string {
  const lines: string[] = []

  lines.push(`### Step ${index + 1}: ${step.description}`)
  lines.push('')

  // Basic info
  lines.push(`**ID:** \`${step.id}\``)
  lines.push(`**Type:** \`${step.type}\``)
  lines.push(`**Status:** ${step.status || 'PENDING'}`)

  if (step.rlhf_score !== null && step.rlhf_score !== undefined) {
    lines.push(`**RLHF Score:** ${step.rlhf_score}`)
  }

  lines.push('')

  // References
  if (step.references && step.references.length > 0) {
    lines.push('#### References')
    step.references.forEach((ref: any) => {
      lines.push(`- **${ref.type}**: ${ref.description}`)
      if (ref.source) lines.push(`  - Source: ${ref.source}`)
      if (ref.query) lines.push(`  - Query: \`${ref.query}\``)
      if (ref.url) lines.push(`  - URL: ${ref.url}`)
    })
    lines.push('')
  }

  // Action details
  if (step.action) {
    lines.push('#### Action')
    lines.push('```yaml')
    lines.push(JSON.stringify(step.action, null, 2).replace(/"/g, ''))
    lines.push('```')
    lines.push('')
  }

  // Path for file operations
  if (step.path) {
    lines.push(`**Path:** \`${step.path}\``)
    lines.push('')
  }

  // Template content
  if (step.template) {
    lines.push('#### Template')

    // Try to detect language from file extension in path
    let lang = 'typescript'
    if (step.path) {
      if (step.path.endsWith('.yaml')) lang = 'yaml'
      else if (step.path.endsWith('.json')) lang = 'json'
      else if (step.path.endsWith('.md')) lang = 'markdown'
    }

    lines.push('```' + lang)
    lines.push(step.template.trim())
    lines.push('```')
    lines.push('')
  }

  // Multiple files
  if (step.files && Array.isArray(step.files)) {
    lines.push('#### Files')
    step.files.forEach((file: any, idx: number) => {
      lines.push(`##### File ${idx + 1}: ${file.path}`)
      if (file.template) {
        lines.push('```typescript')
        lines.push(file.template.trim())
        lines.push('```')
        lines.push('')
      }
    })
  }

  // Validation script
  if (step.validation_script) {
    lines.push('<details>')
    lines.push('<summary>📋 Validation Script</summary>')
    lines.push('')
    lines.push('```bash')
    lines.push(step.validation_script.trim())
    lines.push('```')
    lines.push('')
    lines.push('</details>')
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Format rules into markdown
 */
function formatRules(rules: any, title: string): string {
  const lines: string[] = []

  lines.push(`## ${title}`)
  lines.push('')

  if (rules.should && Array.isArray(rules.should)) {
    lines.push('### ✅ Should')
    rules.should.forEach((rule: string) => {
      lines.push(`- ${rule}`)
    })
    lines.push('')
  }

  if (rules.should_not && Array.isArray(rules.should_not)) {
    lines.push('### ❌ Should NOT')
    rules.should_not.forEach((rule: string) => {
      lines.push(`- ${rule}`)
    })
    lines.push('')
  }

  // Handle other rule formats
  Object.keys(rules).forEach(key => {
    if (key !== 'should' && key !== 'should_not') {
      if (Array.isArray(rules[key])) {
        lines.push(`### ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
        rules[key].forEach((item: any) => {
          if (typeof item === 'string') {
            lines.push(`- ${item}`)
          } else {
            lines.push(`- ${JSON.stringify(item, null, 2)}`)
          }
        })
        lines.push('')
      }
    }
  })

  return lines.join('\n')
}

/**
 * Convert YAML template to Markdown
 */
function convertYAMLToMarkdown(yamlContent: string, filename: string): string {
  const template = parse(yamlContent, { merge: true }) as TemplateYAML
  const lines: string[] = []

  // Frontmatter
  lines.push('---')
  lines.push(`title: "${template.metadata.title}"`)
  lines.push(`description: "${template.metadata.description}"`)
  lines.push(`version: "${template.version}"`)
  lines.push(`source: "${template.metadata.source}"`)
  lines.push(`lastUpdated: "${template.metadata.lastUpdated}"`)

  if (template.metadata.layers) {
    lines.push(`layers:`)
    template.metadata.layers.forEach(layer => {
      lines.push(`  - ${layer}`)
    })
  }

  if (template.metadata.tdd_principles) {
    lines.push(`tdd_principles:`)
    template.metadata.tdd_principles.forEach(principle => {
      lines.push(`  - "${principle}"`)
    })
  }

  lines.push(`template_type: ${detectTemplateType(template)}`)
  lines.push('---')
  lines.push('')

  // Title
  lines.push(`# ${template.metadata.title}`)
  lines.push('')
  lines.push(`> ${template.metadata.description}`)
  lines.push('')

  // Table of Contents
  lines.push('## Table of Contents')
  lines.push('')
  lines.push('- [Overview](#overview)')
  lines.push('- [Architecture](#architecture)')
  lines.push('- [Structure](#structure)')
  lines.push('- [Implementation Steps](#implementation-steps)')
  lines.push('- [Rules & Guidelines](#rules--guidelines)')
  lines.push('- [Troubleshooting](#troubleshooting)')
  lines.push('- [AI Guidelines](#ai-guidelines)')
  lines.push('')

  // Overview
  lines.push('## Overview')
  lines.push('')
  lines.push(`**Version:** ${template.version}`)
  lines.push(`**Source:** ${template.metadata.source}`)
  lines.push(`**Last Updated:** ${template.metadata.lastUpdated}`)
  lines.push('')

  // Ubiquitous Language
  if (template.metadata.ubiquitousLanguage && template.metadata.ubiquitousLanguage.length > 0) {
    lines.push('### Ubiquitous Language')
    lines.push('')
    lines.push('| Term | Definition |')
    lines.push('|------|------------|')
    template.metadata.ubiquitousLanguage.forEach(item => {
      lines.push(`| ${item.term} | ${item.definition} |`)
    })
    lines.push('')
  }

  // Architecture
  if (template.architecture) {
    lines.push('## Architecture')
    lines.push('')

    if (template.architecture.dependency_rules) {
      lines.push('### Dependency Rules')
      lines.push('')
      Object.entries(template.architecture.dependency_rules).forEach(([layer, rules]: [string, any]) => {
        lines.push(`#### ${layer}`)
        if (rules.can_import_from && rules.can_import_from.length > 0) {
          lines.push(`- **Can import from:** ${rules.can_import_from.join(', ')}`)
        }
        if (rules.cannot_import_from && rules.cannot_import_from.length > 0) {
          lines.push(`- **Cannot import from:** ${rules.cannot_import_from.join(', ')}`)
        }
        if (rules.must_use_protocols !== undefined) {
          lines.push(`- **Must use protocols:** ${rules.must_use_protocols}`)
        }
        lines.push('')
      })
    }

    if (template.architecture.principles) {
      lines.push('### Architecture Principles')
      template.architecture.principles.forEach((principle: string) => {
        lines.push(`- ${principle}`)
      })
      lines.push('')
    }
  }

  // Required Protocols (for data layer)
  if (template.required_protocols && template.required_protocols.length > 0) {
    lines.push('## Required Protocols')
    lines.push('')
    template.required_protocols.forEach((protocol: any) => {
      lines.push(`### ${protocol.category.toUpperCase()}`)
      protocol.protocols.forEach((p: string) => {
        lines.push(`- ${p}`)
      })
      lines.push('')
    })
  }

  // Structure
  if (template.structure) {
    lines.push('## Structure')
    lines.push('')
    lines.push(`**Base Path:** \`${template.structure.basePath}\``)
    lines.push('')

    if (template.structure.folders) {
      lines.push('### Folders')
      template.structure.folders.forEach((folder: string) => {
        lines.push(`- \`${folder}\``)
      })
      lines.push('')
    }

    // Handle nested structures
    Object.keys(template.structure).forEach(key => {
      if (key !== 'basePath' && key !== 'folders') {
        const struct = template.structure[key]
        if (struct.folders) {
          lines.push(`### ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
          if (struct.basePath) {
            lines.push(`**Base Path:** \`${struct.basePath}\``)
          }
          struct.folders.forEach((folder: string) => {
            lines.push(`- \`${folder}\``)
          })
          lines.push('')
        }
      }
    })
  }

  // Implementation Steps
  lines.push('## Implementation Steps')
  lines.push('')
  lines.push(`Total steps: ${template.steps.length}`)
  lines.push('')

  template.steps.forEach((step, index) => {
    lines.push(formatStep(step, index))
    lines.push('---')
    lines.push('')
  })

  // Rules & Guidelines
  lines.push('## Rules & Guidelines')
  lines.push('')

  // Domain rules
  if (template.domain_rules) {
    lines.push(formatRules(template.domain_rules, 'Domain Layer Rules'))
  }

  // Data layer rules
  if (template.data_layer_rules) {
    lines.push('### Data Layer Rules')
    lines.push('')
    Object.entries(template.data_layer_rules).forEach(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`#### ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
        lines.push('```yaml')
        lines.push(JSON.stringify(value, null, 2).replace(/"/g, ''))
        lines.push('```')
        lines.push('')
      } else if (Array.isArray(value)) {
        lines.push(`#### ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
        value.forEach(item => {
          lines.push(`- ${item}`)
        })
        lines.push('')
      }
    })
  }

  // Other rules
  const ruleKeys = ['use_case_rules', 'error_rules', 'test_helper_rules', 'protocol_rules',
                    'usecase_implementation_rules', 'test_rules']

  ruleKeys.forEach(ruleKey => {
    if (template[ruleKey]) {
      const title = ruleKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      lines.push(formatRules(template[ruleKey], title))
    }
  })

  // Troubleshooting
  if (template.troubleshooting) {
    lines.push('## Troubleshooting')
    lines.push('')

    Object.entries(template.troubleshooting).forEach(([issue, solutions]) => {
      lines.push(`### ${issue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`)
      if (Array.isArray(solutions)) {
        solutions.forEach((solution: string) => {
          lines.push(`- ${solution}`)
        })
      } else {
        lines.push(`${solutions}`)
      }
      lines.push('')
    })
  }

  // AI Guidelines
  if (template.ai_guidelines && template.ai_guidelines.length > 0) {
    lines.push('## AI Guidelines')
    lines.push('')
    template.ai_guidelines.forEach((guideline: string) => {
      lines.push(`- ${guideline}`)
    })
    lines.push('')
  }

  // Evaluation
  if (template.evaluation) {
    lines.push('## Evaluation Criteria')
    lines.push('')

    if (template.evaluation.final_status) {
      lines.push(`**Status:** ${template.evaluation.final_status}`)
    }

    if (template.evaluation.final_rlhf_score !== null && template.evaluation.final_rlhf_score !== undefined) {
      lines.push(`**RLHF Score:** ${template.evaluation.final_rlhf_score}`)
    }

    if (template.evaluation.reviewer_summary) {
      lines.push('')
      lines.push('### Review Summary')
      lines.push('```')
      lines.push(template.evaluation.reviewer_summary.trim())
      lines.push('```')
    }

    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Detect template type
 */
function detectTemplateType(template: TemplateYAML): string {
  if (template.metadata.layers?.includes('domain') && template.metadata.layers.length === 1) {
    return 'domain'
  }
  if (template.metadata.layers?.includes('data')) {
    return 'data'
  }
  if (template.metadata.tdd_principles) {
    return 'data'
  }
  if (template.metadata.source.toLowerCase().includes('domain')) {
    return 'domain'
  }
  if (template.metadata.source.toLowerCase().includes('data')) {
    return 'data'
  }
  return 'generic'
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Usage: npx tsx src/tools/yaml-to-markdown.ts [yaml-file-or-directory] [output-directory]

Examples:
  npx tsx src/tools/yaml-to-markdown.ts templates/DATA_TEMPLATE.yaml docs/templates/
  npx tsx src/tools/yaml-to-markdown.ts templates/ docs/templates/

If no output directory is specified, files will be created in the same directory with .md extension.
    `)
    process.exit(0)
  }

  const input = args[0]
  const outputDir = args[1] || ''

  // Check if input is a directory
  const isDirectory = input.endsWith('/') || input === 'templates' || !input.includes('.yaml')

  let filesToProcess: string[] = []

  if (isDirectory) {
    const dir = input.endsWith('/') ? input.slice(0, -1) : input
    const files = readdirSync(dir)
    filesToProcess = files
      .filter(f => f.endsWith('.yaml'))
      .map(f => join(dir, f))
  } else {
    filesToProcess = [input]
  }

  console.log(`📚 Converting ${filesToProcess.length} YAML template(s) to Markdown...`)

  filesToProcess.forEach(filePath => {
    try {
      console.log(`\n📄 Processing: ${filePath}`)

      const yamlContent = readFileSync(filePath, 'utf-8')
      const filename = basename(filePath, '.yaml')
      const markdown = convertYAMLToMarkdown(yamlContent, filename)

      // Determine output path
      let outputPath: string
      if (outputDir) {
        outputPath = join(outputDir, `${filename}.md`)
      } else {
        outputPath = filePath.replace('.yaml', '.md')
      }

      writeFileSync(outputPath, markdown)
      console.log(`   ✅ Created: ${outputPath}`)

    } catch (error) {
      console.error(`   ❌ Error processing ${filePath}:`, error)
    }
  })

  console.log('\n✨ Conversion complete!')
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { convertYAMLToMarkdown, detectTemplateType }
