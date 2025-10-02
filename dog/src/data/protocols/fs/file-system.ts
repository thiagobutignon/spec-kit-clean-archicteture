export interface FileSystem {
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  ensureDir: (path: string) => Promise<void>
  pathExists: (path: string) => Promise<boolean>
  remove: (path: string) => Promise<void>
  chmod: (path: string, mode: string | number) => Promise<void>
}
