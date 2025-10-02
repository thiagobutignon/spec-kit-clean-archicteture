import { type ExecuteValidationScript } from '@/domain/usecases/execute-validation-script'
import { type ScriptExecutorRepository } from '@/data/protocols/script/script-executor-repository'
import { type Logger } from '@/data/protocols/log/logger'

export class DbExecuteValidationScript implements ExecuteValidationScript {
  constructor (
    private readonly executor: ScriptExecutorRepository,
    private readonly logger: Logger
  ) {}

  async execute (params: ExecuteValidationScript.Params): Promise<ExecuteValidationScript.Result> {
    const { scriptContent, stepId } = params

    this.logger.info(`Running validation script for step: ${stepId}`)

    return await this.executor.execute({
      scriptContent,
      stepId
    })
  }
}
