import { DbExecutePlan } from '@/data/usecases/plan/db-execute-plan'
import { type ExecutePlan } from '@/domain/usecases/execute-plan'
import { FsExtraAdapter } from '@/infra/fs/fs-extra-adapter'
import { ZxGitRepository } from '@/infra/git/zx-git-repository'
import { ChalkLoggerAdapter } from '@/infra/log/chalk-logger-adapter'
import { YamlPlanRepository } from '@/infra/plan/yaml-plan-repository'

export const makeDbExecutePlan = (): ExecutePlan => {
  const yamlPlanRepository = new YamlPlanRepository()
  const fsExtraAdapter = new FsExtraAdapter()
  const zxGitRepository = new ZxGitRepository()
  const chalkLoggerAdapter = new ChalkLoggerAdapter()
  return new DbExecutePlan(
    yamlPlanRepository,
    yamlPlanRepository,
    fsExtraAdapter,
    zxGitRepository,
    chalkLoggerAdapter
  )
}
