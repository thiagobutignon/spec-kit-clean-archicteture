import { type Step } from '@/domain/models/implementation-plan'

export interface CalculateScore {
  calculate: (params: CalculateScore.Params) => Promise<CalculateScore.Result>
}

export namespace CalculateScore {
  export type Params = {
    step: Step
    success: boolean
    output?: string
    layerInfo?: {
      target: string
      layer: string
    }
  }

  export type Result = {
    score: number
  }
}
