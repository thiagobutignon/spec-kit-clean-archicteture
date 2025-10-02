export interface QualityCheckRepository {
  runLint: (command: string) => Promise<QualityCheckRepository.CheckResult>
  runTest: (command: string) => Promise<QualityCheckRepository.CheckResult>
}

export namespace QualityCheckRepository {
  export type CheckResult = {
    passed: boolean
    output: string
  }
}
