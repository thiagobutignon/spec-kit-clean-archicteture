export interface ValidateScript {
  validate: (params: ValidateScript.Params) => Promise<ValidateScript.Result>
}

export namespace ValidateScript {
  export type Params = {
    script: string
    allowedScripts?: string[]
  }

  export type Result = {
    safe: boolean
    reason?: string
  }
}
