export interface ValidateTemplate {
  validate: (params: ValidateTemplate.Params) => Promise<ValidateTemplate.Result>
}

export namespace ValidateTemplate {
  export type Params = {
    implementationPath: string
  }

  export type Result = {
    valid: boolean
    errors: string[]
    warnings: string[]
    targetValidated?: string
    layerValidated?: string
  }
}
