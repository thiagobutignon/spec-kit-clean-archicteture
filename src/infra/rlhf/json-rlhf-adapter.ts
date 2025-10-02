import { type RLHFRepository } from '@/data/protocols/rlhf/rlhf-repository'
import { type FileSystem } from '@/data/protocols/fs/file-system'

export class JsonRLHFAdapter implements RLHFRepository {
  private scores: Map<string, number> = new Map()

  constructor (
    private readonly fileSystem: FileSystem
  ) {}

  async calculateScore (params: RLHFRepository.ScoreParams): Promise<RLHFRepository.ScoreResult> {
    const { success, layerInfo } = params

    let score = success ? 1 : 0

    if (layerInfo) {
      if (layerInfo.layer === 'domain' || layerInfo.layer === 'main') {
        score = success ? 1.2 : -0.5
      }
    }

    return { score }
  }

  async saveScore (params: RLHFRepository.SaveParams): Promise<void> {
    const { stepId, score } = params
    this.scores.set(stepId, score)
  }
}
