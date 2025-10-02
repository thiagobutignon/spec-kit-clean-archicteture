import { type ValidateLayer } from '@/domain/usecases/validate-layer'
import { type LayerValidatorRepository } from '@/data/protocols/layer/layer-validator-repository'

export class DbValidateLayer implements ValidateLayer {
  constructor (
    private readonly validator: LayerValidatorRepository
  ) {}

  async validate (params: ValidateLayer.Params): Promise<ValidateLayer.Result> {
    const { step, layerInfo } = params

    if (!step.template) {
      return { valid: true, warnings: [], violations: [] }
    }

    return await this.validator.validateImports({
      code: step.template,
      layer: layerInfo.layer
    })
  }
}
