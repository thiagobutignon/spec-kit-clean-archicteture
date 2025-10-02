import { type CalculateScore } from '@/domain/usecases/calculate-score'
import { type RLHFRepository } from '@/data/protocols/rlhf/rlhf-repository'

export class DbCalculateScore implements CalculateScore {
  constructor (
    private readonly rlhfRepository: RLHFRepository
  ) {}

  async calculate (params: CalculateScore.Params): Promise<CalculateScore.Result> {
    const { step, success, output, layerInfo } = params

    const result = await this.rlhfRepository.calculateScore({
      stepType: step.type,
      success,
      layerInfo,
      output
    })

    await this.rlhfRepository.saveScore({
      stepId: step.id,
      score: result.score,
      timestamp: new Date().toISOString()
    })

    return { score: result.score }
  }
}
