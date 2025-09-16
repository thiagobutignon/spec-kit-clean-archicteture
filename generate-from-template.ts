#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import * as readline from 'readline'

/**
 * Domain Template Generator
 * Reads a DOMAIN_TEMPLATE.md file and generates the complete structure
 */

interface TemplateConfig {
  featureName: string
  entityName: string
  actionName: string
  errorName?: string
}

interface CodeBlock {
  type: 'typescript' | 'bash'
  filePath?: string
  content: string
  description?: string
}

interface FolderStructure {
  basePath: string
  folders: string[]
}

class DomainTemplateGenerator {
  private mdContent: string = ''
  private config: TemplateConfig
  private codeBlocks: CodeBlock[] = []
  private folderStructure: FolderStructure | null = null
  private createdFiles: string[] = []

  constructor(private templatePath: string, config: TemplateConfig) {
    this.config = config
  }

  /**
   * Main execution method
   */
  async generate(): Promise<void> {
    console.log('🚀 Starting Domain Template Generator...\n')

    try {
      // Step 1: Read template file
      this.readTemplate()

      // Step 2: Parse folder structure
      this.parseFolderStructure()

      // Step 3: Create folders
      if (this.folderStructure) {
        this.createFolders()
      }

      // Step 4: Parse code blocks
      this.parseCodeBlocks()

      // Step 5: Create files
      this.createFiles()

      // Step 6: Execute validation commands
      await this.executeCommands()

      console.log('\n✅ Generation completed successfully!')
      console.log(`📁 Created ${this.createdFiles.length} files`)

    } catch (error) {
      console.error('❌ Generation failed:', error)
      process.exit(1)
    }
  }

  /**
   * Read the template MD file
   */
  private readTemplate(): void {
    console.log(`📖 Reading template: ${this.templatePath}`)

    if (!fs.existsSync(this.templatePath)) {
      throw new Error(`Template file not found: ${this.templatePath}`)
    }

    this.mdContent = fs.readFileSync(this.templatePath, 'utf-8')
    console.log(`✅ Template loaded (${this.mdContent.length} chars)\n`)
  }

  /**
   * Parse folder structure from template
   */
  private parseFolderStructure(): void {
    console.log('📂 Parsing folder structure...')

    // Look for the folder structure section
    const structureMatch = this.mdContent.match(/```\s*\n(src\/[\s\S]*?)```/m)

    if (structureMatch) {
      const structureText = structureMatch[1]
      const folders: string[] = []

      // Extract folder paths
      const lines = structureText.split('\n')
      lines.forEach(line => {
        // Look for folder patterns like "├── errors/" or "└── use-cases/"
        const folderMatch = line.match(/[├└]──\s+([\w-]+)\/?/)
        if (folderMatch) {
          const folderName = folderMatch[1]

          // Build the full path based on context
          if (line.includes('domain/')) {
            folders.push(`src/features/${this.config.featureName}/domain/${folderName}`)
          }
        }
      })

      // Also look for explicit paths
      const pathMatches = structureText.match(/features\/\[feature-name\]\/domain\/[\w-]+/g)
      if (pathMatches) {
        pathMatches.forEach(match => {
          const path = match.replace('[feature-name]', this.config.featureName)
          folders.push(`src/${path}`)
        })
      }

      this.folderStructure = {
        basePath: 'src',
        folders: [...new Set(folders)] // Remove duplicates
      }

      console.log(`✅ Found ${this.folderStructure.folders.length} folders to create\n`)
    }
  }

  /**
   * Create folder structure
   */
  private createFolders(): void {
    console.log('📁 Creating folder structure...')

    if (!this.folderStructure) return

    this.folderStructure.folders.forEach(folder => {
      const fullPath = path.resolve(folder)

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
        console.log(`  ✅ Created: ${folder}`)
      } else {
        console.log(`  ⏭️  Exists: ${folder}`)
      }
    })

