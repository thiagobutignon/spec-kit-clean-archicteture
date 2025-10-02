export type CommitConfig = {
  enabled: boolean
  qualityChecks: {
    lint: boolean
    lintCommand: string
    test: boolean
    testCommand: string
  }
  conventionalCommits: {
    enabled: boolean
    typeMapping: Record<string, string>
  }
  coAuthor: string
  emoji: boolean
  interactiveSafety: boolean
}
