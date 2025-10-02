import { type RollbackStep } from '@/domain/usecases/rollback-step'
import { type GitRepository } from '@/data/protocols/git/git-repository'
import { type FileSystem } from '@/data/protocols/fs/file-system'
import { type Logger } from '@/data/protocols/log/logger'

export class DbRollbackStep implements RollbackStep {
  constructor (
    private readonly gitRepository: GitRepository,
    private readonly fileSystem: FileSystem,
    private readonly logger: Logger
  ) {}

  async rollback (params: RollbackStep.Params): Promise<RollbackStep.Result> {
    const { step } = params

    try {
      this.logger.info('Rolling back changes...')

      await this.gitRepository.resetHead()

      if (step.path && await this.fileSystem.pathExists(step.path)) {
        await this.gitRepository.checkoutFile(step.path)
      }

      return {
        success: true,
        message: 'Rollback completed successfully'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        message: `Rollback failed: ${message}`
      }
    }
  }
}
