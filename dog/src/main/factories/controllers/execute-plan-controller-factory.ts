import { ExecutePlanController } from '@/presentation/controllers/cli/execute-plan-controller'
import { type Controller } from '@/presentation/protocols'
import { makeDbExecutePlan } from '@/main/factories/usecases/db-execute-plan-factory'

export const makeExecutePlanController = (): Controller => {
  const executePlan = makeDbExecutePlan()
  return new ExecutePlanController(executePlan)
}
