export interface PackageManagerRepository {
  detect: () => Promise<PackageManagerRepository.DetectResult>
  isInstalled: (pm: string) => Promise<boolean>
}

export namespace PackageManagerRepository {
  export type DetectResult = {
    packageManager: 'npm' | 'yarn' | 'pnpm'
  }
}
