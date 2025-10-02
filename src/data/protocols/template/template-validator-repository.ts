export interface TemplateValidatorRepository {
  validateSchema: (params: TemplateValidatorRepository.ValidateParams) => Promise<TemplateValidatorRepository.ValidateResult>
}

export namespace TemplateValidatorRepository {
  export type ValidateParams = {
    content: string
  }

  export type ValidateResult = {
    valid: boolean
    errors: string[]
    warnings: string[]
  }
}
