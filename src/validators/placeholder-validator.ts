/**
 * Placeholder Validator
 * Validates that all placeholders have been replaced in template files
 */

export interface PlaceholderValidationResult {
  isValid: boolean
  unreplacedPlaceholders: string[]
  locations: Array<{
    field: string
    value: string
    placeholders: string[]
  }>
}

export class PlaceholderValidator {
  private readonly PLACEHOLDER_PATTERN = /__[A-Z_]+__/g
  private readonly EXCLUDED_FIELDS = ['template', 'template_content', 'validation_script']

  /**
   * Validates an object recursively for unreplaced placeholders
   */
  public validate(obj: any, path = ''): PlaceholderValidationResult {
    const result: PlaceholderValidationResult = {
      isValid: true,
      unreplacedPlaceholders: [],
      locations: []
    }

    this.validateRecursive(obj, path, result)

    // Remove duplicates from unreplacedPlaceholders
    result.unreplacedPlaceholders = [...new Set(result.unreplacedPlaceholders)]
    result.isValid = result.unreplacedPlaceholders.length === 0

    return result
  }

  private validateRecursive(
    obj: any,
    path: string,
    result: PlaceholderValidationResult
  ): void {
    if (obj === null || obj === undefined) {
      return
    }

    if (typeof obj === 'string') {
      // Skip validation for excluded fields
      const fieldName = path.split('.').pop() || ''
      if (this.EXCLUDED_FIELDS.includes(fieldName)) {
        return
      }

      const placeholders = this.findPlaceholders(obj)
      if (placeholders.length > 0) {
        result.unreplacedPlaceholders.push(...placeholders)
        result.locations.push({
          field: path,
          value: obj,
          placeholders
        })
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.validateRecursive(item, `${path}[${index}]`, result)
      })
    } else if (typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key
        this.validateRecursive(value, newPath, result)
      })
    }
  }

  private findPlaceholders(text: string): string[] {
    const matches = text.match(this.PLACEHOLDER_PATTERN)
    return matches || []
  }

  /**
   * Validates a template file before execution
   */
  public validateTemplate(template: any): PlaceholderValidationResult {
    // Fields that must not contain placeholders in final implementation
    const criticalFields = [
      'version',
      'metadata.title',
      'metadata.description',
      'metadata.lastUpdated',
      'structure.basePath'
    ]

    const result = this.validate(template)

    // Check critical fields specifically
    criticalFields.forEach(field => {
      const value = this.getNestedValue(template, field)
      if (typeof value === 'string') {
        const placeholders = this.findPlaceholders(value)
        if (placeholders.length > 0) {
          result.isValid = false
          if (!result.locations.find(loc => loc.field === field)) {
            result.locations.push({
              field,
              value,
              placeholders
            })
          }
        }
      }
    })

    return result
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current?.[key]
    }, obj)
  }

  /**
   * Generates a validation report
   */
  public generateReport(result: PlaceholderValidationResult): string {
    if (result.isValid) {
      return '✅ All placeholders have been replaced successfully.'
    }

    let report = '❌ Validation Failed: Unreplaced placeholders found\\n\\n'
    report += `Found ${result.unreplacedPlaceholders.length} unique placeholder(s):\\n`
    report += result.unreplacedPlaceholders.map(p => `  - ${p}`).join('\\n')
    report += '\\n\\nLocations:\\n'

    result.locations.forEach(loc => {
      report += `\\n📍 ${loc.field}:\\n`
      report += `   Value: "${loc.value.substring(0, 100)}${loc.value.length > 100 ? '...' : ''}"\n`
      report += `   Placeholders: ${loc.placeholders.join(', ')}\\n`
    })

    report += '\\n⚠️  Please replace all placeholders before executing the template.'

    return report
  }
}

// Export singleton instance
export const placeholderValidator = new PlaceholderValidator()