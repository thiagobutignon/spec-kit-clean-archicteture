import { type RunQualityCheck } from '@/domain/usecases/run-quality-check'
import { DbRunQualityCheck } from '@/data/usecases/quality/db-run-quality-check'
import { NpmQualityCheckAdapter } from '@/infra/quality/npm-quality-check-adapter'
import { ChalkLoggerAdapter } from '@/infra/log/chalk-logger-adapter'

export const makeRunQualityCheck = (): RunQualityCheck => {
  const qualityCheck = new NpmQualityCheckAdapter()
  const logger = new ChalkLoggerAdapter()
  return new DbRunQualityCheck(qualityCheck, logger)
}
