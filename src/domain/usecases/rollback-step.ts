import { type Step } from '@/domain/models/implementation-plan'

export interface RollbackStep {
  rollback: (params: RollbackStep.Params) => Promise<RollbackStep.Result>
}

export namespace RollbackStep {
  export type Params = {
    step: Step
    lastKnownCommitHash: string | null
  }

  export type Result = {
    success: boolean
    message: string
  }
}
