import { type TemplateValidatorRepository } from '@/data/protocols/template/template-validator-repository'
import * as yaml from 'yaml'

export class YamlTemplateValidator implements TemplateValidatorRepository {
  async validateSchema (params: TemplateValidatorRepository.ValidateParams): Promise<TemplateValidatorRepository.ValidateResult> {
    const { content } = params
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const parsed = yaml.parse(content)

      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        errors.push('Missing or invalid steps array')
      }

      if (parsed.steps) {
        parsed.steps.forEach((step: unknown, index: number) => {
          if (typeof step !== 'object' || step === null) {
            errors.push(`Step ${index} is not an object`)
            return
          }

          const s = step as Record<string, unknown>
          if (!s.id) errors.push(`Step ${index}: missing id`)
          if (!s.type) errors.push(`Step ${index}: missing type`)
          if (!s.path && s.type === 'create_file') {
            errors.push(`Step ${index}: missing path for create_file`)
          }
        })
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        valid: false,
        errors: [`YAML parsing error: ${message}`],
        warnings
      }
    }
  }
}
