import { type PackageManagerRepository } from '@/data/protocols/package/package-manager-repository'
import { type FileSystem } from '@/data/protocols/fs/file-system'
import { $ } from 'zx'

export class PackageManagerDetector implements PackageManagerRepository {
  constructor (
    private readonly fileSystem: FileSystem
  ) {}

  async detect (): Promise<PackageManagerRepository.DetectResult> {
    if (await this.fileSystem.pathExists('pnpm-lock.yaml')) {
      if (await this.isInstalled('pnpm')) {
        return { packageManager: 'pnpm' }
      }
    }

    if (await this.fileSystem.pathExists('yarn.lock')) {
      if (await this.isInstalled('yarn')) {
        return { packageManager: 'yarn' }
      }
    }

    return { packageManager: 'npm' }
  }

  async isInstalled (pm: string): Promise<boolean> {
    try {
      $.verbose = false
      await $`which ${pm}`
      $.verbose = true
      return true
    } catch {
      $.verbose = true
      return false
    }
  }
}
