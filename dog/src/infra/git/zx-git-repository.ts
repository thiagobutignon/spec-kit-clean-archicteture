import { type GitRepository } from '@/data/protocols/git/git-repository'
import { $ } from 'zx'

export class ZxGitRepository implements GitRepository {
  constructor () {
    $.verbose = false
  }

  async status (): Promise<string> {
    const result = await $`git status --porcelain`
    return result.stdout.trim()
  }

  async add (filePath: string | string[]): Promise<void> {
    const files = Array.isArray(filePath) ? filePath : [filePath]
    await $`git add ${files}`
  }

  async commit (message: string): Promise<void> {
    await $`git commit -m ${message}`
  }

  async getHeadHash (): Promise<string> {
    const result = await $`git rev-parse HEAD`
    return result.stdout.trim()
  }

  async resetHead (): Promise<void> {
    await $`git reset HEAD`
  }

  async checkout (filePath: string): Promise<void> {
    await $`git checkout HEAD -- ${filePath}`
  }
}
