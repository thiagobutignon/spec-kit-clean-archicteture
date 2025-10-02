import { type RunQualityCheck } from '@/domain/usecases/run-quality-check'
import { type QualityCheckRepository } from '@/data/protocols/quality/quality-check-repository'
import { type Logger } from '@/data/protocols/log/logger'

export class DbRunQualityCheck implements RunQualityCheck {
  constructor (
    private readonly qualityCheck: QualityCheckRepository,
    private readonly logger: Logger
  ) {}

  async run (params: RunQualityCheck.Params): Promise<RunQualityCheck.Result> {
    const { config } = params

    let lintResult = { passed: true, output: '' }
    let testResult = { passed: true, output: '' }

    if (config.qualityChecks.lint) {
      this.logger.info('Running lint check...')
      lintResult = await this.qualityCheck.runLint(config.qualityChecks.lintCommand)
    }

    if (config.qualityChecks.test) {
      this.logger.info('Running tests...')
      testResult = await this.qualityCheck.runTest(config.qualityChecks.testCommand)
    }

    return {
      lint: lintResult,
      test: testResult,
      overallPassed: lintResult.passed && testResult.passed
    }
  }
}
