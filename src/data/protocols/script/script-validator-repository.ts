export interface ScriptValidatorRepository {
  validate: (params: ScriptValidatorRepository.ValidateParams) => Promise<ScriptValidatorRepository.ValidateResult>
}

export namespace ScriptValidatorRepository {
  export type ValidateParams = {
    script: string
    allowedScripts: string[]
  }

  export type ValidateResult = {
    safe: boolean
    reason?: string
  }
}
