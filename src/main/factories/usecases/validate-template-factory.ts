import { type ValidateTemplate } from '@/domain/usecases/validate-template'
import { DbValidateTemplate } from '@/data/usecases/template/db-validate-template'
import { FsExtraAdapter } from '@/infra/fs/fs-extra-adapter'
import { YamlTemplateValidator } from '@/infra/template/yaml-template-validator'

export const makeValidateTemplate = (): ValidateTemplate => {
  const fileSystem = new FsExtraAdapter()
  const validator = new YamlTemplateValidator()
  return new DbValidateTemplate(fileSystem, validator)
}
