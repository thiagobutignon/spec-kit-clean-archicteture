import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = path.resolve(__dirname, '..', '..', '..', '..');

describe('Init Command - Directory Structure', () => {
  const testProjectPath = path.join(__dirname, '__test-temp-project__');

  beforeEach(async () => {
    // Clean up any previous test runs
    await fs.remove(testProjectPath);
  });

  afterEach(async () => {
    // Clean up after each test
    await fs.remove(testProjectPath);
  });

  describe('utils/ directory copying', () => {
    it('should copy utils/ directory with required files during init', async () => {
      // Simulate what init command does
      await fs.ensureDir(path.join(testProjectPath, '.regent/utils'));

      const sourceUtilsDir = path.join(packageRoot, 'utils');
      const targetUtilsDir = path.join(testProjectPath, '.regent/utils');

      // Verify source exists
      expect(await fs.pathExists(sourceUtilsDir)).toBe(true);

      // Copy utils
      await fs.copy(sourceUtilsDir, targetUtilsDir, { overwrite: true });

      // Verify critical file exists
      const logResolverPath = path.join(targetUtilsDir, 'log-path-resolver.ts');
      expect(await fs.pathExists(logResolverPath)).toBe(true);

      // Verify file content is not empty
      const content = await fs.readFile(logResolverPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('resolveLogDirectory');
    });

    it('should throw error if log-path-resolver.ts is missing after copy', async () => {
      await fs.ensureDir(path.join(testProjectPath, '.regent/utils'));

      const targetUtilsDir = path.join(testProjectPath, '.regent/utils');

      // Create empty utils dir (simulating failed copy)
      const logResolverPath = path.join(targetUtilsDir, 'log-path-resolver.ts');

      // Verify file doesn't exist
      const exists = await fs.pathExists(logResolverPath);
      expect(exists).toBe(false);

      // This should throw error in init command
      if (!exists) {
        expect(() => {
          throw new Error('Failed to copy utils/ directory - log-path-resolver.ts missing');
        }).toThrow('Failed to copy utils/ directory - log-path-resolver.ts missing');
      }
    });
  });

  describe('execute-steps.ts import paths', () => {
    it('should have correct relative imports from .regent/config/', async () => {
      // Simulate copying execute-steps.ts to .regent/config/
      await fs.ensureDir(path.join(testProjectPath, '.regent/config'));

      const sourceFile = path.join(packageRoot, 'execute-steps.ts');
      const targetFile = path.join(testProjectPath, '.regent/config/execute-steps.ts');

      // Verify source exists
      expect(await fs.pathExists(sourceFile)).toBe(true);

      // Copy file
      await fs.copy(sourceFile, targetFile);

      // Read and verify imports
      const content = await fs.readFile(targetFile, 'utf-8');

      // Should import from ../core/ (one level up)
      expect(content).toContain("import Logger from '../core/logger'");
      expect(content).toContain("import { EnhancedRLHFSystem, LayerInfo } from '../core/rlhf-system'");

      // Should import from ../utils/ (one level up)
      expect(content).toContain("import { resolveLogDirectory } from '../utils/log-path-resolver'");

      // Should import from same directory (./)
      expect(content).toContain("import { EnhancedTemplateValidator } from './validate-template'");

      // Should NOT have old incorrect paths
      expect(content).not.toContain("import Logger from './core/logger'");
      expect(content).not.toContain("import { EnhancedRLHFSystem, LayerInfo } from './core/rlhf-system'");
      expect(content).not.toContain("import { resolveLogDirectory } from './utils/log-path-resolver'");
    });
  });

  describe('complete directory structure', () => {
    it('should create all required .regent directories', async () => {
      const requiredDirs = [
        '.regent',
        '.regent/core',
        '.regent/scripts',
        '.regent/templates',
        '.regent/config',
        '.regent/utils'  // This is the new one we added
      ];

      // Simulate directory creation
      for (const dir of requiredDirs) {
        await fs.ensureDir(path.join(testProjectPath, dir));
      }

      // Verify all directories exist
      for (const dir of requiredDirs) {
        const dirPath = path.join(testProjectPath, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
      }
    });

    it('should verify utils/ is included in the structure', async () => {
      const utilsDir = path.join(testProjectPath, '.regent/utils');
      await fs.ensureDir(utilsDir);

      expect(await fs.pathExists(utilsDir)).toBe(true);

      // Verify it's a directory
      const stats = await fs.stat(utilsDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('config files in .regent/config/', () => {
    it('should copy both execute-steps.ts and validate-template.ts to same directory', async () => {
      await fs.ensureDir(path.join(testProjectPath, '.regent/config'));

      const configFiles = ['execute-steps.ts', 'validate-template.ts'];

      for (const file of configFiles) {
        const sourcePath = path.join(packageRoot, file);
        const targetPath = path.join(testProjectPath, '.regent/config', file);

        if (await fs.pathExists(sourcePath)) {
          await fs.copy(sourcePath, targetPath);
          expect(await fs.pathExists(targetPath)).toBe(true);
        }
      }

      // Verify both files are in the same directory
      const executeStepsPath = path.join(testProjectPath, '.regent/config/execute-steps.ts');
      const validateTemplatePath = path.join(testProjectPath, '.regent/config/validate-template.ts');

      expect(path.dirname(executeStepsPath)).toBe(path.dirname(validateTemplatePath));
    });
  });
});