    console.log('')
  }

  /**
   * Parse code blocks from template
   */
  private parseCodeBlocks(): void {
    console.log('📝 Parsing code blocks...')

    // Find all TypeScript code blocks with file paths
    const tsBlockRegex = /\/\/ (src\/features\/.*?\.ts)\s*\n([\s\S]*?)```/gm
    let match

    while ((match = tsBlockRegex.exec(this.mdContent)) !== null) {
      const filePath = match[1]
        .replace('[feature-name]', this.config.featureName)
        .replace('[action-entity]', this.config.actionName.toLowerCase())
        .replace('[error-name]', this.config.errorName?.toLowerCase() || 'error')

      let content = match[2].trim()

      // Replace placeholders
      content = this.replacePlaceholders(content)

      this.codeBlocks.push({
        type: 'typescript',
        filePath,
        content
      })
    }

    // Find bash command blocks
    const bashBlockRegex = /```bash\n([\s\S]*?)```/gm

    while ((match = bashBlockRegex.exec(this.mdContent)) !== null) {
      const content = match[1].trim()

      // Only include validation scripts
      if (content.includes('yarn lint') || content.includes('yarn test')) {
        this.codeBlocks.push({
          type: 'bash',
          content: this.replacePlaceholders(content)
        })
      }
    }

    console.log(`✅ Found ${this.codeBlocks.filter(b => b.type === 'typescript').length} TypeScript blocks`)
    console.log(`✅ Found ${this.codeBlocks.filter(b => b.type === 'bash').length} Bash blocks\n`)
  }

  /**
   * Replace template placeholders
   */
  private replacePlaceholders(content: string): string {
    return content
      .replace(/\[feature-name\]/g, this.config.featureName)
      .replace(/\[ActionEntity\]/g, this.config.entityName)
      .replace(/\[action-entity\]/g, this.config.actionName.toLowerCase())
      .replace(/\[action\]/g, this.config.actionName.toLowerCase())
      .replace(/\[EntityName\]/g, this.config.entityName)
      .replace(/\[entity-name\]/g, this.config.entityName.toLowerCase())
      .replace(/\[entity\]/g, this.config.entityName.toLowerCase())
      .replace(/\[ErrorName\]/g, this.config.errorName || 'Error')
      .replace(/\[error-name\]/g, this.config.errorName?.toLowerCase() || 'error')
      .replace(/\[Error message\]/g, `${this.config.errorName || 'Error'} occurred`)
      .replace(/\[Describe.*?\]/g, `${this.config.entityName} operation`)
  }

  /**
   * Create files from code blocks
   */
  private createFiles(): void {
    console.log('📄 Creating files...')

    const tsBlocks = this.codeBlocks.filter(b => b.type === 'typescript' && b.filePath)

    tsBlocks.forEach(block => {
      if (!block.filePath) return

      const fullPath = path.resolve(block.filePath)
      const dir = path.dirname(fullPath)

      // Ensure directory exists
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // Write file
      fs.writeFileSync(fullPath, block.content)
      this.createdFiles.push(block.filePath)
      console.log(`  ✅ Created: ${block.filePath}`)
    })

    console.log('')
  }

  /**
   * Execute validation commands
   */
  private async executeCommands(): Promise<void> {
    console.log('🔧 Executing validation commands...\n')

    const bashBlocks = this.codeBlocks.filter(b => b.type === 'bash')

    for (const block of bashBlocks) {
      const commands = block.content.split('\n').filter(cmd =>
        cmd.trim() &&
        !cmd.startsWith('echo') &&
        !cmd.startsWith('#') &&
        !cmd.includes('exit')
      )

      for (const command of commands) {
        // Skip git commands if not in a git repo
        if (command.includes('git') && !fs.existsSync('.git')) {
          console.log(`⏭️  Skipping git command: ${command}`)
          continue
        }

        // Skip conditional blocks
        if (command.includes('if [') || command.includes('fi')) {
          continue
        }

        console.log(`▶️  Executing: ${command}`)

        try {
          const output = execSync(command, {
            encoding: 'utf-8',
            stdio: 'pipe'
          })

          if (output) {
            console.log(`   ${output.trim()}`)
          }

          console.log(`   ✅ Success\n`)
        } catch (error: any) {
          console.log(`   ⚠️  Command failed: ${error.message}\n`)

          // Try to auto-fix if it's a lint error
          if (command.includes('yarn lint') && !command.includes('--fix')) {
            console.log(`   🔧 Attempting auto-fix...`)
            try {
              execSync(`${command} --fix`, { encoding: 'utf-8', stdio: 'pipe' })
              console.log(`   ✅ Auto-fix successful\n`)
            } catch {
              console.log(`   ❌ Auto-fix failed\n`)
            }
          }
        }
      }
    }
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Usage: tsx generate-from-template.ts <template.md> [options]')
    console.log('\nOptions:')
    console.log('  --feature <name>   Feature name (default: example-feature)')
    console.log('  --entity <name>    Entity name (default: Example)')
    console.log('  --action <name>    Action name (default: Create)')
    console.log('  --error <name>     Error name (default: NotFound)')
    console.log('\nExample:')
    console.log('  tsx generate-from-template.ts DOMAIN_TEMPLATE.md --feature user --entity User --action Create')
    process.exit(0)
  }

  const templatePath = args[0]

  // Parse options
  const config: TemplateConfig = {
    featureName: 'example-feature',
    entityName: 'Example',
    actionName: 'Create',
    errorName: 'NotFound'
  }

  for (let i = 1; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]

    switch (flag) {
      case '--feature':
        config.featureName = value
        break
      case '--entity':
        config.entityName = value
        break
      case '--action':
        config.actionName = value
        break
      case '--error':
        config.errorName = value
        break
    }
  }

  console.log('📋 Configuration:')
  console.log(`  Template: ${templatePath}`)
  console.log(`  Feature:  ${config.featureName}`)
  console.log(`  Entity:   ${config.entityName}`)
  console.log(`  Action:   ${config.actionName}`)
  console.log(`  Error:    ${config.errorName}`)
  console.log('')

  // Ask for confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const confirm = await new Promise<boolean>((resolve) => {
    rl.question('🤔 Do you want to proceed? (y/n): ', (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y')
    })
  })

  if (!confirm) {
    console.log('❌ Generation cancelled')
    process.exit(0)
  }

  console.log('')

  // Generate
  const generator = new DomainTemplateGenerator(templatePath, config)
  await generator.generate()
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error)
}

export { DomainTemplateGenerator }