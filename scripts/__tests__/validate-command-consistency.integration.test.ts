/**
 * Integration Tests for Command Consistency Validator
 * Tests the CLI behavior including exit codes for CI/CD integration
 * Part of Issue #152 - Process for maintaining prompt consistency
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs/promises'

const execAsync = promisify(exec)

describe('Command Consistency Validator CLI', () => {
  const scriptPath = path.join(__dirname, '..', 'validate-command-consistency.ts')
  const projectRoot = path.join(__dirname, '..', '..')

  describe('Exit Codes for CI/CD', () => {
    it('should exit with code 0 when validation passes', async () => {
      // Run the actual validator on the real project
      try {
        const { stdout } = await execAsync(`npx tsx ${scriptPath}`, {
          cwd: projectRoot,
          env: { ...process.env, FORCE_COLOR: '0' }
        })

        // Should complete without throwing
        expect(stdout).toContain('ALL CHECKS PASSED')
      } catch (error: any) {
        // If it throws, the exit code was non-zero
        throw new Error(`Expected exit code 0, but got non-zero exit. Error: ${error.message}`)
      }
    }, 30000) // 30 second timeout for integration test

    it('should exit with code 1 when validation fails', async () => {
      // Create a temporary test directory with invalid content
      const testDir = path.join(__dirname, '__temp_test__')
      const commandsDir = path.join(testDir, '.claude', 'commands')

      try {
        // Setup: Create test directory structure
        await fs.mkdir(commandsDir, { recursive: true })

        // Create a command file missing required terms
        await fs.writeFile(
          path.join(commandsDir, '01-plan-layer-features.md'),
          'This file is missing the required terms'
        )

        // Create other required files with missing terms
        await fs.writeFile(
          path.join(commandsDir, '02-validate-layer-plan.md'),
          'Missing sharedComponents'
        )
        await fs.writeFile(
          path.join(commandsDir, '03-generate-layer-code.md'),
          'Missing sharedComponents'
        )

        // Run validator with test directory
        try {
          await execAsync(`npx tsx ${scriptPath}`, {
            cwd: testDir,
            env: { ...process.env, FORCE_COLOR: '0' }
          })

          // Should not reach here - validation should fail
          throw new Error('Expected validation to fail but it passed')
        } catch (error: any) {
          // Expected to throw because exit code is 1
          expect(error.code).toBe(1)
          expect(error.stdout || error.stderr).toContain('VALIDATION FAILED')
        }
      } finally {
        // Cleanup: Remove test directory
        try {
          await fs.rm(testDir, { recursive: true, force: true })
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }, 30000)
  })

  describe('CLI Help', () => {
    it('should display help text with --help flag', async () => {
      const { stdout } = await execAsync(`npx tsx ${scriptPath} --help`, {
        cwd: projectRoot,
        env: { ...process.env, FORCE_COLOR: '0' }
      })

      expect(stdout).toContain('Command Consistency Validator')
      expect(stdout).toContain('Usage:')
      expect(stdout).toContain('Purpose:')
      expect(stdout).toContain('Issue #152')
    }, 10000)

    it('should display help text with -h flag', async () => {
      const { stdout } = await execAsync(`npx tsx ${scriptPath} -h`, {
        cwd: projectRoot,
        env: { ...process.env, FORCE_COLOR: '0' }
      })

      expect(stdout).toContain('Command Consistency Validator')
    }, 10000)

    it('should exit with code 0 when showing help', async () => {
      // Should not throw
      await execAsync(`npx tsx ${scriptPath} --help`, {
        cwd: projectRoot
      })

      // If we reach here, exit code was 0
      expect(true).toBe(true)
    }, 10000)
  })

  describe('Real World Validation', () => {
    it('should validate actual project commands successfully', async () => {
      const { stdout } = await execAsync(`npm run validate:commands`, {
        cwd: projectRoot,
        env: { ...process.env, FORCE_COLOR: '0' }
      })

      // Should find and validate all key terms
      expect(stdout).toContain('sharedComponents')
      expect(stdout).toContain('useCases')
      expect(stdout).toContain('Edge Case')
      expect(stdout).toContain('RLHF')
      expect(stdout).toContain('Clean Architecture')

      // Should report success
      expect(stdout).toContain('ALL CHECKS PASSED')
      expect(stdout).toContain('Commands are synchronized and consistent')
    }, 30000)

    it('should check all expected command files', async () => {
      const { stdout } = await execAsync(`npm run validate:commands`, {
        cwd: projectRoot,
        env: { ...process.env, FORCE_COLOR: '0' }
      })

      // Should mention key command files
      expect(stdout).toContain('01-plan-layer-features.md')
      expect(stdout).toContain('02-validate-layer-plan.md')
      expect(stdout).toContain('03-generate-layer-code.md')
    }, 30000)

    it('should work when run from subdirectory', async () => {
      // Run from docs subdirectory
      const docsDir = path.join(projectRoot, 'docs')

      const { stdout } = await execAsync(`npm run validate:commands`, {
        cwd: docsDir,
        env: { ...process.env, FORCE_COLOR: '0' }
      })

      expect(stdout).toContain('ALL CHECKS PASSED')
    }, 30000)
  })

  describe('Error Output', () => {
    it('should provide actionable error messages', async () => {
      const testDir = path.join(__dirname, '__temp_error_test__')
      const commandsDir = path.join(testDir, '.claude', 'commands')

      try {
        await fs.mkdir(commandsDir, { recursive: true })

        // Create files missing specific terms
        await fs.writeFile(
          path.join(commandsDir, '01-plan-layer-features.md'),
          'Content without sharedComponents'
        )

        try {
          await execAsync(`npx tsx ${scriptPath}`, {
            cwd: testDir,
            env: { ...process.env, FORCE_COLOR: '0' }
          })
        } catch (error: any) {
          const output = error.stdout || error.stderr

          // Should mention the specific file and term
          expect(output).toContain('01-plan-layer-features.md')
          expect(output).toContain('sharedComponents')

          // Should provide recommended actions
          expect(output).toContain('Recommended Actions')
          expect(output).toContain('architectural-change-checklist.md')
        }
      } finally {
        try {
          await fs.rm(testDir, { recursive: true, force: true })
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }, 30000)
  })

  describe('Performance', () => {
    it('should complete validation in reasonable time', async () => {
      const startTime = Date.now()

      await execAsync(`npm run validate:commands`, {
        cwd: projectRoot,
        env: { ...process.env, FORCE_COLOR: '0' }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete in less than 5 seconds
      expect(duration).toBeLessThan(5000)
    }, 10000)
  })
})

describe('NPM Script Integration', () => {
  const projectRoot = path.join(__dirname, '..', '..')

  it('should be executable via npm script', async () => {
    const { stdout } = await execAsync('npm run validate:commands', {
      cwd: projectRoot,
      env: { ...process.env, FORCE_COLOR: '0' }
    })

    expect(stdout).toContain('Validating Command Consistency')
  }, 30000)

  it('should work with npx tsx directly', async () => {
    const scriptPath = 'scripts/validate-command-consistency.ts'

    const { stdout } = await execAsync(`npx tsx ${scriptPath}`, {
      cwd: projectRoot,
      env: { ...process.env, FORCE_COLOR: '0' }
    })

    expect(stdout).toContain('Validating Command Consistency')
  }, 30000)
})
