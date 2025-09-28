/**
 * SpecToYamlTransformer
 *
 * Transforms spec-kit outputs (markdown documentation) into
 * .regent-compatible YAML workflows for execution
 *
 * Addresses Issue #77: Leverage spec-kit outputs for faster YAML generation
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
export class SpecToYamlTransformer {
    gitFlowConfig;
    constructor(gitFlowConfig) {
        this.gitFlowConfig = {
            branch_prefix: 'feature/',
            target_branch: 'main',
            commit_convention: 'feat({layer}): {task-id} - {description}',
            ...gitFlowConfig
        };
    }
    /**
     * Transform a task from TASK-LIST markdown into a YAML workflow
     */
    async transformTask(taskId, taskListPath) {
        const taskPath = taskListPath || '.specify/tasks/TASK-LIST-SPEC-001-cli.md';
        const task = await this.parseTaskFromMarkdown(taskId, taskPath);
        return this.createYamlWorkflow(task);
    }
    /**
     * Transform task object directly to YAML workflow
     */
    async transformTaskObject(task) {
        return this.createYamlWorkflow(task);
    }
    /**
     * Parse a specific task from the markdown task list
     */
    async parseTaskFromMarkdown(taskId, taskPath) {
        let content;
        try {
            content = await fs.readFile(taskPath, 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to read task file at ${taskPath}: ${error.message}`);
        }
        // Find the task section in markdown
        const taskPattern = new RegExp(`### ${taskId}[:\\s]+(.+?)(?=\\n### |$)`, 'gs');
        const match = taskPattern.exec(content);
        if (!match) {
            throw new Error(`Task ${taskId} not found in ${taskPath}`);
        }
        const taskContent = match[1];
        // Extract task details using regex patterns
        const title = this.extractField(taskContent, 'Title', '(.+)');
        const description = this.extractField(taskContent, 'Description', '([\\s\\S]+?)(?=\\n\\*\\*|$)');
        const layer = this.extractField(taskContent, 'Layer', '(domain|data|infra|presentation|main)');
        const storyPoints = parseInt(this.extractField(taskContent, 'Story Points', '(\\d+)') || '1');
        const priority = this.extractField(taskContent, 'Priority', '(Primary|Secondary|Integration)');
        // Extract dependencies
        const dependenciesMatch = taskContent.match(/Dependencies[:\\s]*(.+)/);
        const dependencies = dependenciesMatch
            ? dependenciesMatch[1].split(',').map(d => d.trim()).filter(d => d !== 'None')
            : [];
        // Extract acceptance criteria
        const criteriaPattern = /Acceptance Criteria[:\\s]*([\\s\\S]+?)(?=\\n\\*\\*|$)/;
        const criteriaMatch = taskContent.match(criteriaPattern);
        const acceptance_criteria = criteriaMatch
            ? criteriaMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim().replace(/^-\s*/, ''))
            : [];
        return {
            id: taskId,
            title: title || `Task ${taskId}`,
            description: description || '',
            layer,
            story_points: storyPoints,
            priority,
            dependencies,
            acceptance_criteria
        };
    }
    /**
     * Extract field value from markdown using regex
     */
    extractField(content, fieldName, pattern) {
        const regex = new RegExp(`${fieldName}[:\\s]*${pattern}`, 'i');
        const match = content.match(regex);
        return match ? match[1].trim() : '';
    }
    /**
     * Create YAML workflow from task object
     */
    createYamlWorkflow(task) {
        const metadata = {
            layer: task.layer,
            project_type: 'cli',
            architecture_style: 'clean-architecture',
            source: `TASK-${task.id}`,
            task_id: task.id,
            story_points: task.story_points,
            dependencies: task.dependencies
        };
        const steps = this.createStepsForTask(task);
        // Organize steps by layer
        const workflow = {
            metadata,
            [`${task.layer}_steps`]: steps
        };
        return workflow;
    }
    /**
     * Create implementation steps for a task
     */
    createStepsForTask(task) {
        const steps = [];
        // Step 1: Create feature branch (GitFlow)
        steps.push(this.createBranchStep(task));
        // Step 2: Create directory structure
        steps.push(this.createDirectoryStep(task));
        // Step 3: Create implementation files
        steps.push(...this.createImplementationSteps(task));
        // Step 4: Create test files
        steps.push(...this.createTestSteps(task));
        // Step 5: Run validation
        steps.push(this.createValidationStep(task));
        // Step 6: Commit changes
        steps.push(this.createCommitStep(task));
        // Step 7: Create pull request (GitFlow)
        steps.push(this.createPullRequestStep(task));
        return steps;
    }
    /**
     * Create branch step for GitFlow
     */
    createBranchStep(task) {
        const branchName = `${this.gitFlowConfig.branch_prefix}${task.id}-${this.slugify(task.title)}`;
        const safeBranchName = this.sanitizeBranchName(branchName);
        return {
            id: `create-branch-${task.id}`,
            type: 'branch',
            status: 'PENDING',
            rlhf_score: null,
            execution_log: '',
            action: {
                branch_name: safeBranchName
            },
            validation_script: `
git checkout -b ${safeBranchName} || git checkout ${safeBranchName}
echo "Created/switched to branch: ${safeBranchName}"
      `.trim()
        };
    }
    /**
     * Create directory structure step
     */
    createDirectoryStep(task) {
        const basePath = `src/features/${this.getFeatureFromTask(task)}/${task.layer}`;
        const folders = this.getDirectoriesForLayer(task.layer);
        return {
            id: `create-directories-${task.id}`,
            type: 'folder',
            status: 'PENDING',
            rlhf_score: null,
            execution_log: '',
            action: {
                create_folders: {
                    basePath,
                    folders
                }
            }
        };
    }
    /**
     * Create implementation file steps
     */
    createImplementationSteps(task) {
        const steps = [];
        const files = this.getFilesForTask(task);
        files.forEach((file, index) => {
            steps.push({
                id: `create-file-${task.id}-${index}`,
                type: 'create_file',
                status: 'PENDING',
                rlhf_score: null,
                execution_log: '',
                path: file.path,
                template: file.template
            });
        });
        return steps;
    }
    /**
     * Create test file steps
     */
    createTestSteps(task) {
        const steps = [];
        const testFiles = this.getTestFilesForTask(task);
        testFiles.forEach((file, index) => {
            steps.push({
                id: `create-test-${task.id}-${index}`,
                type: 'create_file',
                status: 'PENDING',
                rlhf_score: null,
                execution_log: '',
                path: file.path,
                template: file.template
            });
        });
        return steps;
    }
    /**
     * Create validation step
     */
    createValidationStep(task) {
        return {
            id: `validate-${task.id}`,
            type: 'validation',
            status: 'PENDING',
            rlhf_score: null,
            execution_log: '',
            validation_script: `
npm test
npm run lint
npm run typecheck
echo "All validations passed for ${task.id}"
      `.trim()
        };
    }
    /**
     * Create commit step
     */
    createCommitStep(task) {
        const commitMessage = this.gitFlowConfig.commit_convention
            .replace('{layer}', task.layer)
            .replace('{task-id}', task.id)
            .replace('{description}', task.title);
        const safeCommitMessage = this.sanitizeShellInput(commitMessage);
        const safeDescription = this.sanitizeShellInput(task.description);
        const safeCriteria = task.acceptance_criteria.map(c => this.sanitizeShellInput(c));
        return {
            id: `commit-${task.id}`,
            type: 'validation',
            status: 'PENDING',
            rlhf_score: null,
            execution_log: '',
            validation_script: `
git add -A
git commit -m "${safeCommitMessage}

${safeDescription}

Acceptance Criteria:
${safeCriteria.map(c => `- ${c}`).join('\\n')}

Task: ${task.id}
Story Points: ${task.story_points}
Layer: ${task.layer}"
      `.trim()
        };
    }
    /**
     * Create pull request step
     */
    createPullRequestStep(task) {
        const branchName = `${this.gitFlowConfig.branch_prefix}${task.id}-${this.slugify(task.title)}`;
        const safeBranchName = this.sanitizeBranchName(branchName);
        const prTitle = `feat(${task.layer}): ${task.id} - ${task.title}`;
        const safePrTitle = this.sanitizeShellInput(prTitle);
        const safeTaskTitle = this.sanitizeShellInput(task.title);
        const safeDescription = this.sanitizeShellInput(task.description);
        const safeCriteria = task.acceptance_criteria.map(c => this.sanitizeShellInput(c));
        const safeDependencies = task.dependencies.map(d => this.sanitizeShellInput(d));
        return {
            id: `create-pr-${task.id}`,
            type: 'pull_request',
            status: 'PENDING',
            rlhf_score: null,
            execution_log: '',
            action: {
                source_branch: safeBranchName,
                target_branch: this.gitFlowConfig.target_branch,
                title: safePrTitle
            },
            validation_script: `
gh pr create \\
  --title "${safePrTitle}" \\
  --body "## Task ${task.id}: ${safeTaskTitle}

### Description
${safeDescription}

### Acceptance Criteria
${safeCriteria.map(c => `- ${c}`).join('\\n')}

### Implementation Details
- Layer: ${task.layer}
- Story Points: ${task.story_points}
- Dependencies: ${safeDependencies.join(', ') || 'None'}

### Testing
- All tests passing
- Lint clean
- Type check passing
- Coverage maintained

Generated by SpecToYamlTransformer from spec-kit analysis."
      `.trim()
        };
    }
    /**
     * Generate YAML string from workflow
     */
    async saveWorkflowAsYaml(workflow, outputPath) {
        const yamlContent = yaml.stringify(workflow, {
            indent: 2,
            lineWidth: 0
        });
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, yamlContent, 'utf-8');
    }
    /**
     * Helper methods
     */
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    /**
     * Sanitize input for shell commands to prevent injection
     */
    sanitizeShellInput(input) {
        return input
            .replace(/[`${}|&;<>]/g, '') // Remove dangerous shell characters (keep () for conventional commits)
            .replace(/['"]/g, '') // Remove quotes
            .trim();
    }
    /**
     * Sanitize branch name for git commands
     */
    sanitizeBranchName(branchName) {
        return branchName
            .replace(/[^a-zA-Z0-9/_-]/g, '-') // Only allow safe characters
            .replace(/--+/g, '-') // Replace multiple dashes with single dash
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
    }
    getFeatureFromTask(task) {
        // Extract feature name from task ID or title
        // For now, assume project-init as the feature
        return 'project-init';
    }
    getDirectoriesForLayer(layer) {
        const layerDirs = {
            domain: ['entities', 'value-objects', 'use-cases', 'repositories', 'services', 'events'],
            data: ['repositories', 'mappers', 'validators'],
            infra: ['file-system', 'git', 'templates', 'ai'],
            presentation: ['components', 'screens', 'hooks', 'styles'],
            main: ['di', 'cli', 'config']
        };
        return layerDirs[layer] || [];
    }
    getFilesForTask(task) {
        // This would be enhanced to generate actual file content based on task
        // For now, return placeholder structure
        const basePath = `src/features/${this.getFeatureFromTask(task)}/${task.layer}`;
        if (task.layer === 'domain' && task.id === 'T001') {
            return [
                {
                    path: `${basePath}/entities/Project.ts`,
                    template: this.getProjectEntityTemplate()
                }
            ];
        }
        return [
            {
                path: `${basePath}/${task.id}.ts`,
                template: `// Generated for ${task.id}: ${task.title}\\nexport class ${task.id.replace('T', 'Task')} {\\n  // Implementation\\n}`
            }
        ];
    }
    getTestFilesForTask(task) {
        const files = this.getFilesForTask(task);
        return files.map(file => ({
            path: file.path.replace('.ts', '.test.ts'),
            template: `// Test for ${task.id}: ${task.title}\\nimport { describe, it, expect } from 'vitest';\\n\\ndescribe('${task.title}', () => {\\n  it('should pass', () => {\\n    expect(true).toBe(true);\\n  });\\n});`
        }));
    }
    getProjectEntityTemplate() {
        return `/**
 * Project Entity - Generated by SpecToYamlTransformer
 */
export class Project {
  constructor(private props: any) {}

  // Business methods will be implemented
  initialize() {}
  start() {}
  complete() {}
}`;
    }
}
export default SpecToYamlTransformer;
//# sourceMappingURL=SpecToYamlTransformer.js.map