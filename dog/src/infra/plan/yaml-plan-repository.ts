import { type PlanLoaderRepository, type PlanSaverRepository } from '@/data/protocols/plan/plan-repository'
import { type ImplementationPlan } from '@/domain/models/implementation-plan'
import fs from 'fs/promises'
import yaml from 'yaml'

export class YamlPlanRepository implements PlanLoaderRepository, PlanSaverRepository {
  async load (path: string): Promise<ImplementationPlan> {
    const fileContent = await fs.readFile(path, 'utf-8')
    return yaml.parse(fileContent)
  }

  async save (path: string, plan: ImplementationPlan): Promise<void> {
    const yamlString = yaml.stringify(plan)
    await fs.writeFile(path, yamlString, 'utf-8')
  }
}
