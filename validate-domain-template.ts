import * as fs from 'fs'
import * as yaml from 'yaml'

/**
 * Domain Template YAML Validator
 * Ensures all required sections and rules are present
 */

interface DomainTemplateYAML {
  version: string
  metadata: {
    title: string
    description: string
    lastUpdated: string
  }
  structure: {
    basePath: string
    folders: {
      name: string
      description: string
      required: boolean
    }[]
  }
  layerDependencies: {
    canImportFromDomain: string[]
    cannotImportFromDomain: string[]
    domainCannotImportFrom: string[]
  }
  domainRules: {
    allowed: string[]
    forbidden: string[]
  }
  features: {
    useCases: {
      purpose: string
      rules: {
        should: string[]
        shouldNot: string[]
      }
      template: string
      validationScript: string
    }
    errors: {
      purpose: string
      rules: {
        should: string[]
        shouldNot: string[]
      }
      template: string
      validationScript: string
    }
    testHelpers: {
      purpose: string
      rules: {
        should: string[]
        shouldNot: string[]
      }
      template: string
      validationScript: string
    }
  }
  troubleshooting: {
    lintFails: string[]
    testsFail: string[]
    typeScriptFails: string[]
  }
  refactoring: {
    beforeRefactoring: string
    duringRefactoring: string
    commonScenarios: {
      name: string
      wrongExample: string
      correctExample: string
      script: string
    }[]
  }
  recovery: {
    accidentalCommit: string
    domainPolluted: string
  }
  aiGuidelines: string[]
}

class DomainTemplateValidator {
  private errors: string[] = []

  /**
   * Validate the YAML file
   */
  async validate(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8')
      const data = yaml.parse(fileContent) as DomainTemplateYAML

      // Reset errors
      this.errors = []

      // Validate required top-level sections
      this.validateSection(data, 'version', 'string')
      this.validateSection(data, 'metadata', 'object')
      this.validateSection(data, 'structure', 'object')
      this.validateSection(data, 'layerDependencies', 'object')
      this.validateSection(data, 'domainRules', 'object')
      this.validateSection(data, 'features', 'object')
      this.validateSection(data, 'troubleshooting', 'object')
      this.validateSection(data, 'refactoring', 'object')
      this.validateSection(data, 'recovery', 'object')
      this.validateSection(data, 'aiGuidelines', 'array')

      // Validate metadata
      if (data.metadata) {
        this.validateSection(data.metadata, 'title', 'string')
        this.validateSection(data.metadata, 'description', 'string')
        this.validateSection(data.metadata, 'lastUpdated', 'string')
      }

      // Validate structure
      if (data.structure) {
        this.validateSection(data.structure, 'basePath', 'string')
        this.validateSection(data.structure, 'folders', 'array')

        if (Array.isArray(data.structure.folders)) {
          data.structure.folders.forEach((folder, index) => {
            if (!folder.name) this.errors.push(`structure.folders[${index}].name is required`)
            if (!folder.description) this.errors.push(`structure.folders[${index}].description is required`)
            if (typeof folder.required !== 'boolean') this.errors.push(`structure.folders[${index}].required must be boolean`)
          })
        }
      }

      // Validate layer dependencies
      if (data.layerDependencies) {
        this.validateArray(data.layerDependencies, 'canImportFromDomain')
        this.validateArray(data.layerDependencies, 'cannotImportFromDomain')
        this.validateArray(data.layerDependencies, 'domainCannotImportFrom')
      }

      // Validate domain rules
      if (data.domainRules) {
        this.validateArray(data.domainRules, 'allowed')
        this.validateArray(data.domainRules, 'forbidden')
      }

      // Validate features
      if (data.features) {
        this.validateFeatureSection(data.features, 'useCases')
        this.validateFeatureSection(data.features, 'errors')
        this.validateFeatureSection(data.features, 'testHelpers')
      }

      // Validate troubleshooting
      if (data.troubleshooting) {
        this.validateArray(data.troubleshooting, 'lintFails')
        this.validateArray(data.troubleshooting, 'testsFail')
        this.validateArray(data.troubleshooting, 'typeScriptFails')
      }

      // Validate refactoring
      if (data.refactoring) {
        this.validateSection(data.refactoring, 'beforeRefactoring', 'string')
        this.validateSection(data.refactoring, 'duringRefactoring', 'string')
        this.validateSection(data.refactoring, 'commonScenarios', 'array')

        if (Array.isArray(data.refactoring.commonScenarios)) {
          data.refactoring.commonScenarios.forEach((scenario, index) => {
            if (!scenario.name) this.errors.push(`refactoring.commonScenarios[${index}].name is required`)
            if (!scenario.script) this.errors.push(`refactoring.commonScenarios[${index}].script is required`)
          })
        }
      }

      // Validate recovery
      if (data.recovery) {
        this.validateSection(data.recovery, 'accidentalCommit', 'string')
        this.validateSection(data.recovery, 'domainPolluted', 'string')
      }

      // Validate AI guidelines
      if (!Array.isArray(data.aiGuidelines) || data.aiGuidelines.length === 0) {
        this.errors.push('aiGuidelines must be a non-empty array')
      }

      return {
        valid: this.errors.length === 0,
        errors: this.errors
      }

    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to parse YAML: ${error}`]
      }
    }
  }

  private validateSection(obj: any, key: string, expectedType: string): void {
    if (!obj[key]) {
      this.errors.push(`Missing required section: ${key}`)
    } else if (expectedType === 'array' && !Array.isArray(obj[key])) {
      this.errors.push(`${key} must be an array`)
    } else if (expectedType === 'object' && typeof obj[key] !== 'object') {
      this.errors.push(`${key} must be an object`)
    } else if (expectedType === 'string' && typeof obj[key] !== 'string') {
      this.errors.push(`${key} must be a string`)
    }
  }

  private validateArray(obj: any, key: string): void {
    if (!Array.isArray(obj[key])) {
      this.errors.push(`${key} must be an array`)
    } else if (obj[key].length === 0) {
      this.errors.push(`${key} cannot be empty`)
    }
  }

  private validateFeatureSection(features: any, sectionName: string): void {
    const section = features[sectionName]
    if (!section) {
      this.errors.push(`Missing features.${sectionName}`)
      return
    }

    if (!section.purpose) this.errors.push(`features.${sectionName}.purpose is required`)
    if (!section.template) this.errors.push(`features.${sectionName}.template is required`)
    if (!section.validationScript) this.errors.push(`features.${sectionName}.validationScript is required`)

    if (section.rules) {
      this.validateArray(section.rules, 'should')
      this.validateArray(section.rules, 'shouldNot')
    } else {
      this.errors.push(`features.${sectionName}.rules is required`)
    }
  }
}

// CLI usage
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: ts-node validate-domain-template.ts <path-to-yaml>')
    process.exit(1)
  }

  const validator = new DomainTemplateValidator()
  const result = await validator.validate(args[0])

  if (result.valid) {
    console.log('✅ YAML template is valid!')
  } else {
    console.error('❌ YAML template validation failed:')
    result.errors.forEach(error => console.error(`  - ${error}`))
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { DomainTemplateValidator }