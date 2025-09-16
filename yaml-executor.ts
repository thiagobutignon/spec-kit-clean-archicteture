#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'yaml'
import { execSync } from 'child_process'
import * as readline from 'readline'

/**
 * YAML Executor - Pure Deterministic Executor
 *
 * This executor ONLY executes YAML files that are already complete.
 * It does NOT replace placeholders or generate code.
 *
 * Workflow:
 * 1. User requests feature from AI
 * 2. AI generates COMPLETE implementation YAML (no placeholders, no TODOs)
 * 3. This executor runs the YAML deterministically
 */

interface Step {
  id: string
  type: 'folder' | 'file' | 'command' | 'validation'
  description: string
  action: {
    path?: string
    paths?: string[]
    content?: string
    command?: string
    commands?: string[]
  }
  rollback?: {
    command: string
  }
  continueOnError?: boolean
}

interface ExecutionYaml {
  version: string
  metadata: {
    title: string
    description: string
    feature: string
    timestamp: string
    generatedBy?: string
  }
  validation: {
    noPlaceholders: boolean
    noTodos: boolean
    ready: boolean
  }
  steps: Step[]
}

interface ExecutionState {
  currentStep: number
  executedSteps: string[]
  failedSteps: string[]
  createdFiles: string[]
  createdFolders: string[]
  executionLog: Array<{
    step: string
    timestamp: string
    status: 'success' | 'failed' | 'skipped'
    message?: string
  }>
}

class DeterministicExecutor {
  private yaml: ExecutionYaml
  private state: ExecutionState
  private stateFile: string
  private dryRun: boolean = false
  private verbose: boolean = false

  constructor(yamlPath: string, options: { dryRun?: boolean, verbose?: boolean, resume?: boolean } = {}) {
    // Load YAML
    if (!fs.existsSync(yamlPath)) {
      throw new Error(`YAML file not found: ${yamlPath}`)
    }

    const content = fs.readFileSync(yamlPath, 'utf-8')
    this.yaml = yaml.parse(content)

    // Options
    this.dryRun = options.dryRun || false
    this.verbose = options.verbose || false

    // State management
    this.stateFile = `.${path.basename(yamlPath, '.yaml')}.state.json`

    if (options.resume && fs.existsSync(this.stateFile)) {
      // Resume from saved state
      this.state = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'))
      console.log(`📂 Resuming from step ${this.state.currentStep + 1}`)
    } else {
      // Initialize new state
      this.state = {
        currentStep: 0,
        executedSteps: [],
        failedSteps: [],
        createdFiles: [],
        createdFolders: [],
        executionLog: []
      }
    }
  }

  /**
   * Validate YAML before execution
   */
  private validate(): void {
    console.log('🔍 Validating YAML...')

    // Check for placeholders
    const yamlString = JSON.stringify(this.yaml)
    const placeholderPattern = /\[[\w-]+\]/g
    const placeholders = yamlString.match(placeholderPattern)

    if (placeholders) {
      throw new Error(`Found placeholders in YAML: ${placeholders.join(', ')}\nYAML must be completely filled by AI before execution.`)
    }

    // Check for TODOs
    const todoPattern = /TODO|FIXME|XXX/gi
    const todos = yamlString.match(todoPattern)

    if (todos && !this.yaml.validation?.ready) {
      console.warn(`⚠️  Found TODO markers: ${todos.length} occurrences`)
      console.warn('   Make sure all TODOs are intentional comments, not incomplete code')
    }

    // Check validation flags
    if (!this.yaml.validation?.ready) {
      throw new Error('YAML validation.ready is not true. AI must mark YAML as ready for execution.')
    }

    console.log('✅ Validation passed\n')
  }

