import { type CheckGitSafety } from '@/domain/usecases/check-git-safety'
import { DbCheckGitSafety } from '@/data/usecases/git/db-check-git-safety'
import { EnhancedGitRepository } from '@/infra/git/enhanced-git-repository'
import { ChalkLoggerAdapter } from '@/infra/log/chalk-logger-adapter'

export const makeCheckGitSafety = (): CheckGitSafety => {
  const gitRepository = new EnhancedGitRepository()
  const logger = new ChalkLoggerAdapter()
  return new DbCheckGitSafety(gitRepository, logger)
}
