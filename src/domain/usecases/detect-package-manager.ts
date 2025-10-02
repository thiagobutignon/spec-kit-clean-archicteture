export interface DetectPackageManager {
  detect: () => Promise<DetectPackageManager.Result>
}

export namespace DetectPackageManager {
  export type Result = {
    packageManager: 'npm' | 'yarn' | 'pnpm'
    command: string
  }
}
