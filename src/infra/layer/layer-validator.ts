import { type LayerValidatorRepository } from '@/data/protocols/layer/layer-validator-repository'

export class LayerValidator implements LayerValidatorRepository {
  private readonly forbiddenImports: Record<string, string[]> = {
    domain: ['@/data', '@/infra', '@/presentation', '@/validation', '@/main'],
    data: ['@/infra', '@/presentation', '@/validation', '@/main'],
    infra: ['@/presentation', '@/validation', '@/main'],
    presentation: ['@/data', '@/infra', '@/main'],
    validation: ['@/domain', '@/data', '@/infra', '@/main']
  }

  async validateImports (params: LayerValidatorRepository.ValidateParams): Promise<LayerValidatorRepository.ValidateResult> {
    const { code, layer } = params
    const violations: string[] = []
    const warnings: string[] = []

    const forbidden = this.forbiddenImports[layer] || []

    for (const forbiddenPath of forbidden) {
      if (code.includes(`from '${forbiddenPath}`) || code.includes(`from "${forbiddenPath}`)) {
        violations.push(`Layer '${layer}' cannot import from '${forbiddenPath}'`)
      }
    }

    if (layer === 'domain') {
      if (code.match(/import.*from\s+['"](?!@\/domain)[^'"]+['"]/)) {
        warnings.push('Domain layer should only import from @/domain')
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings
    }
  }
}
