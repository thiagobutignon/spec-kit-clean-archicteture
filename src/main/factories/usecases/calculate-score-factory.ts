import { type CalculateScore } from '@/domain/usecases/calculate-score'
import { DbCalculateScore } from '@/data/usecases/rlhf/db-calculate-score'
import { JsonRLHFAdapter } from '@/infra/rlhf/json-rlhf-adapter'
import { FsExtraAdapter } from '@/infra/fs/fs-extra-adapter'

export const makeCalculateScore = (): CalculateScore => {
  const fileSystem = new FsExtraAdapter()
  const rlhfRepository = new JsonRLHFAdapter(fileSystem)
  return new DbCalculateScore(rlhfRepository)
}
