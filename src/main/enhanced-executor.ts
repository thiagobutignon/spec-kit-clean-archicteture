import { makeExecutePlan } from './factories/usecases/db-execute-plan-factory'
import { makeValidateTemplate } from './factories/usecases/validate-template-factory'
import { makeRunQualityCheck } from './factories/usecases/run-quality-check-factory'
import { makeCalculateScore } from './factories/usecases/calculate-score-factory'
import { makeRollbackStep } from './factories/usecases/rollback-step-factory'
import { makeCheckGitSafety } from './factories/usecases/check-git-safety-factory'

export const makeEnhancedExecutor = () => {
  return {
    executePlan: makeExecutePlan(),
    validateTemplate: makeValidateTemplate(),
    runQualityCheck: makeRunQualityCheck(),
    calculateScore: makeCalculateScore(),
    rollbackStep: makeRollbackStep(),
    checkGitSafety: makeCheckGitSafety()
  }
}
