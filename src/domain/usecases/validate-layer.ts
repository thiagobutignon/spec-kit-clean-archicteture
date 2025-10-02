import { type Step } from '@/domain/models/implementation-plan'

export interface ValidateLayer {
  validate: (params: ValidateLayer.Params) => Promise<ValidateLayer.Result>
}

export namespace ValidateLayer {
  export type Params = {
    step: Step
    layerInfo: {
      target: string
      layer: string
    }
  }

  export type Result = {
    valid: boolean
    warnings: string[]
    violations: string[]
  }
}
