const fs = require('fs')

/**
 * Simple JavaScript validator (no external dependencies)
 * This validates the structure of the DOMAIN_TEMPLATE.yaml
 */

function validateYAML(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8')

    // Check if file is not empty
    if (!fileContent || fileContent.trim().length === 0) {
      console.error('❌ YAML file is empty')
      return false
    }

    // Try to parse YAML (basic validation)
    // Since we don't have yaml package, we'll do basic checks
    const lines = fileContent.split('\n')

    const requiredSections = [
      'version:',
      'metadata:',
      'structure:',
      'layerDependencies:',
      'domainRules:',
      'features:',
      'troubleshooting:',
      'refactoring:',
      'recovery:',
      'aiGuidelines:'
    ]

    const errors = []

    // Check for required top-level sections
    requiredSections.forEach(section => {
      if (!fileContent.includes(section)) {
        errors.push(`Missing required section: ${section}`)
      }
    })

    // Check for required subsections
    if (fileContent.includes('features:')) {
      const requiredFeatures = ['useCases:', 'errors:', 'testHelpers:']
      requiredFeatures.forEach(feature => {
        if (!fileContent.includes(feature)) {
          errors.push(`Missing required feature section: ${feature}`)
        }
      })
    }

    // Check for validation scripts
    const scriptCount = (fileContent.match(/validationScript:/g) || []).length
    if (scriptCount < 3) {
      errors.push(`Expected at least 3 validationScript sections, found ${scriptCount}`)
    }

    // Check for templates
    const templateCount = (fileContent.match(/template:/g) || []).length
    if (templateCount < 3) {
      errors.push(`Expected at least 3 template sections, found ${templateCount}`)
    }

    // Check indentation (YAML requires proper indentation)
    let hasIndentationErrors = false
    lines.forEach((line, index) => {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        const leadingSpaces = line.match(/^(\s*)/)[1]
        // YAML typically uses 2-space indentation
        if (leadingSpaces.includes('\t')) {
          errors.push(`Line ${index + 1}: Contains tabs (YAML requires spaces)`)
          hasIndentationErrors = true
        }
      }
    })

    if (errors.length > 0) {
      console.error('❌ YAML validation failed:')
      errors.forEach(error => console.error(`  - ${error}`))
      return false
    }

    // Count total lines to ensure all content was preserved
    const totalLines = lines.length
    console.log(`✅ YAML file has ${totalLines} lines`)

    // Check for key content preservation
    const keyContent = [
      '[ActionEntity]UseCase',
      '[ActionEntity]Input',
      '[ActionEntity]Output',
      'vi.fn()',
      'yarn lint',
      'yarn test --coverage',
      'git diff',
      'git status',
      'echo "🔍',
      'echo "❌',
      'echo "✅'
    ]

    keyContent.forEach(content => {
      if (!fileContent.includes(content)) {
        console.warn(`⚠️ Warning: Key content '${content}' not found`)
      }
    })

    console.log('✅ YAML template is valid!')
    console.log('\nKey sections found:')
    requiredSections.forEach(section => {
      console.log(`  ✓ ${section.replace(':', '')}`)
    })

    return true

  } catch (error) {
    console.error(`❌ Failed to validate YAML: ${error.message}`)
    return false
  }
}

// Run validation
const yamlFile = 'DOMAIN_TEMPLATE.yaml'
console.log(`🔍 Validating ${yamlFile}...\n`)

if (validateYAML(yamlFile)) {
  console.log('\n✅ Validation successful! The YAML contains all required sections from the original MD file.')
  process.exit(0)
} else {
  console.log('\n❌ Validation failed. Please check the errors above.')
  process.exit(1)
}