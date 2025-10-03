/**
 * Regression tests for ESM import compatibility
 * Ensures fs-extra and zx imports work correctly in ESM context
 */

import { describe, it, expect } from 'vitest';

describe('ESM Import Compatibility', () => {
  describe('fs-extra imports', () => {
    it('should import fs-extra as default export', async () => {
      const fs = (await import('fs-extra')).default;
      expect(fs).toBeDefined();
      expect(typeof fs.readFile).toBe('function');
      expect(typeof fs.writeFile).toBe('function');
      expect(typeof fs.pathExists).toBe('function');
      expect(typeof fs.ensureDir).toBe('function');
    });

    it('should have working fs.readFile from fs-extra', async () => {
      const fs = (await import('fs-extra')).default;
      expect(typeof fs.readFile).toBe('function');
      // Verify it works by reading package.json
      const content = await fs.readFile('package.json', 'utf-8');
      expect(content).toBeDefined();
      expect(content.length).toBeGreaterThan(0);
    });

    it('should import specific functions from fs-extra', async () => {
      const { pathExists, ensureDir } = await import('fs-extra');
      expect(typeof pathExists).toBe('function');
      expect(typeof ensureDir).toBe('function');
    });
  });

  describe('zx imports', () => {
    it('should import $ from zx explicitly', async () => {
      const { $ } = await import('zx');
      expect($).toBeDefined();
      expect(typeof $).toBe('function');
    });

    it('should import chalk from zx', async () => {
      const { chalk } = await import('zx');
      expect(chalk).toBeDefined();
      expect(typeof chalk.red).toBe('function');
      expect(typeof chalk.green).toBe('function');
    });

    it('should import argv from zx', async () => {
      const { argv } = await import('zx');
      expect(argv).toBeDefined();
      expect(typeof argv).toBe('object');
    });
  });

  describe('namespace pollution prevention', () => {
    it('should not have zx/globals pollution in global scope', () => {
      // @ts-expect-error - testing that these don't exist in global scope
      expect(typeof globalThis.$).toBe('undefined');
      // @ts-expect-error - testing that these don't exist in global scope
      expect(typeof globalThis.chalk).toBe('undefined');
      // @ts-expect-error - testing that these don't exist in global scope
      expect(typeof globalThis.fs).toBe('undefined');
    });

    it('should not have fs from zx in global scope', () => {
      // Verify that fs is not polluted from zx/globals
      // @ts-expect-error - testing that this doesn't exist
      expect(typeof globalThis.fs).toBe('undefined');
    });
  });

  describe('file system operations', () => {
    it('should be able to check file existence with fs-extra', async () => {
      const fs = (await import('fs-extra')).default;
      const exists = await fs.pathExists('package.json');
      expect(typeof exists).toBe('boolean');
    });

    it('should be able to read package.json with fs-extra', async () => {
      const fs = (await import('fs-extra')).default;
      const content = await fs.readJson('package.json');
      expect(content).toBeDefined();
      expect(content.name).toBeDefined();
    });
  });
});
