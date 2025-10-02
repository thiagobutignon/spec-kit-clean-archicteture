import 'module-alias/register'
import { makeExecutePlanController } from './factories/controllers/execute-plan-controller-factory'
import { ChalkLoggerAdapter } from '../infra/log/chalk-logger-adapter'

const main = async (): Promise<void> => {
  const logger = new ChalkLoggerAdapter()
  const args = process.argv.slice(2)

  if (args.length < 1) {
    logger.error('Usage: ts-node src/main/server.ts <path_to_implementation.yaml>')
    process.exit(1)
  }

  const implementationPath = args[0]
  const controller = makeExecutePlanController()

  const response = await controller.handle({ implementationPath })

  if (response.statusCode >= 400) {
    logger.error(`Execution failed with status ${response.statusCode}:`, response.body)
    process.exit(1)
  } else {
    logger.success('Execution finished.')
  }
}

main().catch(console.error)
