export interface ScriptExecutorRepository {
  execute: (params: ScriptExecutorRepository.ExecuteParams) => Promise<ScriptExecutorRepository.ExecuteResult>
}

export namespace ScriptExecutorRepository {
  export type ExecuteParams = {
    scriptContent: string
    stepId: string
  }

  export type ExecuteResult = {
    output: string
    success: boolean
  }
}
