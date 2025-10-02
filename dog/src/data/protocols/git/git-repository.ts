export interface GitRepository {
  status: () => Promise<string>
  add: (filePath: string | string[]) => Promise<void>
  commit: (message: string) => Promise<void>
  getHeadHash: () => Promise<string>
  resetHead: () => Promise<void>
  checkout: (filePath: string) => Promise<void>
}

export namespace GitRepository {
  export type StatusResult = {
    isClean: boolean
    files: string[]
  }
}
