import { type CommitConfig } from '@/domain/models/commit-config'

export interface CheckGitSafety {
  check: (params: CheckGitSafety.Params) => Promise<CheckGitSafety.Result>
}

export namespace CheckGitSafety {
  export type Params = {
    config: CommitConfig
  }

  export type Result = {
    safe: boolean
    hasUncommittedChanges: boolean
    userConfirmed?: boolean
  }
}
