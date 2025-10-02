export interface ExecuteValidationScript {
  execute: (params: ExecuteValidationScript.Params) => Promise<ExecuteValidationScript.Result>
}

export namespace ExecuteValidationScript {
  export type Params = {
    scriptContent: string
    stepId: string
  }

  export type Result = {
    output: string
    success: boolean
  }
}
