import { type CommitConfig } from '@/domain/models/commit-config'

export interface ConfigRepository {
  load: (configPath: string) => Promise<ConfigRepository.LoadResult>
}

export namespace ConfigRepository {
  export type LoadResult = {
    config: CommitConfig | null
    errors?: string[]
  }
}
