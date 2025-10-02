export type Step = {
  id: string
  type: 'create_file' | 'refactor_file' | 'delete_file' | 'folder' | 'branch' | 'pull_request' | 'validation' | 'test'
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED'
  rlhf_score: number | null
  execution_log: string
  path?: string
  template?: string
  action?: {
    create_folders?: {
      basePath?: string
      folders?: string[]
    }
    branch_name?: string
    target_branch?: string
    source_branch?: string
    title?: string
  }
  validation_script?: string
}

export type ImplementationPlan = {
  steps: Step[]
  metadata?: {
    layer?: string
    project_type?: string
    architecture_style?: string
  }
  evaluation?: {
    final_rlhf_score?: number
    final_status?: string
    commit_hashes?: string[]
  }
}