  /**
   * Execute the YAML
   */
  async execute(): Promise<void> {
    console.log('🚀 Starting Deterministic Execution')
    console.log('━'.repeat(50))
    console.log(`Title: ${this.yaml.metadata.title}`)
    console.log(`Feature: ${this.yaml.metadata.feature}`)
    console.log(`Steps: ${this.yaml.steps.length}`)
    console.log(`Dry Run: ${this.dryRun}`)
    console.log('━'.repeat(50))
    console.log('')

    // Validate first
    this.validate()

    try {
      // Execute steps from current position
      for (let i = this.state.currentStep; i < this.yaml.steps.length; i++) {
        const step = this.yaml.steps[i]
        this.state.currentStep = i

        await this.executeStep(step)

        // Save state after each successful step
        if (!this.dryRun) {
          this.saveState()
        }
      }

      this.printSummary()

      // Clean up state file on successful completion
      if (!this.dryRun && fs.existsSync(this.stateFile)) {
        fs.unlinkSync(this.stateFile)
      }

    } catch (error) {
      console.error('\n❌ Execution failed:', error)
      this.printFailureInfo()

      if (!this.dryRun) {
        console.log(`\n💾 State saved to: ${this.stateFile}`)
        console.log('   Run with --resume to continue from this point')
      }

      process.exit(1)
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: Step): Promise<void> {
    const stepNumber = this.state.currentStep + 1
    console.log(`\n📍 Step ${stepNumber}/${this.yaml.steps.length}: ${step.id}`)
    console.log(`   Type: ${step.type}`)
    console.log(`   ${step.description}`)

    if (this.dryRun) {
      console.log('   [DRY RUN] Would execute this step')
      this.logStep(step.id, 'skipped', 'Dry run')
      return
    }

    try {
      switch (step.type) {
        case 'folder':
          await this.executeFolderStep(step)
          break
        case 'file':
          await this.executeFileStep(step)
          break
        case 'command':
          await this.executeCommandStep(step)
          break
        case 'validation':
          await this.executeValidationStep(step)
          break
        default:
          throw new Error(`Unknown step type: ${step.type}`)
      }

      this.state.executedSteps.push(step.id)
      this.logStep(step.id, 'success')
      console.log(`   ✅ Step completed`)

    } catch (error: any) {
      this.state.failedSteps.push(step.id)
      this.logStep(step.id, 'failed', error.message)
      console.error(`   ❌ Step failed: ${error.message}`)

      // Try rollback if available
      if (step.rollback) {
        console.log(`   ↩️  Attempting rollback...`)
        try {
          execSync(step.rollback.command, { stdio: 'inherit' })
          console.log(`   ✅ Rollback successful`)
        } catch (rollbackError) {
          console.error(`   ❌ Rollback failed`)
        }
      }

      // Check if we should continue
      if (!step.continueOnError) {
        throw error
      }
      console.log(`   ⏭️  Continuing despite error (continueOnError: true)`)
    }
  }

  /**
   * Execute folder creation step
   */
  private async executeFolderStep(step: Step): Promise<void> {
    const paths = step.action.paths || [step.action.path!]

    for (const folderPath of paths) {
      console.log(`   📁 Creating: ${folderPath}`)

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
        this.state.createdFolders.push(folderPath)
        console.log(`      ✅ Created`)
      } else {
        console.log(`      ⏭️  Already exists`)
      }
    }
  }

  /**
   * Execute file creation step
   */
  private async executeFileStep(step: Step): Promise<void> {
    if (!step.action.path || step.action.content === undefined) {
      throw new Error('File step requires path and content')
    }

    const filePath = step.action.path
    const content = step.action.content

    console.log(`   📄 Creating: ${filePath}`)

    // Ensure directory exists
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write file
    fs.writeFileSync(filePath, content)
    this.state.createdFiles.push(filePath)
    console.log(`      ✅ File created (${content.length} bytes)`)
  }

  /**
   * Execute command step
   */
  private async executeCommandStep(step: Step): Promise<void> {
    const commands = step.action.commands || [step.action.command!]

    for (const command of commands) {
      console.log(`   ▶️  ${command}`)

      try {
        if (this.verbose) {
          // Show output in verbose mode
          execSync(command, { stdio: 'inherit' })
        } else {
          // Capture output in normal mode
          const output = execSync(command, { encoding: 'utf-8' })
          if (output.trim()) {
            console.log(`      Output: ${output.trim().split('\n')[0]}...`)
          }
        }
        console.log(`      ✅ Success`)
      } catch (error: any) {
        if (step.continueOnError) {
          console.log(`      ⚠️  Failed (continuing)`)
        } else {
          throw new Error(`Command failed: ${command}`)
        }
      }
    }
  }

  /**
   * Execute validation step
   */
  private async executeValidationStep(step: Step): Promise<void> {
    const commands = step.action.commands || [step.action.command!]

    console.log(`   🔍 Running validation...`)

    for (const command of commands) {
      try {
        const output = execSync(command, { encoding: 'utf-8' })
        console.log(`      ✅ ${command}: passed`)
      } catch (error) {
        console.log(`      ❌ ${command}: failed`)
        if (!step.continueOnError) {
          throw new Error(`Validation failed: ${command}`)
        }
      }
    }
  }

