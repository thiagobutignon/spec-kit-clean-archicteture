import { z } from 'zod'

/**
 * Unified Zod schema for ALL template YAML files
 * This schema validates any template following the spec-kit-clean-architecture standards
 */

// ==================== Common Enums ====================

const StepStatusSchema = z.enum(['PENDING', 'SUCCESS', 'FAILED', 'SKIPPED'])

const StepTypeSchema = z.enum([
  'branch',
  'folder',
  'create_file',
  'create_multiple_files',
  'refactor_file',
  'delete_file',
  'pull_request'
])

const ReferenceTypeSchema = z.enum([
  'external_pattern',
  'internal_guideline',
  'internal_code_analysis',
  'internal_correction',
  'quality_improvement',
  'architecture_fix',
  'external_documentation'
])

const LayerTypeSchema = z.enum([
  'domain',
  'data',
  'application',
  'infrastructure',
  'presentation'
])

// ==================== Metadata Schemas ====================

const UbiquitousLanguageItemSchema = z.object({
  term: z.string(),
  definition: z.string()
})

const MetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  source: z.string(),
  lastUpdated: z.string(),
  layers: z.array(z.string()),
  // Optional fields that may vary by template type
  tdd_principles: z.array(z.string()).optional(),
  ubiquitousLanguage: z.array(UbiquitousLanguageItemSchema).optional()
})

// ==================== Structure Schemas ====================

// Flexible structure that can handle different template layouts
const FolderStructureSchema = z.object({
  folders: z.array(z.string()).optional(),
  basePath: z.string().optional()
})

const StructureSchema = z.object({
  basePath: z.string(),
  // Support both layer-based and direct folder structure
  layers: z.record(z.string(), FolderStructureSchema).optional(),
  domain_layer: FolderStructureSchema.optional(),
  data_layer: FolderStructureSchema.optional(),
  test_structure: FolderStructureSchema.optional(),
  // For simpler templates
  folders: z.array(z.string()).optional()
})

// ==================== Architecture Schemas ====================

const DependencyRuleSchema = z.object({
  can_import_from: z.array(z.string()),
  cannot_import_from: z.array(z.string()),
  must_use_protocols: z.boolean().optional(),
  must_implement: z.array(z.string()).optional(),
  must_abstract: z.array(z.string()).optional()
})

const ArchitectureSchema = z.object({
  dependency_rules: z.record(z.string(), DependencyRuleSchema),
  principles: z.array(z.string())
})

// ==================== Rule Schemas (Flexible) ====================

const RuleSetSchema = z.object({
  must: z.array(z.string()),
  must_not: z.array(z.string())
})

// ==================== Step Schemas ====================

const ReferenceSchema = z.object({
  type: ReferenceTypeSchema,
  source: z.string(),
  query: z.string().optional(),
  url: z.string().optional(),
  tool: z.string().optional(),
  description: z.string()
})

// Base step with optional fields for flexibility
const BaseStepSchema = z.object({
  id: z.string(),
  type: StepTypeSchema,
  description: z.string(),
  status: StepStatusSchema.optional(),
  rlhf_score: z.number().nullable().optional(),
  execution_log: z.string().optional(),
  references: z.array(ReferenceSchema).optional()
})

// Branch Step
const BranchStepSchema = BaseStepSchema.extend({
  type: z.literal('branch'),
  action: z.object({
    branch_name: z.string()
  }),
  validation_script: z.string()
})

// Folder Step
const FolderStepSchema = BaseStepSchema.extend({
  type: z.literal('folder'),
  action: z.object({
    create_folders: z.union([
      z.object({
        basePath: z.string(),
        folders: z.array(z.string())
      }),
      z.array(z.string())
    ])
  }),
  validation_script: z.string()
})

// Create File Step
const CreateFileStepSchema = BaseStepSchema.extend({
  type: z.literal('create_file'),
  path: z.string(),
  template: z.string(),
  validation_script: z.string(),
  // Optional fields for specific templates
  input: z.array(z.object({
    name: z.string(),
    type: z.string()
  })).optional(),
  output: z.array(z.object({
    name: z.string(),
    type: z.string()
  })).optional(),
  mockInput: z.record(z.any()).optional(),
  mockOutput: z.record(z.any()).optional()
})

