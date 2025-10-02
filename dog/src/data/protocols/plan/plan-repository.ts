import { type ImplementationPlan } from '@/domain/models/implementation-plan'

export interface PlanLoaderRepository {
  load: (path: string) => Promise<ImplementationPlan>
}

export interface PlanSaverRepository {
  save: (path: string, plan: ImplementationPlan) => Promise<void>
}
