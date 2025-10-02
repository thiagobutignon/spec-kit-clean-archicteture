export type CheckResult = {
  passed: boolean
  output: string
}

export type QualityCheckResult = {
  lint: CheckResult
  test: CheckResult
  overallPassed: boolean
}
