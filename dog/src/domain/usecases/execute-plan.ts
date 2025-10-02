import { type ImplementationPlan } from '@/domain/models/implementation-plan'

export interface ExecutePlan {
  execute: (params: ExecutePlan.Params) => Promise<ExecutePlan.Result>
}

export namespace ExecutePlan {
  export type Params = {
    implementationPath: string
  }

  export type Result = {
    finalPlan: ImplementationPlan
    success: boolean
  }
}
