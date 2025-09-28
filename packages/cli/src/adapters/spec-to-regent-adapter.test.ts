import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpecToRegentAdapter } from './spec-to-regent-adapter';
import * as fs from 'fs/promises';

vi.mock('fs/promises');
vi.mock('../core/SpecToYamlTransformer.js', () => ({
  SpecToYamlTransformer: vi.fn().mockImplementation(() => ({
    transformTaskObject: vi.fn().mockResolvedValue({ domain_steps: [] }),
    saveWorkflowAsYaml: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('SpecToRegentAdapter', () => {
  let adapter: SpecToRegentAdapter;

  beforeEach(() => {
    adapter = new SpecToRegentAdapter();
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should have required methods', () => {
    expect(adapter.convertPlanToWorkflows).toBeDefined();
    expect(adapter.prepareForExecution).toBeDefined();
  });

  describe('convertPlanToWorkflows', () => {
    it('should throw error for invalid JSON', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');

      await expect(adapter.convertPlanToWorkflows('invalid.json'))
        .rejects.toThrow('Failed to convert plan to workflows');
    });

    it('should throw error for missing tasks array', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('{"notTasks": []}');

      await expect(adapter.convertPlanToWorkflows('no-tasks.json'))
        .rejects.toThrow('Plan must contain tasks array');
    });

    it('should process valid plan successfully', async () => {
      const validPlan = JSON.stringify({
        tasks: [
          { id: 'T001', title: 'Test Task', layer: 'domain' }
        ]
      });
      vi.mocked(fs.readFile).mockResolvedValue(validPlan);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);

      const result = await adapter.convertPlanToWorkflows('valid.json');

      expect(result).toHaveLength(1);
      expect(result[0]).toContain('T001-workflow.yaml');
    });
  });

  describe('prepareForExecution', () => {
    it('should throw error for invalid workflow format', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid: yaml');

      await expect(adapter.prepareForExecution('invalid.yaml'))
        .rejects.toThrow('Invalid workflow format');
    });

    it('should succeed for valid workflow', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('domain_steps: []');

      await expect(adapter.prepareForExecution('valid.yaml'))
        .resolves.not.toThrow();
    });
  });
});