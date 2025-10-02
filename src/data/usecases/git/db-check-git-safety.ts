import { type CheckGitSafety } from '@/domain/usecases/check-git-safety'
import { type GitRepository } from '@/data/protocols/git/git-repository'
import { type Logger } from '@/data/protocols/log/logger'

export class DbCheckGitSafety implements CheckGitSafety {
  constructor (
    private readonly gitRepository: GitRepository,
    private readonly logger: Logger
  ) {}

  async check (params: CheckGitSafety.Params): Promise<CheckGitSafety.Result> {
    const { config } = params

    const statusOutput = await this.gitRepository.status()
    const hasUncommittedChanges = statusOutput.trim().length > 0

    if (hasUncommittedChanges) {
      this.logger.warn('Uncommitted changes detected')

      if (!config.interactiveSafety) {
        this.logger.info('Non-interactive mode: continuing after delay')
        return {
          safe: true,
          hasUncommittedChanges,
          userConfirmed: false
        }
      }
    }

    return {
      safe: true,
      hasUncommittedChanges,
      userConfirmed: true
    }
  }
}
