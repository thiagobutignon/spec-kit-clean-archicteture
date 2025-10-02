import { type ConfigRepository } from '@/data/protocols/config/config-repository'
import { type CommitConfig } from '@/domain/models/commit-config'
import { type FileSystem } from '@/data/protocols/fs/file-system'
import * as yaml from 'yaml'

export class YamlConfigAdapter implements ConfigRepository {
  constructor (
    private readonly fileSystem: FileSystem
  ) {}

  async load (configPath: string): Promise<ConfigRepository.LoadResult> {
    try {
      const exists = await this.fileSystem.pathExists(configPath)

      if (!exists) {
        return {
          config: null,
          errors: ['Config file not found']
        }
      }

      const content = await this.fileSystem.readFile(configPath)
      const parsed = yaml.parse(content)

      const config: CommitConfig = {
        enabled: parsed.commit?.enabled ?? true,
        qualityChecks: {
          lint: parsed.commit?.quality_checks?.lint ?? true,
          lintCommand: parsed.commit?.quality_checks?.lint_command ?? 'lint',
          test: parsed.commit?.quality_checks?.test ?? true,
          testCommand: parsed.commit?.quality_checks?.test_command ?? 'test --run'
        },
        conventionalCommits: {
          enabled: parsed.commit?.conventional_commits?.enabled ?? true,
          typeMapping: parsed.commit?.conventional_commits?.type_mapping ?? {}
        },
        coAuthor: parsed.commit?.co_author ?? 'Claude <noreply@anthropic.com>',
        emoji: parsed.commit?.emoji ?? true,
        interactiveSafety: parsed.commit?.interactive_safety ?? true
      }

      return { config, errors: [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        config: null,
        errors: [`Failed to load config: ${message}`]
      }
    }
  }
}
