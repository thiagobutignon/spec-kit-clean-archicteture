export interface RLHFRepository {
  calculateScore: (params: RLHFRepository.ScoreParams) => Promise<RLHFRepository.ScoreResult>
  saveScore: (params: RLHFRepository.SaveParams) => Promise<void>
}

export namespace RLHFRepository {
  export type ScoreParams = {
    stepType: string
    success: boolean
    layerInfo?: {
      target: string
      layer: string
    }
    output?: string
  }

  export type ScoreResult = {
    score: number
  }

  export type SaveParams = {
    stepId: string
    score: number
    timestamp: string
  }
}
