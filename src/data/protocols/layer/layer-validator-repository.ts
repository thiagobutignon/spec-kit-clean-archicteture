export interface LayerValidatorRepository {
  validateImports: (params: LayerValidatorRepository.ValidateParams) => Promise<LayerValidatorRepository.ValidateResult>
}

export namespace LayerValidatorRepository {
  export type ValidateParams = {
    code: string
    layer: string
  }

  export type ValidateResult = {
    valid: boolean
    violations: string[]
    warnings: string[]
  }
}
