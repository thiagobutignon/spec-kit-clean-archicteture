import { type QualityCheckRepository } from '@/data/protocols/quality/quality-check-repository'
import { $ } from 'zx'

export class NpmQualityCheckAdapter implements QualityCheckRepository {
  async runLint (command: string): Promise<QualityCheckRepository.CheckResult> {
    try {
      $.verbose = false
      const result = await $`npm run ${command}`
      $.verbose = true

      return {
        passed: true,
        output: result.stdout + result.stderr
      }
    } catch (error) {
      $.verbose = true
      const output = this.extractOutput(error)

      return {
        passed: false,
        output
      }
    }
  }

  async runTest (command: string): Promise<QualityCheckRepository.CheckResult> {
    try {
      $.verbose = false
      const result = await $`npm run ${command}`
      $.verbose = true

      return {
        passed: true,
        output: result.stdout + result.stderr
      }
    } catch (error) {
      $.verbose = true
      const output = this.extractOutput(error)

      return {
        passed: false,
        output
      }
    }
  }

  private extractOutput (error: unknown): string {
    if (typeof error === 'object' && error !== null) {
      const err = error as { stdout?: string; stderr?: string }
      return (err.stdout || '') + (err.stderr || '')
    }
    return String(error)
  }
}
