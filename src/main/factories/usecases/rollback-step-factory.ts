import { type RollbackStep } from '@/domain/usecases/rollback-step'
import { DbRollbackStep } from '@/data/usecases/git/db-rollback-step'
import { EnhancedGitRepository } from '@/infra/git/enhanced-git-repository'
import { FsExtraAdapter } from '@/infra/fs/fs-extra-adapter'
import { ChalkLoggerAdapter } from '@/infra/log/chalk-logger-adapter'

export const makeRollbackStep = (): RollbackStep => {
  const gitRepository = new EnhancedGitRepository()
  const fileSystem = new FsExtraAdapter()
  const logger = new ChalkLoggerAdapter()
  return new DbRollbackStep(gitRepository, fileSystem, logger)
}
