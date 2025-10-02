import { type FileSystem } from '@/data/protocols/fs/file-system'
import fs from 'fs-extra'

export class FsExtraAdapter implements FileSystem {
  async readFile (path: string): Promise<string> {
    return fs.readFile(path, 'utf-8')
  }

  async writeFile (path: string, content: string): Promise<void> {
    await fs.writeFile(path, content)
  }

  async ensureDir (path: string): Promise<void> {
    await fs.ensureDir(path)
  }

  async pathExists (path: string): Promise<boolean> {
    return fs.pathExists(path)
  }

  async remove (path: string): Promise<void> {
    await fs.remove(path)
  }

  async chmod (path: string, mode: string | number): Promise<void> {
    await fs.chmod(path, mode)
  }
}