  /**
   * Save execution state
   */
  private saveState(): void {
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2))
  }

  /**
   * Log step execution
   */
  private logStep(stepId: string, status: 'success' | 'failed' | 'skipped', message?: string): void {
    this.state.executionLog.push({
      step: stepId,
      timestamp: new Date().toISOString(),
      status,
      message
    })
  }

  /**
   * Print execution summary
   */
  private printSummary(): void {
    console.log('\n' + '═'.repeat(50))
    console.log('📊 Execution Summary')
    console.log('═'.repeat(50))

    if (this.dryRun) {
      console.log('🔍 DRY RUN - No actual changes made')
    } else {
      console.log(`✅ Steps executed: ${this.state.executedSteps.length}/${this.yaml.steps.length}`)
      console.log(`📁 Folders created: ${this.state.createdFolders.length}`)
      console.log(`📄 Files created: ${this.state.createdFiles.length}`)

      if (this.state.failedSteps.length > 0) {
        console.log(`⚠️  Failed steps: ${this.state.failedSteps.length}`)
        this.state.failedSteps.forEach(step => console.log(`   - ${step}`))
      }

      // Show created files
      if (this.state.createdFiles.length > 0 && this.verbose) {
        console.log('\n📄 Created files:')
        this.state.createdFiles.forEach(file => console.log(`   - ${file}`))
      }
    }

    console.log('═'.repeat(50))
    console.log('✨ Execution complete!')
  }

  /**
   * Print failure information
   */
  private printFailureInfo(): void {
    console.log('\n' + '═'.repeat(50))
    console.log('❌ Execution Failed')
    console.log('═'.repeat(50))

    console.log(`\n📍 Failed at step ${this.state.currentStep + 1}/${this.yaml.steps.length}`)
    console.log(`   Step ID: ${this.yaml.steps[this.state.currentStep].id}`)

    if (this.state.executedSteps.length > 0) {
      console.log('\n✅ Successfully completed:')
      this.state.executedSteps.forEach(step => console.log(`   - ${step}`))
    }

    // Show recent log entries
    const recentLogs = this.state.executionLog.slice(-5)
    if (recentLogs.length > 0) {
      console.log('\n📋 Recent execution log:')
      recentLogs.forEach(log => {
        const icon = log.status === 'success' ? '✅' : log.status === 'failed' ? '❌' : '⏭️'
        console.log(`   ${icon} ${log.step}: ${log.status}${log.message ? ` - ${log.message}` : ''}`)
      })
    }

    console.log('═'.repeat(50))
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help') {
    console.log('🛠️  YAML Deterministic Executor')
    console.log('━'.repeat(50))
    console.log('\nUsage: tsx yaml-executor.ts <implementation.yaml> [options]')
    console.log('\nOptions:')
    console.log('  --dry-run    Preview execution without making changes')
    console.log('  --verbose    Show detailed command output')
    console.log('  --resume     Resume from last failed step')
    console.log('\nWorkflow:')
    console.log('  1. User requests feature from AI')
    console.log('  2. AI generates COMPLETE implementation YAML')
    console.log('  3. Run this executor on the generated YAML')
    console.log('\nExample:')
    console.log('  tsx yaml-executor.ts PAYMENT_IMPLEMENTATION.yaml')
    console.log('  tsx yaml-executor.ts TODO_IMPLEMENTATION.yaml --dry-run')
    console.log('  tsx yaml-executor.ts CHECKOUT_IMPLEMENTATION.yaml --resume')
    process.exit(0)
  }

  const yamlPath = args[0]
  const dryRun = args.includes('--dry-run')
  const verbose = args.includes('--verbose')
  const resume = args.includes('--resume')

  console.log('🔧 YAML Deterministic Executor')
  console.log('━'.repeat(50))
  console.log(`YAML: ${yamlPath}`)
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`)
  console.log(`Verbose: ${verbose}`)
  console.log(`Resume: ${resume}`)
  console.log('━'.repeat(50))
  console.log('')

  try {
    const executor = new DeterministicExecutor(yamlPath, { dryRun, verbose, resume })
    await executor.execute()
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { DeterministicExecutor }