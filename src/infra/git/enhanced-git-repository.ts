import { type GitRepository } from '@/data/protocols/git/git-repository'
import { $ } from 'zx'

export class EnhancedGitRepository implements GitRepository {
  async add (path: string): Promise<void> {
    await $`git add ${path}`
  }

  async commit (message: string): Promise<void> {
    await $`git commit -m ${message}`
  }

  async getHeadHash (): Promise<string> {
    const result = await $`git rev-parse --short HEAD`
    return result.stdout.trim()
  }

  async status (): Promise<string> {
    const result = await $`git status --porcelain`
    return result.stdout.trim()
  }

  async resetHead (): Promise<void> {
    await $`git reset HEAD`
  }

  async checkoutFile (path: string): Promise<void> {
    await $`git checkout HEAD -- ${path}`
  }
}
