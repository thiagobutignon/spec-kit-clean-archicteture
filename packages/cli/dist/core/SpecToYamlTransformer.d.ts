/**
 * SpecToYamlTransformer
 *
 * Transforms spec-kit outputs (markdown documentation) into
 * .regent-compatible YAML workflows for execution
 *
 * Addresses Issue #77: Leverage spec-kit outputs for faster YAML generation
 */
import { YamlWorkflow, Task, GitFlowConfig } from '../types/YamlWorkflow.js';
export declare class SpecToYamlTransformer {
    private gitFlowConfig;
    constructor(gitFlowConfig?: Partial<GitFlowConfig>);
    /**
     * Transform a task from TASK-LIST markdown into a YAML workflow
     */
    transformTask(taskId: string, taskListPath?: string): Promise<YamlWorkflow>;
    /**
     * Transform task object directly to YAML workflow
     */
    transformTaskObject(task: Task): Promise<YamlWorkflow>;
    /**
     * Parse a specific task from the markdown task list
     */
    private parseTaskFromMarkdown;
    /**
     * Extract field value from markdown using regex
     */
    private extractField;
    /**
     * Create YAML workflow from task object
     */
    private createYamlWorkflow;
    /**
     * Create implementation steps for a task
     */
    private createStepsForTask;
    /**
     * Create branch step for GitFlow
     */
    private createBranchStep;
    /**
     * Create directory structure step
     */
    private createDirectoryStep;
    /**
     * Create implementation file steps
     */
    private createImplementationSteps;
    /**
     * Create test file steps
     */
    private createTestSteps;
    /**
     * Create validation step
     */
    private createValidationStep;
    /**
     * Create commit step
     */
    private createCommitStep;
    /**
     * Create pull request step
     */
    private createPullRequestStep;
    /**
     * Generate YAML string from workflow
     */
    saveWorkflowAsYaml(workflow: YamlWorkflow, outputPath: string): Promise<void>;
    /**
     * Helper methods
     */
    private slugify;
    /**
     * Sanitize input for shell commands to prevent injection
     */
    private sanitizeShellInput;
    /**
     * Sanitize branch name for git commands
     */
    private sanitizeBranchName;
    private getFeatureFromTask;
    private getDirectoriesForLayer;
    private getFilesForTask;
    private getTestFilesForTask;
    private getProjectEntityTemplate;
}
export default SpecToYamlTransformer;
//# sourceMappingURL=SpecToYamlTransformer.d.ts.map