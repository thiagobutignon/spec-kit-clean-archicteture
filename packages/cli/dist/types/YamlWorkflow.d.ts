/**
 * YAML Workflow Types
 *
 * Based on execute-steps.ts structure for compatibility
 * with the existing .regent execution system
 */
export interface YamlStep {
    id: string;
    type: 'create_file' | 'refactor_file' | 'delete_file' | 'folder' | 'branch' | 'pull_request' | 'validation' | 'test' | 'conditional_file';
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
    rlhf_score: number | null;
    execution_log: string;
    path?: string;
    template?: string;
    action?: {
        create_folders?: {
            basePath?: string;
            folders?: string[];
        };
        branch_name?: string;
        target_branch?: string;
        source_branch?: string;
        title?: string;
    };
    validation_script?: string;
}
export interface YamlMetadata {
    layer?: string;
    project_type?: string;
    architecture_style?: string;
    source?: string;
    task_id?: string;
    story_points?: number;
    dependencies?: string[];
}
export interface YamlWorkflow {
    metadata?: YamlMetadata;
    steps?: YamlStep[];
    domain_steps?: YamlStep[];
    data_steps?: YamlStep[];
    infra_steps?: YamlStep[];
    presentation_steps?: YamlStep[];
    main_steps?: YamlStep[];
    evaluation?: {
        final_rlhf_score?: number;
        final_status?: 'SUCCESS' | 'FAILED';
    };
}
export interface Task {
    id: string;
    title: string;
    description: string;
    layer: 'domain' | 'data' | 'infra' | 'presentation' | 'main';
    story_points: number;
    priority: 'Primary' | 'Secondary' | 'Integration';
    dependencies: string[];
    acceptance_criteria: string[];
    files_to_create?: string[];
    files_to_modify?: string[];
    test_files?: string[];
}
export interface SpecDocument {
    type: 'spec' | 'domain-model' | 'api-contract' | 'test-scenarios' | 'acceptance-criteria';
    content: string;
    path: string;
}
export interface GitFlowConfig {
    branch_prefix: string;
    target_branch: string;
    commit_convention: string;
    pr_template?: string;
}
//# sourceMappingURL=YamlWorkflow.d.ts.map