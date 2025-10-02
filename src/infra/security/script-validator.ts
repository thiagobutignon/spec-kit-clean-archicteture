import { type ScriptValidatorRepository } from '@/data/protocols/script/script-validator-repository'

export class ScriptValidator implements ScriptValidatorRepository {
  private readonly dangerousKeywords = [
    'rm', 'rmdir', 'del', 'delete',
    'chmod', 'chown', 'sudo', 'su',
    'curl', 'wget', 'nc', 'ssh',
    'kill', 'killall', 'eval', 'exec'
  ]

  async validate (params: ScriptValidatorRepository.ValidateParams): Promise<ScriptValidatorRepository.ValidateResult> {
    const { script, allowedScripts } = params

    if (allowedScripts.includes(script)) {
      return { safe: true }
    }

    const safePattern = /^[a-zA-Z0-9:\-\s]+$/
    if (!safePattern.test(script)) {
      return {
        safe: false,
        reason: 'Script contains invalid characters'
      }
    }

    for (const keyword of this.dangerousKeywords) {
      if (script.includes(keyword)) {
        return {
          safe: false,
          reason: `Script contains dangerous keyword: ${keyword}`
        }
      }
    }

    return { safe: true }
  }
}
