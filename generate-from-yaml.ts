#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import { execSync } from 'child_process'
import * as readline from 'readline'

/**
 * Domain Template Generator from YAML
 * Reads YAML templates and generates complete domain structure
 */

interface GeneratorConfig {
  featureName: string
  generateAll?: boolean
  skipValidation?: boolean
  dryRun?: boolean
}

interface YamlTemplate {
  version: string
  metadata: any
  structure: {
    basePath: string
    folders: Array<{
      name: string
      description: string
      required: boolean
    }>
  }
  features?: {
    useCases?: {
      template: string
      validationScript: string
    }
    errors?: {
      template: string
      validationScript: string
    }
    testHelpers?: {
      template: string
      validationScript: string
    }
  }
  // Specific implementations for features
  useCaseImplementations?: Record<string, any>
  errorImplementations?: Record<string, any>
  testHelperImplementations?: Record<string, any>
}

class YamlDomainGenerator {
  private template: YamlTemplate | null = null
  private config: GeneratorConfig
  private createdFiles: string[] = []
  private createdFolders: string[] = []

  constructor(private templatePath: string, config: GeneratorConfig) {
    this.config = config
  }

  /**
   * Main execution
   */
  async generate(): Promise<void> {
    console.log('🚀 Starting YAML Domain Generator...\n')

    try {
      // Load YAML template
      await this.loadTemplate()

      // Create folder structure
      await this.createFolderStructure()

      // Generate files based on template type
      if (this.hasSpecificImplementations()) {
        await this.generateSpecificImplementations()
      } else {
        await this.generateGenericImplementations()
      }

      // Run validation if not skipped
      if (!this.config.skipValidation) {
        await this.runValidation()
      }

      // Summary
      this.printSummary()

    } catch (error) {
      console.error('❌ Generation failed:', error)
      process.exit(1)
    }
  }

  /**
   * Load and parse YAML template
   */
  private async loadTemplate(): Promise<void> {
    console.log(`📖 Loading template: ${this.templatePath}`)

    if (!fs.existsSync(this.templatePath)) {
      throw new Error(`Template file not found: ${this.templatePath}`)
    }

    const content = fs.readFileSync(this.templatePath, 'utf-8')
    this.template = yaml.parse(content)

    console.log(`✅ Template loaded: ${this.template?.metadata?.title || 'Unknown'}\n`)
  }

  /**
   * Check if template has specific implementations
   */
  private hasSpecificImplementations(): boolean {
    return !!(
      this.template?.useCaseImplementations ||
      this.template?.errorImplementations ||
      this.template?.testHelperImplementations ||
      this.template?.checkoutImplementations ||
      this.template?.todoImplementations
    )
  }

  /**
   * Create folder structure
   */
  private async createFolderStructure(): Promise<void> {
    if (!this.template?.structure) return

    console.log('📁 Creating folder structure...')

    const { basePath, folders } = this.template.structure

    for (const folder of folders) {
      const folderPath = folder.name
        .replace('[feature-name]', this.config.featureName)

      const fullPath = path.join(basePath, folderPath)

      if (this.config.dryRun) {
        console.log(`  [DRY RUN] Would create: ${fullPath}`)
      } else {
        if (!fs.existsSync(fullPath)) {
          fs.mkdirSync(fullPath, { recursive: true })
          this.createdFolders.push(fullPath)
          console.log(`  ✅ Created: ${fullPath}`)
        } else {
          console.log(`  ⏭️  Exists: ${fullPath}`)
        }
      }
    }

    console.log('')
  }

  /**
   * Generate specific implementations (for feature-specific YAMLs)
   */
  private async generateSpecificImplementations(): Promise<void> {
    console.log('📝 Generating specific implementations...\n')

    // Generate use cases
    if (this.template?.useCaseImplementations) {
      await this.generateUseCases()
    }

    // Generate errors
    if (this.template?.errorImplementations) {
      await this.generateErrors()
    }

    // Generate test helpers
    if (this.template?.testHelperImplementations) {
      await this.generateTestHelpers()
    }
  }

  /**
   * Generate generic implementations (for template YAMLs)
   */
  private async generateGenericImplementations(): Promise<void> {
    console.log('📝 Generating from generic template...\n')

    // Generate use case template
    if (this.template?.features?.useCases?.template) {
      await this.generateFromTemplate(
        'use-cases',
        'example-use-case.ts',
        this.template.features.useCases.template
      )
    }

    // Generate error template
    if (this.template?.features?.errors?.template) {
      await this.generateFromTemplate(
        'errors',
        'example-error.ts',
        this.template.features.errors.template
      )
    }

    // Generate test helper template
    if (this.template?.features?.testHelpers?.template) {
      await this.generateFromTemplate(
        'test',
        'mock-example-use-case.ts',
        this.template.features.testHelpers.template
      )
    }
  }

  /**
   * Generate use case files
   */
  private async generateUseCases(): Promise<void> {
    const implementations = this.template?.useCaseImplementations || {}

    for (const [name, impl] of Object.entries(implementations)) {
      if (typeof impl === 'object' && impl.template) {
        const fileName = `${name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)}.ts`
        await this.generateFromTemplate('use-cases', fileName, impl.template)
      }
    }
  }

  /**
   * Generate error files
   */
  private async generateErrors(): Promise<void> {
    const implementations = this.template?.errorImplementations || {}

    for (const [name, impl] of Object.entries(implementations)) {
      if (typeof impl === 'object' && impl.template) {
        const fileName = `${name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)}-error.ts`
        await this.generateFromTemplate('errors', fileName, impl.template)
      }
    }
  }

