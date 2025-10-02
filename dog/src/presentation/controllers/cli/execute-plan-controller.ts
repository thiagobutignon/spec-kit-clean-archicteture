import { type Controller, type HttpResponse } from '@/presentation/protocols'
import { type ExecutePlan } from '@/domain/usecases/execute-plan'
import { badRequest, ok, serverError } from '@/presentation/helpers/http-helper'
import { MissingParamError } from '@/presentation/errors/missing-param-error'

export class ExecutePlanController implements Controller<ExecutePlanController.Request> {
  constructor (
    private readonly executePlan: ExecutePlan
  ) {}

  async handle (request: ExecutePlanController.Request): Promise<HttpResponse> {
    try {
      if (!request.implementationPath) {
        return badRequest(new MissingParamError('implementationPath'))
      }
      const result = await this.executePlan.execute({
        implementationPath: request.implementationPath
      })
      return ok(result)
    } catch (error) {
      return serverError(error as Error)
    }
  }
}

export namespace ExecutePlanController {
  export type Request = {
    implementationPath: string
  }
}