// Create Multiple Files Step
const CreateMultipleFilesStepSchema = BaseStepSchema.extend({
  type: z.literal('create_multiple_files'),
  files: z.array(z.object({
    path: z.string(),
    template: z.string()
  })),
  validation_script: z.string()
})

// Refactor File Step
const RefactorFileStepSchema = BaseStepSchema.extend({
  type: z.literal('refactor_file'),
  path: z.string(),
  template: z.string(),
  validation_script: z.string()
})

// Delete File Step
const DeleteFileStepSchema = BaseStepSchema.extend({
  type: z.literal('delete_file'),
  path: z.string(),
  validation_script: z.string()
})

// Pull Request Step
const PullRequestStepSchema = BaseStepSchema.extend({
  type: z.literal('pull_request'),
  action: z.object({
    target_branch: z.string(),
    source_branch: z.string(),
    title: z.string()
  }),
  validation_script: z.string()
})

// Union of all step types
const StepSchema = z.discriminatedUnion('type', [
  BranchStepSchema,
  FolderStepSchema,
  CreateFileStepSchema,
  CreateMultipleFilesStepSchema,
  RefactorFileStepSchema,
  DeleteFileStepSchema,
  PullRequestStepSchema
])

// ==================== Main Template Schema (Flexible) ====================

export const UnifiedTemplateSchema = z.object({
  // Required fields
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semantic versioning format'),
  metadata: MetadataSchema,
  steps: z.array(StepSchema).min(1),

  // Optional sections that may or may not exist in different templates
  structure: StructureSchema.optional(),
  architecture: ArchitectureSchema.optional(),

  // Various rule sections (all optional)
  domain_layer_rules: RuleSetSchema.optional(),
  data_layer_rules: z.any().optional(), // More complex in DATA templates
  use_case_rules: RuleSetSchema.optional(),
  error_rules: RuleSetSchema.optional(),
  test_helper_rules: RuleSetSchema.optional(),
  protocol_rules: RuleSetSchema.optional(),
  usecase_implementation_rules: RuleSetSchema.optional(),
  test_rules: RuleSetSchema.optional(),
  layer_rules: z.record(z.any()).optional(),

  // Protocol definitions (for data layer templates)
  required_protocols: z.array(z.object({
    category: z.string(),
    protocols: z.array(z.string())
  })).optional(),

  // Reusable components (optional)
  validation_scripts: z.record(z.string()).optional(),
  mock_templates: z.any().optional(),
  step_defaults: z.any().optional(),

  // Troubleshooting and guidelines (optional)
  troubleshooting: z.any().optional(),
  refactoring: z.any().optional(),
  recovery: z.record(z.string()).optional(),
  ai_guidelines: z.array(z.string()).optional(),

  // Evaluation (optional)
  evaluation: z.any().optional()
})

// Type inference
export type UnifiedTemplate = z.infer<typeof UnifiedTemplateSchema>

// ==================== Validation Functions ====================

/**
 * Validates any template YAML file
 * @param data The parsed YAML data
 * @returns Validation result with success status and errors if any
 */
export function validateTemplate(data: unknown): {
  success: boolean
  data?: UnifiedTemplate
  errors?: z.ZodError
  warnings?: string[]
} {
  const warnings: string[] = []

  try {
    const validatedData = UnifiedTemplateSchema.parse(data)

    // Add warnings for missing recommended fields
    if (!validatedData.metadata.ubiquitousLanguage) {
      warnings.push('Missing ubiquitous language definition (affects RLHF score)')
    }

    if (!validatedData.architecture) {
      warnings.push('Missing architecture section')
    }

    return {
      success: true,
      data: validatedData,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error
      }
    }
    throw error
  }
}

/**
 * Detects the type of template based on its content
 * @param template The validated template
 * @returns The detected template type
 */
