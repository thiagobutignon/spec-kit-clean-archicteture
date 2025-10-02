import { type DetectPackageManager } from '@/domain/usecases/detect-package-manager'
import { type PackageManagerRepository } from '@/data/protocols/package/package-manager-repository'

export class DbDetectPackageManager implements DetectPackageManager {
  constructor (
    private readonly repository: PackageManagerRepository
  ) {}

  async detect (): Promise<DetectPackageManager.Result> {
    const result = await this.repository.detect()

    const commands: Record<string, string> = {
      npm: 'npm run',
      yarn: 'yarn',
      pnpm: 'pnpm'
    }

    return {
      packageManager: result.packageManager,
      command: commands[result.packageManager]
    }
  }
}
