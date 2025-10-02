import { type ExecutePlan } from '@/domain/usecases/execute-plan'
import { type Step, type ImplementationPlan } from '@/domain/models/implementation-plan'
import { type FileSystem } from '@/data/protocols/fs/file-system'
import { type GitRepository } from '@/data/protocols/git/git-repository'
import { type Logger } from '@/data/protocols/log/logger'
import { type PlanLoaderRepository, type PlanSaverRepository } from '@/data/protocols/plan/plan-repository'

export class DbExecutePlan implements ExecutePlan {
  constructor (
    private readonly planLoaderRepository: PlanLoaderRepository,
    private readonly planSaverRepository: PlanSaverRepository,
    private readonly fileSystem: FileSystem,
    private readonly gitRepository: GitRepository,
    private readonly logger: Logger
  ) {}

  async execute (params: ExecutePlan.Params): Promise<ExecutePlan.Result> {
    const { implementationPath } = params
    const plan: ImplementationPlan = await this.planLoaderRepository.load(implementationPath)
    this.logger.info(`🚀 Starting execution of ${plan.steps.length} steps...`)

    for (const [index, step] of plan.steps.entries()) {
      this.logger.info(`\n▶️  Processing Step ${index + 1}/${plan.steps.length}: ${step.id}`)
      if (step.status === 'SUCCESS' || step.status === 'SKIPPED') {
        this.logger.log(`   ⏭️  Skipping step with status '${step.status}'.`)
        continue
      }
      try {
        await this.executeStepAction(step)
        step.status = 'SUCCESS'
        step.execution_log = `Completed successfully at ${new Date().toISOString()}`
        await this.commitStep(step)
      } catch (stepError) {
        step.status = 'FAILED'
        step.execution_log = `Failed at ${new Date().toISOString()}.\nError: ${(stepError as Error).message}`
        await this.planSaverRepository.save(implementationPath, plan)
        this.logger.error(`❌ Step '${step.id}' failed.`, stepError as Error)
        return { finalPlan: plan, success: false }
      }
    }

    plan.evaluation = { ...plan.evaluation, final_status: 'SUCCESS' }
    await this.planSaverRepository.save(implementationPath, plan)
    this.logger.success('\n🎉 All steps completed successfully!')
    return { finalPlan: plan, success: true }
  }

  private async executeStepAction (step: Step): Promise<void> {
    switch (step.type) {
      case 'create_file':
        if (!step.path || !step.template) throw new Error('Missing path or template for create_file')
        this.logger.log(`   📄 Creating file: ${step.path}`)
        await this.fileSystem.ensureDir(step.path.substring(0, step.path.lastIndexOf('/')))
        await this.fileSystem.writeFile(step.path, step.template)
        break
      case 'delete_file':
        if (!step.path) throw new Error('Missing path for delete_file')
        this.logger.log(`   🗑️ Deleting file: ${step.path}`)
        if (await this.fileSystem.pathExists(step.path)) {
          await this.fileSystem.remove(step.path)
        } else {
          this.logger.warn(`   ⚠️  File to delete at ${step.path} does not exist.`)
        }
        break
      // Other step types would be implemented here
      default:
        this.logger.warn(`   ⚠️  Step type '${step.type}' not implemented. Skipping.`)
    }
  }

  private async commitStep (step: Step): Promise<void> {
    if (step.type !== 'create_file' && step.type !== 'refactor_file' && step.type !== 'delete_file') {
      return
    }
    try {
      if (step.path) {
        await this.gitRepository.add(step.path)
        const commitMessage = `feat(${step.id}): ${step.type.replace('_', ' ')} ${step.path}`
        await this.gitRepository.commit(commitMessage)
        const hash = await this.gitRepository.getHeadHash()
        this.logger.success(`   ✅ Committed: ${hash.substring(0, 7)} - ${commitMessage}`)
      }
    } catch {
      this.logger.warn(`   ⚠️  Could not commit step ${step.id}. Maybe no changes were made.`)
    }
  }
}
