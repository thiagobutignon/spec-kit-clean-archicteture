import { type ScriptExecutorRepository } from '@/data/protocols/script/script-executor-repository'
import { type FileSystem } from '@/data/protocols/fs/file-system'
import { $ } from 'zx'
import * as os from 'os'
import * as path from 'path'

export class BashScriptExecutor implements ScriptExecutorRepository {
  constructor (
    private readonly fileSystem: FileSystem
  ) {}

  async execute (params: ScriptExecutorRepository.ExecuteParams): Promise<ScriptExecutorRepository.ExecuteResult> {
    const { scriptContent, stepId } = params

    const tempScriptPath = path.join(os.tmpdir(), `step-${stepId}.sh`)

    try {
      await this.fileSystem.writeFile(tempScriptPath, scriptContent)

      $.verbose = false
      const result = await $`bash ${tempScriptPath}`
      $.verbose = true

      await this.fileSystem.remove(tempScriptPath)

      return {
        output: result.stdout + result.stderr,
        success: true
      }
    } catch (error) {
      $.verbose = true

      try {
        await this.fileSystem.remove(tempScriptPath)
      } catch {
        // Ignore cleanup errors
      }

      const message = error instanceof Error ? error.message : String(error)
      return {
        output: message,
        success: false
      }
    }
  }
}