export function detectTemplateType(template: UnifiedTemplate): 'domain' | 'data' | 'generic' | 'unknown' {
  // Check metadata layers
  if (template.metadata.layers.includes('domain') && template.metadata.layers.length === 1) {
    return 'domain'
  }

  if (template.metadata.layers.includes('data')) {
    return 'data'
  }

  // Check for TDD principles (data layer indicator)
  if (template.metadata.tdd_principles) {
    return 'data'
  }

  // Check source file name
  if (template.metadata.source.toLowerCase().includes('domain')) {
    return 'domain'
  }

  if (template.metadata.source.toLowerCase().includes('data')) {
    return 'data'
  }

  if (template.metadata.source.toLowerCase().includes('template_refactored')) {
    return 'generic'
  }

  return 'unknown'
}

/**
 * Validates that steps follow the correct workflow order
 * @param steps Array of steps from the template
 * @returns Validation result
 */
export function validateWorkflowOrder(steps: any[]): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  // First step should be branch
  if (steps.length > 0 && steps[0].type !== 'branch') {
    issues.push('First step should be a branch creation')
  }

  // Last step should typically be pull_request
  const lastStep = steps[steps.length - 1]
  if (lastStep && lastStep.type !== 'pull_request') {
    issues.push('Last step should typically be a pull request')
  }

  // Check for folder creation early in the workflow
  const folderStepIndex = steps.findIndex(s => s.type === 'folder')
  const firstFileStepIndex = steps.findIndex(s => s.type === 'create_file')

  if (firstFileStepIndex >= 0 && folderStepIndex > firstFileStepIndex) {
    issues.push('Folder structure should be created before files')
  }

  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Finds all placeholders in the template
 * @param template The template to analyze
 * @returns List of unique placeholders
 */
export function findPlaceholders(template: UnifiedTemplate): string[] {
  const placeholders = new Set<string>()
  const placeholderPattern = /__[A-Z_]+__/g

  // Check all string fields recursively
  function scanObject(obj: any) {
    if (typeof obj === 'string') {
      const matches = obj.match(placeholderPattern) || []
      matches.forEach(m => placeholders.add(m))
    } else if (Array.isArray(obj)) {
      obj.forEach(item => scanObject(item))
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value => scanObject(value))
    }
  }

  scanObject(template)

  return Array.from(placeholders).sort()
}

/**
 * Calculates a quality score for the template
 * @param template The validated template
 * @returns Score from 0 to 100
 */
export function calculateQualityScore(template: UnifiedTemplate): {
  score: number
  breakdown: Record<string, number>
} {
  const breakdown: Record<string, number> = {
    structure: 0,
    documentation: 0,
    workflow: 0,
    architecture: 0,
    guidelines: 0
  }

  // Structure score (20 points)
  if (template.structure) {
    breakdown.structure += 10
  }
  if (template.architecture) {
    breakdown.structure += 10
  }

  // Documentation score (20 points)
  if (template.metadata.ubiquitousLanguage && template.metadata.ubiquitousLanguage.length > 0) {
    breakdown.documentation += 10
  }
  if (template.ai_guidelines && template.ai_guidelines.length > 0) {
    breakdown.documentation += 10
  }

  // Workflow score (20 points)
  const workflowValidation = validateWorkflowOrder(template.steps)
  if (workflowValidation.valid) {
    breakdown.workflow += 20
  } else {
    breakdown.workflow += Math.max(0, 20 - (workflowValidation.issues.length * 5))
  }

  // Architecture score (20 points)
  if (template.architecture?.dependency_rules) {
    breakdown.architecture += 10
  }
  if (template.architecture?.principles) {
    breakdown.architecture += 10
  }

  // Guidelines score (20 points)
  if (template.troubleshooting) {
    breakdown.guidelines += 5
  }
  if (template.refactoring) {
    breakdown.guidelines += 5
  }
  if (template.recovery) {
    breakdown.guidelines += 5
  }
  if (template.evaluation) {
    breakdown.guidelines += 5
  }

  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

  return {
    score: totalScore,
    breakdown
  }
}