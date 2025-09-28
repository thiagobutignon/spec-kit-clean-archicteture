import { describe, it, expect, vi } from 'vitest';
import { SpecToRegentAdapter } from './spec-to-regent-adapter';

vi.mock('fs/promises');

describe('SpecToRegentAdapter', () => {
  it('should be defined', () => {
    const adapter = new SpecToRegentAdapter();
    expect(adapter).toBeDefined();
  });

  it('should have required methods', () => {
    const adapter = new SpecToRegentAdapter();
    expect(adapter.convertPlanToWorkflows).toBeDefined();
    expect(adapter.prepareForExecution).toBeDefined();
  });
});