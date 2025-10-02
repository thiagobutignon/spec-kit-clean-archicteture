import { type ValidateTemplate } from '@/domain/usecases/validate-template'
import { type FileSystem } from '@/data/protocols/fs/file-system'
import { type TemplateValidatorRepository } from '@/data/protocols/template/template-validator-repository'

export class DbValidateTemplate implements ValidateTemplate {
  constructor (
    private readonly fileSystem: FileSystem,
    private readonly validator: TemplateValidatorRepository
  ) {}

  async validate (params: ValidateTemplate.Params): Promise<ValidateTemplate.Result> {
    const { implementationPath } = params

    const content = await this.fileSystem.readFile(implementationPath)
    const result = await this.validator.validateSchema({ content })

    return {
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings
    }
  }
}
