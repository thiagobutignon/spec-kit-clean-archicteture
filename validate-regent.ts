#!/usr/bin/env tsx
/**
 * Regent Template Validator
 * Validates .regent template files against the schema
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { placeholderValidator } from './src/validators/placeholder-validator'

interface ValidationOptions {
  schemaPath?: string
  verbose?: boolean
  checkPlaceholders?: boolean
  outputFormat?: 'json' | 'text'
}

class RegentValidator {
  private ajv: Ajv
  private schema: any

  constructor(schemaPath: string = './regent.schema.json') {
    // Initialize AJV with formats
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    })

    // Add format validators (for date, email, etc.)
    addFormats(this.ajv)

    // Load schema
    this.loadSchema(schemaPath)
  }

  private loadSchema(schemaPath: string): void {
    try {
      const absolutePath = path.resolve(schemaPath)
      const schemaContent = fs.readFileSync(absolutePath, 'utf-8')
      this.schema = JSON.parse(schemaContent)

      // Compile schema
      this.ajv.compile(this.schema)
    } catch (error) {
      console.error(`❌ Failed to load schema from ${schemaPath}:`, error.message)
      process.exit(1)
    }
  }

  public validateFile(filePath: string, options: ValidationOptions = {}): boolean {
    const { verbose = false, checkPlaceholders = true, outputFormat = 'text' } = options

    try {
      // Read and parse YAML file
      const absolutePath = path.resolve(filePath)
      const content = fs.readFileSync(absolutePath, 'utf-8')
      const data = yaml.load(content) as any

      if (verbose) {
        console.log(`\n📋 Validating: ${filePath}`)
        console.log('━'.repeat(50))
      }

      let hasErrors = false
      const errors: string[] = []
      const warnings: string[] = []

      // 1. Validate against schema
      const valid = this.ajv.validate(this.schema, data)

      if (!valid) {
        hasErrors = true
        if (this.ajv.errors) {
          this.ajv.errors.forEach(error => {
            const errorPath = error.instancePath || 'root'
            const message = `${errorPath}: ${error.message}`
            errors.push(message)
          })
        }
      }

      // 2. Check for unreplaced placeholders
      if (checkPlaceholders) {
        const placeholderResult = placeholderValidator.validateTemplate(data)

        if (!placeholderResult.isValid) {
          hasErrors = true
          errors.push('Unreplaced placeholders detected:')
          placeholderResult.locations.forEach(loc => {
            errors.push(`  📍 ${loc.field}: ${loc.placeholders.join(', ')}`)
          })
        }
      }

      // 3. Additional validations

      // Check semantic version format
      if (data.version && !this.isValidSemVer(data.version)) {
        warnings.push(`Version '${data.version}' might not follow strict SemVer`)
      }

      // Check date format
      if (data.metadata?.lastUpdated && !this.isValidDate(data.metadata.lastUpdated)) {
        errors.push(`Invalid date format: ${data.metadata.lastUpdated}`)
        hasErrors = true
      }

      // Check for empty required arrays
      if (data.rules) {
        Object.entries(data.rules).forEach(([layer, rules]: [string, any]) => {
          if (rules.should && Array.isArray(rules.should) && rules.should.length === 0) {
            warnings.push(`Layer '${layer}' has empty 'should' array`)
          }
          if (rules.should_not && Array.isArray(rules.should_not) && rules.should_not.length === 0) {
            warnings.push(`Layer '${layer}' has empty 'should_not' array`)
          }
        })
      }

      // Check step dependencies
      if (data.steps && Array.isArray(data.steps)) {
        const stepIds = new Set(data.steps.map((s: any) => s.id))

        data.steps.forEach((step: any) => {
          if (step.depends_on) {
            step.depends_on.forEach((dep: string) => {
              if (!stepIds.has(dep)) {
                errors.push(`Step '${step.id}' depends on non-existent step '${dep}'`)
                hasErrors = true
              }
            })
          }
        })
      }

      // Output results
      if (outputFormat === 'json') {
        const result = {
          file: filePath,
          valid: !hasErrors,
          errors,
          warnings
        }
        console.log(JSON.stringify(result, null, 2))
      } else {
        this.printResults(filePath, hasErrors, errors, warnings, verbose)
      }

      return !hasErrors

    } catch (error) {
      console.error(`❌ Failed to validate ${filePath}:`, error.message)
      return false
    }
  }

  private printResults(
    filePath: string,
    hasErrors: boolean,
    errors: string[],
    warnings: string[],
    verbose: boolean
  ): void {
    if (hasErrors) {
      console.log(`\n❌ Validation FAILED for ${filePath}`)

      if (errors.length > 0) {
        console.log('\n🚫 Errors:')
        errors.forEach(error => console.log(`   ${error}`))
      }
    } else {
      console.log(`\n✅ Validation PASSED for ${filePath}`)
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      warnings.forEach(warning => console.log(`   ${warning}`))
    }

    if (verbose) {
      console.log('\n━'.repeat(50))
    }
  }

  private isValidSemVer(version: string): boolean {
    const pattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    return pattern.test(version)
  }

  private isValidDate(date: string): boolean {
    const pattern = /^\d{4}-\d{2}-\d{2}$/
    if (!pattern.test(date)) return false

    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }

  public validateDirectory(dirPath: string, options: ValidationOptions = {}): boolean {
    const files = this.findRegentFiles(dirPath)

    if (files.length === 0) {
      console.log(`⚠️  No .regent files found in ${dirPath}`)
      return true
    }

    console.log(`\n🔍 Found ${files.length} .regent file(s) to validate\n`)

    let allValid = true

    files.forEach(file => {
      const valid = this.validateFile(file, options)
      if (!valid) allValid = false
    })

    // Summary
    console.log('\n' + '═'.repeat(50))
    if (allValid) {
      console.log('✅ All templates validated successfully!')
    } else {
      console.log('❌ Some templates failed validation')
    }

    return allValid
  }

  private findRegentFiles(dirPath: string): string[] {
    const files: string[] = []

    const walkDir = (dir: string) => {
      const items = fs.readdirSync(dir)

      items.forEach(item => {
        const itemPath = path.join(dir, item)
        const stat = fs.statSync(itemPath)

        if (stat.isDirectory() && !item.startsWith('.')) {
          walkDir(itemPath)
        } else if (stat.isFile() && item.endsWith('.regent')) {
          files.push(itemPath)
        }
      })
    }

    walkDir(dirPath)
    return files
  }
}

// CLI Interface
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help')) {
    printUsage()
    process.exit(0)
  }

  // Parse options
  const options: ValidationOptions = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    checkPlaceholders: !args.includes('--no-placeholders'),
    outputFormat: args.includes('--json') ? 'json' : 'text'
  }

  // Custom schema path
  const schemaIndex = args.indexOf('--schema')
  if (schemaIndex !== -1 && args[schemaIndex + 1]) {
    options.schemaPath = args[schemaIndex + 1]
  }

  // Get file/directory path
  const targetPath = args.find(arg => !arg.startsWith('--') && arg !== '-v')

  if (!targetPath) {
    console.error('❌ Error: No file or directory specified')
    printUsage()
    process.exit(1)
  }

  // Create validator
  const validator = new RegentValidator(options.schemaPath)

  // Check if target is file or directory
  const stat = fs.statSync(targetPath)
  let success: boolean

  if (stat.isDirectory()) {
    success = validator.validateDirectory(targetPath, options)
  } else {
    success = validator.validateFile(targetPath, options)
  }

  process.exit(success ? 0 : 1)
}

function printUsage() {
  console.log(`
Regent Template Validator

Usage:
  validate-regent <file-or-directory> [options]

Options:
  --verbose, -v        Show detailed validation output
  --no-placeholders    Skip placeholder validation
  --json              Output results as JSON
  --schema <path>     Custom schema path (default: ./regent.schema.json)
  --help              Show this help message

Examples:
  validate-regent templates/my-template.regent
  validate-regent templates/ --verbose
  validate-regent template.regent --schema custom-schema.json
  validate-regent templates/ --json > results.json

Exit Codes:
  0 - All validations passed
  1 - Validation failed or error occurred
`)
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { RegentValidator, ValidationOptions }