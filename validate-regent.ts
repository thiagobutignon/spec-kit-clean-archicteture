#!/usr/bin/env node

import { readFileSync } from 'fs'
import { parse } from 'yaml'
import Ajv from 'ajv'
import { resolve } from 'path'

/**
 * Validates a .regent YAML file against the regent.schema.json
 */
function validateRegentFile(filePath: string): boolean {
  console.log(`\n📄 Validating: ${filePath}`)

  try {
    // Load and parse the schema
    const schemaContent = readFileSync('regent.schema.json', 'utf-8')
    const schema = JSON.parse(schemaContent)

    // Load and parse the YAML file
    const yamlContent = readFileSync(filePath, 'utf-8')
    const yamlData = parse(yamlContent, { merge: true }) // merge: true handles YAML anchors

    // Create AJV instance and compile schema
    const ajv = new Ajv({
      allErrors: true,
      strict: false,
      verbose: true
    })
    const validate = ajv.compile(schema)

    // Validate
    const valid = validate(yamlData)

    if (valid) {
      console.log('✅ Validation passed!')
      return true
    } else {
      console.log('❌ Validation failed!')
      console.log('\nErrors:')
      validate.errors?.forEach((error, index) => {
        console.log(`\nError ${index + 1}:`)
        console.log(`  Path: ${error.instancePath || '(root)'}`)
        console.log(`  Field: ${error.schemaPath.split('/').pop()}`)
        console.log(`  Message: ${error.message}`)
        if (error.params) {
          console.log(`  Details:`, error.params)
        }
      })
      return false
    }
  } catch (error) {
    console.error('❌ Error processing file:', error)
    return false
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`
Usage: npx tsx validate-regent.ts [path-to-regent-file]

Examples:
  npx tsx validate-regent.ts templates/template.regent
  npx tsx validate-regent.ts templates/my-feature.regent

This tool validates .regent YAML files against the regent.schema.json
    `)
    process.exit(0)
  }

  const filePath = resolve(args[0])
  const isValid = validateRegentFile(filePath)

  process.exit(isValid ? 0 : 1)
}

main()