#!/usr/bin/env node
/**
 * Pre-execution Validator
 * Validates templates before execution to ensure quality and prevent errors
 */

import { placeholderValidator } from './placeholder-validator'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

interface ValidationOptions {
  checkPlaceholders?: boolean
  checkSchema?: boolean
  checkDependencies?: boolean
  verbose?: boolean
}

interface ValidationResult {
  success: boolean
  errors: string[]
  warnings: string[]
}

export class PreExecutionValidator {
  /**
   * Validates a template file before execution
   */
  public async validateTemplate(
    templatePath: string,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const {
      checkPlaceholders = true,
      checkSchema = true,
      checkDependencies = true,
      verbose = false
    } = options

    const result: ValidationResult = {
      success: true,
      errors: [],
      warnings: []
    }

    try {
      // Load template
      const templateContent = fs.readFileSync(templatePath, 'utf-8')
      const template = yaml.load(templateContent) as any

      if (verbose) {
        console.log(`📋 Validating template: ${templatePath}`)
      }

      // 1. Validate placeholders
      if (checkPlaceholders) {
        const placeholderResult = placeholderValidator.validateTemplate(template)
        if (!placeholderResult.isValid) {
          result.success = false
          result.errors.push('Unreplaced placeholders detected:')
          placeholderResult.locations.forEach(loc => {
            result.errors.push(`  - ${loc.field}: ${loc.placeholders.join(', ')}`)
          })
        }
        if (verbose) {
          console.log(placeholderValidator.generateReport(placeholderResult))
        }
      }

      // 2. Validate required fields
      const requiredFields = [
        'version',
        'metadata',
        'structure',
        'architecture',
        'rules',
        'steps',
        'troubleshooting',
        'refactoring'
      ]

      requiredFields.forEach(field => {
        if (!template[field]) {
          result.success = false
          result.errors.push(`Missing required field: ${field}`)
        }
      })

      // 3. Validate semantic version
      if (template.version && !this.isValidSemVer(template.version)) {
        result.success = false
        result.errors.push(`Invalid semantic version: ${template.version}`)
      }

      // 4. Validate date format
      if (template.metadata?.lastUpdated) {
        if (!this.isValidDate(template.metadata.lastUpdated)) {
          result.success = false
          result.errors.push(`Invalid date format: ${template.metadata.lastUpdated}. Use YYYY-MM-DD format.`)
        }
      }

      // 5. Validate step structure
      if (template.steps && Array.isArray(template.steps)) {
        template.steps.forEach((step: any, index: number) => {
          if (!step.id) {
            result.errors.push(`Step ${index} is missing 'id' field`)
            result.success = false
          }
          if (!step.type) {
            result.errors.push(`Step ${index} is missing 'type' field`)
            result.success = false
          }
          if (!step.description) {
            result.warnings.push(`Step ${index} (${step.id}) is missing description`)
          }
        })
      }

      // 6. Check for dependency violations
      if (checkDependencies && template.architecture?.dependency_rules) {
        // This would require more complex analysis of the actual code
        result.warnings.push('Dependency validation requires code analysis (not implemented)')
      }

      // 7. Validate layer consistency
      if (template.metadata?.layers && template.structure?.layers) {
        const declaredLayers = new Set(template.metadata.layers)
        const structureLayers = new Set(Object.keys(template.structure.layers))

        declaredLayers.forEach(layer => {
          if (!structureLayers.has(layer)) {
            result.warnings.push(`Layer '${layer}' declared in metadata but not defined in structure`)
          }
        })

        structureLayers.forEach(layer => {
          if (!declaredLayers.has(layer)) {
            result.warnings.push(`Layer '${layer}' defined in structure but not declared in metadata`)
          }
        })
      }

    } catch (error) {
      result.success = false
      result.errors.push(`Failed to parse template: ${error.message}`)
    }

    return result
  }

  private isValidSemVer(version: string): boolean {
    const pattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    return pattern.test(version)
  }

  private isValidDate(date: string): boolean {
    const pattern = /^\d{4}-\d{2}-\d{2}$/
    if (!pattern.test(date)) {
      return false
    }

    const parsedDate = new Date(date)
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime())
  }

  /**
   * Generates a validation report
   */
  public generateReport(result: ValidationResult): string {
    let report = ''

    if (result.success) {
      report += '✅ Template validation successful!\\n'
    } else {
      report += '❌ Template validation failed!\\n'
    }

    if (result.errors.length > 0) {
      report += '\\n❌ Errors:\\n'
      result.errors.forEach(error => {
        report += `  ${error}\\n`
      })
    }

    if (result.warnings.length > 0) {
      report += '\\n⚠️  Warnings:\\n'
      result.warnings.forEach(warning => {
        report += `  ${warning}\\n`
      })
    }

    return report
  }
}

// CLI interface
if (require.main === module) {
  const validator = new PreExecutionValidator()
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: pre-execution-validator <template-file> [--verbose]')
    process.exit(1)
  }

  const templatePath = args[0]
  const verbose = args.includes('--verbose')

  validator.validateTemplate(templatePath, { verbose })
    .then(result => {
      console.log(validator.generateReport(result))
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error(`Error: ${error.message}`)
      process.exit(1)
    })
}

export default PreExecutionValidator