import { type QualityCheckResult } from '@/domain/models/quality-check-result'
import { type CommitConfig } from '@/domain/models/commit-config'

export interface RunQualityCheck {
  run: (params: RunQualityCheck.Params) => Promise<RunQualityCheck.Result>
}

export namespace RunQualityCheck {
  export type Params = {
    config: CommitConfig
  }

  export type Result = QualityCheckResult
}
