import { describe, it, expect } from 'vitest';
import { SpecToYamlTransformer } from './SpecToYamlTransformer';

describe('SpecToYamlTransformer - GitFlow Verification', () => {
  it('should include GitFlow steps in generated workflow', async () => {
    const transformer = new SpecToYamlTransformer();
    const task = {
      id: 'T001',
      title: 'Test Task',
      description: 'Test Description',
      layer: 'domain' as const,
      story_points: 1,
      priority: 'Primary' as const,
      dependencies: [],
      acceptance_criteria: []
    };

    const workflow = await transformer.transformTaskObject(task);
    const steps = workflow.domain_steps || [];

    // Verify GitFlow steps exist
    const branchStep = steps.find(s => s.type === 'branch');
    const commitStep = steps.find(s => s.id?.includes('commit'));
    const prStep = steps.find(s => s.type === 'pull_request');

    expect(branchStep).toBeDefined();
    expect(branchStep?.action?.branch_name).toContain('feature/T001');

    expect(commitStep).toBeDefined();
    expect(commitStep?.validation_script).toContain('git commit');

    expect(prStep).toBeDefined();
    expect(prStep?.action?.source_branch).toContain('feature/T001');
    expect(prStep?.action?.target_branch).toBe('main');
  });
});