  /**
   * Generate test helper files
   */
  private async generateTestHelpers(): Promise<void> {
    const implementations = this.template?.testHelperImplementations || {}

    for (const [name, impl] of Object.entries(implementations)) {
      if (typeof impl === 'object' && impl.template) {
        const fileName = `${name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1)}.ts`
        await this.generateFromTemplate('test', fileName, impl.template)
      }
    }
  }

  /**
   * Generate file from template
   */
  private async generateFromTemplate(
    folder: string,
    fileName: string,
    templateContent: string
  ): Promise<void> {
    const folderPath = `src/features/${this.config.featureName}/domain/${folder}`
    const filePath = path.join(folderPath, fileName)

    // Process template content
    let content = templateContent
      .replace(/\[feature-name\]/g, this.config.featureName)
      .replace(/\[ActionEntity\]/g, 'Example')
      .replace(/\[EntityName\]/g, 'Example')
      .replace(/\[ErrorName\]/g, 'ExampleError')

    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would create: ${filePath}`)
      console.log(`[DRY RUN] Content preview:`)
      console.log(content.split('\n').slice(0, 10).join('\n'))
      console.log('...\n')
    } else {
      // Ensure folder exists
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }

      // Write file
      fs.writeFileSync(filePath, content)
      this.createdFiles.push(filePath)
      console.log(`✅ Created: ${filePath}`)
    }
  }

  /**
   * Run validation scripts
   */
  private async runValidation(): Promise<void> {
    if (this.config.dryRun) {
      console.log('\n[DRY RUN] Would run validation scripts\n')
      return
    }

    console.log('\n🔧 Running validation...\n')

    const validationScript = this.template?.features?.useCases?.validationScript

    if (!validationScript) {
      console.log('⏭️  No validation script found\n')
      return
    }

    const commands = validationScript
      .split('\n')
      .filter(cmd =>
        cmd.trim() &&
        !cmd.startsWith('echo') &&
        !cmd.startsWith('#') &&
        !cmd.includes('exit') &&
        !cmd.includes('if [')
      )

    for (const command of commands) {
      if (command.includes('git') && !fs.existsSync('.git')) {
        console.log(`⏭️  Skipping git command: ${command}`)
        continue
      }

      console.log(`▶️  Running: ${command}`)

      try {
        execSync(command, {
          encoding: 'utf-8',
          stdio: 'inherit'
        })
        console.log(`✅ Success\n`)
      } catch (error) {
        console.log(`⚠️  Command failed\n`)
      }
    }
  }

  /**
   * Print summary
   */
  private printSummary(): void {
    console.log('\n📊 Generation Summary:')
    console.log('━'.repeat(50))

    if (this.config.dryRun) {
      console.log('🔍 DRY RUN MODE - No files were created')
    } else {
      console.log(`✅ Created ${this.createdFolders.length} folders`)
      console.log(`✅ Created ${this.createdFiles.length} files`)

      if (this.createdFiles.length > 0) {
        console.log('\n📄 Files created:')
        this.createdFiles.forEach(file => {
          console.log(`  - ${file}`)
        })
      }
    }

    console.log('━'.repeat(50))
    console.log('\n✨ Generation complete!')
  }
}

/**
 * Interactive prompt for feature name
 */
async function promptFeatureName(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('📝 Enter feature name (e.g., user-auth, checkout): ', (answer) => {
      rl.close()
      resolve(answer.trim() || 'example-feature')
    })
  })
}

/**
 * CLI Entry Point
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help') {
    console.log('🛠️  YAML Domain Generator')
    console.log('━'.repeat(50))
    console.log('\nUsage: tsx generate-from-yaml.ts <template.yaml> [options]')
    console.log('\nOptions:')
    console.log('  --feature <name>    Feature name (interactive if not provided)')
    console.log('  --all              Generate all implementations')
    console.log('  --skip-validation  Skip validation scripts')
    console.log('  --dry-run          Preview without creating files')
    console.log('\nExamples:')
    console.log('  tsx generate-from-yaml.ts DOMAIN_TEMPLATE.yaml --feature user-auth')
    console.log('  tsx generate-from-yaml.ts TODO_LIST_IMPLEMENTATION.yaml --all')
    console.log('  tsx generate-from-yaml.ts CHECKOUT_IMPLEMENTATION.yaml --dry-run')
    process.exit(0)
  }

  const templatePath = args[0]

  // Parse config
  const config: GeneratorConfig = {
    featureName: '',
    generateAll: args.includes('--all'),
    skipValidation: args.includes('--skip-validation'),
    dryRun: args.includes('--dry-run')
  }

  // Get feature name
  const featureIndex = args.indexOf('--feature')
  if (featureIndex !== -1 && args[featureIndex + 1]) {
    config.featureName = args[featureIndex + 1]
  } else {
    config.featureName = await promptFeatureName()
  }

  // Display config
  console.log('\n📋 Configuration:')
  console.log('━'.repeat(50))
  console.log(`Template:         ${templatePath}`)
  console.log(`Feature:          ${config.featureName}`)
  console.log(`Generate All:     ${config.generateAll ? 'Yes' : 'No'}`)
  console.log(`Skip Validation:  ${config.skipValidation ? 'Yes' : 'No'}`)
  console.log(`Dry Run:          ${config.dryRun ? 'Yes' : 'No'}`)
  console.log('━'.repeat(50))

  // Confirm
  if (!config.dryRun) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const confirm = await new Promise<boolean>((resolve) => {
      rl.question('\n🤔 Proceed with generation? (y/n): ', (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'y')
      })
    })

    if (!confirm) {
      console.log('❌ Generation cancelled')
      process.exit(0)
    }
  }

  console.log('')

  // Generate
  const generator = new YamlDomainGenerator(templatePath, config)
  await generator.generate()
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { YamlDomainGenerator }