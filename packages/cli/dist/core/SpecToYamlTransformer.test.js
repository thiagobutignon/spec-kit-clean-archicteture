/**
 * Tests for SpecToYamlTransformer
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SpecToYamlTransformer } from './SpecToYamlTransformer.js';
describe('SpecToYamlTransformer', () => {
    let transformer;
    beforeEach(() => {
        transformer = new SpecToYamlTransformer();
    });
    describe('transformTaskObject', () => {
        it('should transform a task object into YAML workflow', async () => {
            const task = {
                id: 'T001',
                title: 'Create Project Entity',
                description: 'Implement the core Project entity for the domain layer',
                layer: 'domain',
                story_points: 3,
                priority: 'Primary',
                dependencies: [],
                acceptance_criteria: [
                    'Entity has all required properties',
                    'Business methods implemented',
                    'Invariants enforced',
                    'Zero external dependencies'
                ]
            };
            const workflow = await transformer.transformTaskObject(task);
            // Check metadata
            expect(workflow.metadata).toBeDefined();
            expect(workflow.metadata?.layer).toBe('domain');
            expect(workflow.metadata?.task_id).toBe('T001');
            expect(workflow.metadata?.story_points).toBe(3);
            // Check steps
            expect(workflow.domain_steps).toBeDefined();
            expect(workflow.domain_steps?.length).toBeGreaterThan(0);
            // Verify GitFlow steps are included
            const steps = workflow.domain_steps;
            const branchStep = steps.find(s => s.type === 'branch');
            const prStep = steps.find(s => s.type === 'pull_request');
            expect(branchStep).toBeDefined();
            expect(branchStep?.action?.branch_name).toContain('T001');
            expect(prStep).toBeDefined();
            expect(prStep?.action?.source_branch).toContain('T001');
            expect(prStep?.action?.target_branch).toBe('main');
        });
        it('should create appropriate steps for domain layer task', async () => {
            const task = {
                id: 'T001',
                title: 'Create Project Entity',
                description: 'Domain entity implementation',
                layer: 'domain',
                story_points: 3,
                priority: 'Primary',
                dependencies: [],
                acceptance_criteria: ['Entity created']
            };
            const workflow = await transformer.transformTaskObject(task);
            const steps = workflow.domain_steps;
            // Should have GitFlow steps
            expect(steps.some(s => s.type === 'branch')).toBe(true);
            expect(steps.some(s => s.type === 'pull_request')).toBe(true);
            // Should have implementation steps
            expect(steps.some(s => s.type === 'create_file')).toBe(true);
            expect(steps.some(s => s.type === 'folder')).toBe(true);
            // Should have validation steps
            expect(steps.some(s => s.type === 'validation')).toBe(true);
        });
        it('should handle different layers correctly', async () => {
            const layers = ['domain', 'data', 'infra', 'presentation', 'main'];
            for (const layer of layers) {
                const task = {
                    id: `T-${layer}`,
                    title: `Test ${layer} layer`,
                    description: `Test for ${layer}`,
                    layer,
                    story_points: 1,
                    priority: 'Primary',
                    dependencies: [],
                    acceptance_criteria: ['Test passes']
                };
                const workflow = await transformer.transformTaskObject(task);
                expect(workflow.metadata?.layer).toBe(layer);
                expect(workflow[`${layer}_steps`]).toBeDefined();
            }
        });
        it('should include commit message with proper format', async () => {
            const task = {
                id: 'T001',
                title: 'Create Project Entity',
                description: 'Domain entity implementation',
                layer: 'domain',
                story_points: 3,
                priority: 'Primary',
                dependencies: [],
                acceptance_criteria: ['Entity created']
            };
            const workflow = await transformer.transformTaskObject(task);
            const commitStep = workflow.domain_steps?.find(s => s.type === 'validation' && s.validation_script?.includes('git commit'));
            expect(commitStep).toBeDefined();
            expect(commitStep?.validation_script).toContain('feat(domain): T001 - Create Project Entity');
            expect(commitStep?.validation_script).toContain('Task: T001');
            expect(commitStep?.validation_script).toContain('Story Points: 3');
        });
        it('should include PR creation with proper body', async () => {
            const task = {
                id: 'T001',
                title: 'Create Project Entity',
                description: 'Domain entity implementation',
                layer: 'domain',
                story_points: 3,
                priority: 'Primary',
                dependencies: ['T000'],
                acceptance_criteria: ['Entity created', 'Tests pass']
            };
            const workflow = await transformer.transformTaskObject(task);
            const prStep = workflow.domain_steps?.find(s => s.type === 'pull_request');
            expect(prStep).toBeDefined();
            expect(prStep?.validation_script).toContain('gh pr create');
            expect(prStep?.validation_script).toContain('## Task T001');
            expect(prStep?.validation_script).toContain('Dependencies: T000');
            expect(prStep?.validation_script).toContain('- Entity created');
            expect(prStep?.validation_script).toContain('- Tests pass');
        });
        it('should handle tasks with no dependencies', async () => {
            const task = {
                id: 'T001',
                title: 'Create Project Entity',
                description: 'Domain entity implementation',
                layer: 'domain',
                story_points: 3,
                priority: 'Primary',
                dependencies: [],
                acceptance_criteria: ['Entity created']
            };
            const workflow = await transformer.transformTaskObject(task);
            const prStep = workflow.domain_steps?.find(s => s.type === 'pull_request');
            expect(prStep?.validation_script).toContain('Dependencies: None');
        });
        it('should create proper directory structure for each layer', async () => {
            const task = {
                id: 'T001',
                title: 'Create Project Entity',
                description: 'Domain entity implementation',
                layer: 'domain',
                story_points: 3,
                priority: 'Primary',
                dependencies: [],
                acceptance_criteria: ['Entity created']
            };
            const workflow = await transformer.transformTaskObject(task);
            const folderStep = workflow.domain_steps?.find(s => s.type === 'folder');
            expect(folderStep).toBeDefined();
            expect(folderStep?.action?.create_folders?.basePath).toContain('domain');
            expect(folderStep?.action?.create_folders?.folders).toContain('entities');
            expect(folderStep?.action?.create_folders?.folders).toContain('value-objects');
            expect(folderStep?.action?.create_folders?.folders).toContain('use-cases');
        });
        it('should include validation step with proper commands', async () => {
            const task = {
                id: 'T001',
                title: 'Create Project Entity',
                description: 'Domain entity implementation',
                layer: 'domain',
                story_points: 3,
                priority: 'Primary',
                dependencies: [],
                acceptance_criteria: ['Entity created']
            };
            const workflow = await transformer.transformTaskObject(task);
            const validationStep = workflow.domain_steps?.find(s => s.type === 'validation' && s.validation_script?.includes('npm test'));
            expect(validationStep).toBeDefined();
            expect(validationStep?.validation_script).toContain('npm test');
            expect(validationStep?.validation_script).toContain('npm run lint');
            expect(validationStep?.validation_script).toContain('npm run typecheck');
        });
    });
    describe('GitFlow configuration', () => {
        it('should use custom GitFlow configuration', async () => {
            const customTransformer = new SpecToYamlTransformer({
                branch_prefix: 'task/',
                target_branch: 'develop',
                commit_convention: 'task({layer}): {task-id} {description}'
            });
            const task = {
                id: 'T001',
                title: 'Test Task',
                description: 'Test description',
                layer: 'domain',
                story_points: 1,
                priority: 'Primary',
                dependencies: [],
                acceptance_criteria: ['Test passes']
            };
            const workflow = await customTransformer.transformTaskObject(task);
            const branchStep = workflow.domain_steps?.find(s => s.type === 'branch');
            const prStep = workflow.domain_steps?.find(s => s.type === 'pull_request');
            expect(branchStep?.action?.branch_name).toContain('task/');
            expect(prStep?.action?.target_branch).toBe('develop');
        });
    });
    describe('step validation', () => {
        it('should create steps with proper IDs', async () => {
            const task = {
                id: 'T001',
                title: 'Test Task',
                description: 'Test description',
                layer: 'domain',
                story_points: 1,
                priority: 'Primary',
                dependencies: [],
                acceptance_criteria: ['Test passes']
            };
            const workflow = await transformer.transformTaskObject(task);
            const steps = workflow.domain_steps;
            // All steps should have unique IDs
            const stepIds = steps.map(s => s.id);
            const uniqueIds = new Set(stepIds);
            expect(uniqueIds.size).toBe(stepIds.length);
            // All steps should include task ID in their ID
            steps.forEach(step => {
                expect(step.id).toContain('T001');
            });
        });
        it('should initialize all steps with PENDING status', async () => {
            const task = {
                id: 'T001',
                title: 'Test Task',
                description: 'Test description',
                layer: 'domain',
                story_points: 1,
                priority: 'Primary',
                dependencies: [],
                acceptance_criteria: ['Test passes']
            };
            const workflow = await transformer.transformTaskObject(task);
            const steps = workflow.domain_steps;
            steps.forEach(step => {
                expect(step.status).toBe('PENDING');
                expect(step.rlhf_score).toBe(null);
                expect(step.execution_log).toBe('');
            });
        });
    });
});
//# sourceMappingURL=SpecToYamlTransformer.test.js.map