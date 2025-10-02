import { type ValidateScript } from '@/domain/usecases/validate-script'
import { type ScriptValidatorRepository } from '@/data/protocols/script/script-validator-repository'

export class DbValidateScript implements ValidateScript {
  constructor (
    private readonly validator: ScriptValidatorRepository
  ) {}

  async validate (params: ValidateScript.Params): Promise<ValidateScript.Result> {
    const { script, allowedScripts = [] } = params

    return await this.validator.validate({
      script,
      allowedScripts
    })
  }
}
