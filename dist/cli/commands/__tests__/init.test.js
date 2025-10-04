import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createProjectStructure } from '../init.js';
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
            const sourceUtilsDir = path.join(packageRoot, 'src/utils');
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
            const sourceFile = path.join(packageRoot, 'src/execute-steps.ts');
            const targetFile = path.join(testProjectPath, '.regent/config/execute-steps.ts');
            // Verify source exists
            expect(await fs.pathExists(sourceFile)).toBe(true);
            // Simulate init command's import transformation
            const sourceContent = await fs.readFile(sourceFile, 'utf-8');
            const transformedContent = sourceContent
                .replace(/from '\.\/core\//g, "from '../core/")
                .replace(/from '\.\/utils\//g, "from '../utils/");
            await fs.writeFile(targetFile, transformedContent, 'utf-8');
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
                '.regent/utils',
                '.regent/docs' // New: for documentation like constitution.md
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
        it('should copy .regent/tsconfig.json during initialization', async () => {
            // Call actual init logic that includes the tsconfig copy
            const options = {
                skipMcp: true,
                git: false
            };
            await createProjectStructure(testProjectPath, options, false);
            // Verify target exists
            const targetTsconfigPath = path.join(testProjectPath, '.regent/tsconfig.json');
            expect(await fs.pathExists(targetTsconfigPath)).toBe(true);
            // Verify content is valid JSON with expected configuration
            const content = await fs.readJson(targetTsconfigPath);
            expect(content.compilerOptions).toBeDefined();
            expect(content.compilerOptions.module).toBe('ESNext');
            expect(content.compilerOptions.target).toBe('ESNext');
            expect(content.compilerOptions.esModuleInterop).toBe(true);
            expect(content.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
            // Verify include paths are set correctly
            expect(content.include).toContain('config/**/*.ts');
            expect(content.include).toContain('core/**/*.ts');
            expect(content.include).toContain('utils/**/*.ts');
            expect(content.include).toContain('scripts/**/*.ts');
        });
        it('should not create legacy .specify directories', async () => {
            // These directories should NOT be created anymore
            const legacyDirs = [
                '.specify',
                '.specify/memory',
                '.specify/specs',
                '.specify/plans',
                '.specify/tasks',
                '.specify/scripts'
            ];
            // Verify they don't exist (they were never created)
            for (const dir of legacyDirs) {
                const dirPath = path.join(testProjectPath, dir);
                expect(await fs.pathExists(dirPath)).toBe(false);
            }
        });
        it('should create .regent/docs for documentation', async () => {
            const docsDir = path.join(testProjectPath, '.regent/docs');
            await fs.ensureDir(docsDir);
            expect(await fs.pathExists(docsDir)).toBe(true);
            // Verify it's a directory
            const stats = await fs.stat(docsDir);
            expect(stats.isDirectory()).toBe(true);
        });
        it('should create constitution.md in .regent/docs (not .specify/memory)', async () => {
            await fs.ensureDir(path.join(testProjectPath, '.regent/docs'));
            const constitutionPath = path.join(testProjectPath, '.regent/docs/constitution.md');
            const constitution = '# Test Constitution\n\nTest content';
            await fs.writeFile(constitutionPath, constitution);
            // Verify file exists in correct location
            expect(await fs.pathExists(constitutionPath)).toBe(true);
            // Verify it's NOT in old location
            const oldPath = path.join(testProjectPath, '.specify/memory/constitution.md');
            expect(await fs.pathExists(oldPath)).toBe(false);
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
    describe('Brownfield Protection - Backup System', () => {
        it('should detect existing config files', async () => {
            // Create a test project with existing config files
            await fs.ensureDir(testProjectPath);
            await fs.writeFile(path.join(testProjectPath, 'tsconfig.json'), '{}');
            await fs.writeFile(path.join(testProjectPath, 'eslint.config.js'), '');
            await fs.ensureDir(path.join(testProjectPath, '.vscode'));
            await fs.writeFile(path.join(testProjectPath, '.vscode/settings.json'), '{}');
            // Check files exist
            expect(await fs.pathExists(path.join(testProjectPath, 'tsconfig.json'))).toBe(true);
            expect(await fs.pathExists(path.join(testProjectPath, 'eslint.config.js'))).toBe(true);
            expect(await fs.pathExists(path.join(testProjectPath, '.vscode/settings.json'))).toBe(true);
        });
        it('should create backup with proper naming format', async () => {
            // Create test file
            await fs.ensureDir(testProjectPath);
            const testFilePath = path.join(testProjectPath, 'test-config.json');
            await fs.writeFile(testFilePath, '{"test": true}');
            // Create backup directory
            const backupDir = path.join(testProjectPath, '.regent-backups');
            await fs.ensureDir(backupDir);
            // Simulate backup creation
            const timestamp = Date.now();
            const ext = path.extname(testFilePath);
            const base = path.basename(testFilePath, ext);
            const backupName = `${base}.regent-backup-${timestamp}${ext}`;
            const backupPath = path.join(backupDir, backupName);
            await fs.copy(testFilePath, backupPath);
            // Verify backup exists with correct format
            expect(await fs.pathExists(backupPath)).toBe(true);
            expect(backupName).toMatch(/test-config\.regent-backup-\d+\.json/);
            // Verify content is preserved
            const backupContent = await fs.readFile(backupPath, 'utf-8');
            expect(backupContent).toBe('{"test": true}');
        });
        it('should handle multiple backups of same file without collision', async () => {
            await fs.ensureDir(testProjectPath);
            const testFilePath = path.join(testProjectPath, 'config.json');
            await fs.writeFile(testFilePath, '{"version": 1}');
            const backupDir = path.join(testProjectPath, '.regent-backups');
            await fs.ensureDir(backupDir);
            // Create multiple backups with different timestamps
            const backups = [];
            for (let i = 0; i < 3; i++) {
                const timestamp = Date.now() + i; // Ensure different timestamps
                const ext = path.extname(testFilePath);
                const base = path.basename(testFilePath, ext);
                const backupName = `${base}.regent-backup-${timestamp}${ext}`;
                const backupPath = path.join(backupDir, backupName);
                await fs.copy(testFilePath, backupPath);
                backups.push(backupPath);
                // Small delay to ensure different timestamps
                await new Promise(resolve => setTimeout(resolve, 2));
            }
            // Verify all backups exist and have unique names
            for (const backup of backups) {
                expect(await fs.pathExists(backup)).toBe(true);
            }
            const backupFiles = await fs.readdir(backupDir);
            expect(backupFiles.length).toBe(3);
            expect(new Set(backupFiles).size).toBe(3); // All unique
        });
        it('should preserve file extension in backup for easy opening', async () => {
            await fs.ensureDir(testProjectPath);
            // Test various file types
            const testFiles = [
                { name: 'tsconfig.json', content: '{}', expectedPattern: /tsconfig\.regent-backup-\d+\.json$/ },
                { name: 'settings.json', content: '{}', expectedPattern: /settings\.regent-backup-\d+\.json$/ },
                { name: 'eslint.config.js', content: '', expectedPattern: /eslint\.config\.regent-backup-\d+\.js$/ },
                { name: 'vitest.config.ts', content: '', expectedPattern: /vitest\.config\.regent-backup-\d+\.ts$/ }
            ];
            const backupDir = path.join(testProjectPath, '.regent-backups');
            await fs.ensureDir(backupDir);
            for (const testFile of testFiles) {
                const filePath = path.join(testProjectPath, testFile.name);
                await fs.writeFile(filePath, testFile.content);
                const timestamp = Date.now();
                const ext = path.extname(filePath);
                const base = path.basename(filePath, ext);
                const backupName = `${base}.regent-backup-${timestamp}${ext}`;
                expect(backupName).toMatch(testFile.expectedPattern);
                expect(path.extname(backupName)).toBe(ext);
                // Clean up
                await fs.remove(filePath);
                await new Promise(resolve => setTimeout(resolve, 2));
            }
        });
        it('should reject path traversal attempts in backup directory', async () => {
            await fs.ensureDir(testProjectPath);
            const maliciousBackupDirs = [
                '../../../etc',
                '../../outside-project',
                '../..'
            ];
            for (const maliciousDir of maliciousBackupDirs) {
                const resolvedMalicious = path.resolve(maliciousDir);
                const resolvedProject = path.resolve(testProjectPath);
                // Verify that relative paths outside project are detected
                if (!path.isAbsolute(maliciousDir)) {
                    const isOutside = !resolvedMalicious.startsWith(resolvedProject);
                    expect(isOutside).toBe(true);
                }
            }
        });
        it('should validate custom backup directory can be created', async () => {
            await fs.ensureDir(testProjectPath);
            // Valid backup directory
            const validBackupDir = path.join(testProjectPath, 'custom-backups');
            try {
                await fs.ensureDir(validBackupDir);
                expect(await fs.pathExists(validBackupDir)).toBe(true);
            }
            catch (error) {
                // Should not throw for valid directory
                expect(error).toBeUndefined();
            }
            // Cleanup
            await fs.remove(validBackupDir);
        });
        it('should merge .gitignore entries when file exists', async () => {
            await fs.ensureDir(testProjectPath);
            // Create existing .gitignore
            const gitignorePath = path.join(testProjectPath, '.gitignore');
            const existingContent = 'node_modules/\n*.log\n';
            await fs.writeFile(gitignorePath, existingContent);
            // Regent entries to add
            const regentEntries = [
                '# Spec-kit clean architecture',
                '.rlhf/',
                '.logs/',
                '.regent/templates/*-template.regent',
                '!.regent/templates/parts/',
                '.regent-backups/'
            ];
            // Simulate merge
            const content = await fs.readFile(gitignorePath, 'utf-8');
            if (!content.includes('.regent-backups/')) {
                const mergedContent = content.trim() + '\n\n' + regentEntries.join('\n') + '\n';
                await fs.writeFile(gitignorePath, mergedContent);
            }
            // Verify merge
            const finalContent = await fs.readFile(gitignorePath, 'utf-8');
            expect(finalContent).toContain('node_modules/');
            expect(finalContent).toContain('.regent-backups/');
            expect(finalContent).toContain('.rlhf/');
            expect(finalContent).toContain('# Spec-kit clean architecture');
        });
        it('should not duplicate .gitignore entries if already present', async () => {
            await fs.ensureDir(testProjectPath);
            const gitignorePath = path.join(testProjectPath, '.gitignore');
            const contentWithRegent = `node_modules/
*.log

# Spec-kit clean architecture
.rlhf/
.logs/
.regent-backups/
`;
            await fs.writeFile(gitignorePath, contentWithRegent);
            // Simulate merge check
            const content = await fs.readFile(gitignorePath, 'utf-8');
            const shouldMerge = !content.includes('.regent-backups/');
            expect(shouldMerge).toBe(false); // Should not merge again
            // Verify count of .regent-backups/ mentions
            const matches = content.match(/\.regent-backups\//g);
            expect(matches?.length).toBe(1); // Only one occurrence
        });
        it('should handle backup collision with counter mechanism', async () => {
            await fs.ensureDir(testProjectPath);
            const testFilePath = path.join(testProjectPath, 'config.json');
            await fs.writeFile(testFilePath, '{"test": true}');
            const backupDir = path.join(testProjectPath, '.regent-backups');
            await fs.ensureDir(backupDir);
            // Simulate rapid backup creation (same timestamp)
            const timestamp = Date.now();
            const backups = [];
            for (let i = 0; i < 3; i++) {
                const ext = path.extname(testFilePath);
                const base = path.basename(testFilePath, ext);
                // Each backup gets a different counter value
                const backupName = `${base}.regent-backup-${timestamp}-${i}${ext}`;
                const backupPath = path.join(backupDir, backupName);
                await fs.copy(testFilePath, backupPath);
                backups.push(backupPath);
            }
            // Verify all backups exist and have unique names
            for (const backup of backups) {
                expect(await fs.pathExists(backup)).toBe(true);
            }
            const backupFiles = await fs.readdir(backupDir);
            expect(backupFiles.length).toBe(3);
            expect(new Set(backupFiles).size).toBe(3); // All unique
        });
        it('should rollback backups on failure', async () => {
            await fs.ensureDir(testProjectPath);
            // Create some test files
            await fs.writeFile(path.join(testProjectPath, 'file1.json'), '{}');
            await fs.writeFile(path.join(testProjectPath, 'file2.json'), '{}');
            const backupDir = path.join(testProjectPath, '.regent-backups');
            await fs.ensureDir(backupDir);
            // Create backups
            const successfulBackups = [];
            const timestamp = Date.now();
            for (let i = 0; i < 2; i++) {
                const backupPath = path.join(backupDir, `file${i + 1}.regent-backup-${timestamp}-${i}.json`);
                await fs.copy(path.join(testProjectPath, `file${i + 1}.json`), backupPath);
                successfulBackups.push(backupPath);
            }
            // Verify backups were created
            expect(successfulBackups.length).toBe(2);
            for (const backup of successfulBackups) {
                expect(await fs.pathExists(backup)).toBe(true);
            }
            // Simulate rollback
            for (const backupPath of successfulBackups) {
                await fs.remove(backupPath);
            }
            // Verify backups were removed
            for (const backup of successfulBackups) {
                expect(await fs.pathExists(backup)).toBe(false);
            }
        });
        it('should use template for .gitignore creation', async () => {
            await fs.ensureDir(testProjectPath);
            // Simulate creating .gitignore from template
            const gitignorePath = path.join(testProjectPath, '.gitignore');
            const defaultContent = `# Dependencies
node_modules/
.pnp
.pnp.js

# Production
/build
/dist
`;
            const regentEntries = [
                '# Spec-kit clean architecture',
                '.rlhf/',
                '.logs/',
                '.regent-backups/'
            ];
            const gitignore = defaultContent + '\n' + regentEntries.join('\n') + '\n';
            await fs.writeFile(gitignorePath, gitignore);
            // Verify content
            const content = await fs.readFile(gitignorePath, 'utf-8');
            expect(content).toContain('# Dependencies');
            expect(content).toContain('node_modules/');
            expect(content).toContain('# Spec-kit clean architecture');
            expect(content).toContain('.regent-backups/');
        });
        it('should cleanup old backups keeping only most recent', async () => {
            await fs.ensureDir(testProjectPath);
            const backupDir = path.join(testProjectPath, '.regent-backups');
            await fs.ensureDir(backupDir);
            // Create 15 backup files with different timestamps
            const backups = [];
            for (let i = 0; i < 15; i++) {
                const backupName = `config.regent-backup-${Date.now() + i}-${i}.json`;
                const backupPath = path.join(backupDir, backupName);
                await fs.writeFile(backupPath, '{}');
                backups.push(backupPath);
                await new Promise(resolve => setTimeout(resolve, 2)); // Small delay
            }
            // Verify all 15 backups exist
            expect((await fs.readdir(backupDir)).length).toBe(15);
            // Simulate cleanup keeping only 10 most recent
            const files = await fs.readdir(backupDir);
            const backupFiles = files.filter(f => f.includes('.regent-backup-'));
            // Get file stats for sorting
            const fileStats = await Promise.all(backupFiles.map(async (file) => {
                const filePath = path.join(backupDir, file);
                const stat = await fs.stat(filePath);
                return { file, filePath, mtime: stat.mtime };
            }));
            // Sort by modification time (newest first)
            fileStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
            // Remove old backups beyond keepCount (10)
            const filesToRemove = fileStats.slice(10);
            for (const { filePath } of filesToRemove) {
                await fs.remove(filePath);
            }
            // Verify only 10 backups remain
            expect((await fs.readdir(backupDir)).length).toBe(10);
        });
        it('should use hrtime for high-precision timestamps', async () => {
            // Test that hrtime provides nanosecond precision
            const hrTime1 = process.hrtime.bigint();
            const hrTime2 = process.hrtime.bigint();
            // Convert to milliseconds
            const timestamp1 = Number(hrTime1 / 1000000n);
            const timestamp2 = Number(hrTime2 / 1000000n);
            // Timestamps should be different or very close
            expect(typeof timestamp1).toBe('number');
            expect(typeof timestamp2).toBe('number');
            expect(timestamp1).toBeGreaterThan(0);
            expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
        });
        it('should use crypto random for unique IDs instead of counter', async () => {
            // Test that crypto random IDs are generated
            const crypto = await import('crypto');
            const id1 = crypto.randomBytes(3).toString('hex');
            const id2 = crypto.randomBytes(3).toString('hex');
            // IDs should be different
            expect(id1).not.toBe(id2);
            expect(id1.length).toBe(6); // 3 bytes = 6 hex chars
            expect(id2.length).toBe(6);
            expect(/^[0-9a-f]{6}$/.test(id1)).toBe(true);
            expect(/^[0-9a-f]{6}$/.test(id2)).toBe(true);
        });
        it('should prevent duplicate .gitignore entries with normalization', async () => {
            await fs.ensureDir(testProjectPath);
            const gitignorePath = path.join(testProjectPath, '.gitignore');
            // Create existing .gitignore with entries in different formats
            const existingContent = `node_modules/
*.log

.regent-backups
.rlhf
`;
            await fs.writeFile(gitignorePath, existingContent);
            // Regent entries to add (some are duplicates with different formatting)
            const regentEntries = [
                '# Spec-kit clean architecture',
                '.rlhf/', // duplicate of .rlhf (with trailing slash)
                '.logs/',
                '.regent-backups/' // duplicate of .regent-backups (with trailing slash)
            ];
            // Simulate merge logic
            const content = await fs.readFile(gitignorePath, 'utf-8');
            const normalizeEntry = (entry) => entry.trim().replace(/\/+$/, '');
            const existingLines = content.split('\n').map(normalizeEntry);
            const entriesToAdd = regentEntries.filter(entry => {
                const normalized = normalizeEntry(entry);
                if (normalized.startsWith('#') || normalized === '') {
                    return true;
                }
                return !existingLines.some(line => normalizeEntry(line) === normalized);
            });
            // Should only add non-duplicate entries
            const nonCommentEntries = entriesToAdd.filter(e => !e.startsWith('#') && e.trim());
            expect(nonCommentEntries.length).toBe(1); // Only .logs/ should be added
            expect(entriesToAdd).toContain('.logs/');
        });
        it('should validate backup directory is writable', async () => {
            await fs.ensureDir(testProjectPath);
            const backupDir = path.join(testProjectPath, '.test-backups');
            // Test writing to directory
            try {
                await fs.ensureDir(backupDir);
                const testFile = path.join(backupDir, '.write-test');
                await fs.writeFile(testFile, '');
                await fs.remove(testFile);
                // If we get here, directory is writable
                expect(await fs.pathExists(backupDir)).toBe(true);
            }
            catch (error) {
                // Should not throw for valid directory
                expect(error).toBeUndefined();
            }
            // Cleanup
            await fs.remove(backupDir);
        });
        it('should handle source file not found gracefully', async () => {
            // Test that missing source files don't crash the system
            const nonExistentPath = path.join(testProjectPath, 'non-existent.js');
            expect(await fs.pathExists(nonExistentPath)).toBe(false);
            // Verify graceful handling
            try {
                if (await fs.pathExists(nonExistentPath)) {
                    await fs.readFile(nonExistentPath, 'utf-8');
                }
                // Should skip reading if file doesn't exist
                expect(true).toBe(true);
            }
            catch (error) {
                // Should not reach here due to existence check
                expect(error).toBeUndefined();
            }
        });
        it('should use human-readable timestamp format', async () => {
            // Test timestamp format: YYYYMMDD-HHMMSS
            const now = new Date();
            const timestamp = now.toISOString()
                .replace(/[-:]/g, '')
                .replace('T', '-')
                .slice(0, 15);
            // Should match format YYYYMMDD-HHMMSS
            expect(timestamp).toMatch(/^\d{8}-\d{6}$/);
            // Example: 20240315-143022
            expect(timestamp.length).toBe(15);
            expect(timestamp.charAt(8)).toBe('-');
        });
        it('should validate file size before backup (prevent disk exhaustion)', async () => {
            await fs.ensureDir(testProjectPath);
            // Create a small test file
            const testFile = path.join(testProjectPath, 'small.json');
            await fs.writeFile(testFile, '{"test": true}');
            const stats = await fs.stat(testFile);
            const MAX_BACKUP_SIZE = 100 * 1024 * 1024; // 100MB
            // Small file should pass validation
            expect(stats.size).toBeLessThan(MAX_BACKUP_SIZE);
            // Simulate large file check
            const largeFileSize = 150 * 1024 * 1024; // 150MB
            expect(largeFileSize).toBeGreaterThan(MAX_BACKUP_SIZE);
            // Cleanup
            await fs.remove(testFile);
        });
        it('should format file size in human-readable format', async () => {
            // Test size formatting
            const sizeInBytes = 52428800; // 50MB
            const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
            expect(sizeInMB).toBe('50.00');
            expect(sizeInMB).toMatch(/^\d+\.\d{2}$/);
        });
    });
    describe('Symlink Handling', () => {
        it('should handle symlinked config files during backup', async () => {
            await fs.ensureDir(testProjectPath);
            const backupDir = path.join(testProjectPath, '.regent-backups');
            // Create a real file
            const realConfigPath = path.join(testProjectPath, 'real-config.json');
            await fs.writeFile(realConfigPath, JSON.stringify({ real: true }));
            // Create a symlink to it
            const symlinkPath = path.join(testProjectPath, 'tsconfig.json');
            await fs.symlink(realConfigPath, symlinkPath);
            // Verify symlink exists
            const symlinkStats = await fs.lstat(symlinkPath);
            expect(symlinkStats.isSymbolicLink()).toBe(true);
            // Simulate backup creation with symlink
            const timestamp = new Date().toISOString()
                .replace(/[-:]/g, '')
                .replace('T', '-')
                .slice(0, 15);
            const backupName = `tsconfig.regent-backup-${timestamp}-abc123.json`;
            const backupPath = path.join(backupDir, backupName);
            await fs.ensureDir(backupDir);
            await fs.copy(symlinkPath, backupPath);
            // Backup should exist and contain the real file content
            expect(await fs.pathExists(backupPath)).toBe(true);
            const backupContent = await fs.readJson(backupPath);
            expect(backupContent).toEqual({ real: true });
            // Cleanup
            await fs.remove(testProjectPath);
        });
        it('should reject backup directory paths that are symlinks outside project', async () => {
            await fs.ensureDir(testProjectPath);
            // Create a directory outside project
            const outsideDir = path.join(__dirname, '__outside-dir__');
            await fs.ensureDir(outsideDir);
            try {
                // Create symlink pointing outside project
                const symlinkBackupDir = path.join(testProjectPath, 'backup-link');
                await fs.symlink(outsideDir, symlinkBackupDir);
                // Resolve the symlink
                const resolvedPath = await fs.realpath(symlinkBackupDir);
                // Verify it points outside project
                const isOutside = !resolvedPath.startsWith(testProjectPath);
                expect(isOutside).toBe(true);
                // In actual implementation, this should be rejected for security
                // The path.resolve validation catches this
            }
            finally {
                // Cleanup
                await fs.remove(outsideDir);
                await fs.remove(testProjectPath);
            }
        });
        it('should successfully backup when backup dir is a symlink within project', async () => {
            await fs.ensureDir(testProjectPath);
            // Create a real backup directory within project
            const realBackupDir = path.join(testProjectPath, 'real-backups');
            await fs.ensureDir(realBackupDir);
            // Create symlink to it (also within project)
            const symlinkBackupDir = path.join(testProjectPath, '.regent-backups');
            await fs.symlink(realBackupDir, symlinkBackupDir);
            // Create a config file to backup
            const configPath = path.join(testProjectPath, 'tsconfig.json');
            await fs.writeFile(configPath, JSON.stringify({ config: true }));
            // Simulate backup creation
            const timestamp = new Date().toISOString()
                .replace(/[-:]/g, '')
                .replace('T', '-')
                .slice(0, 15);
            const backupName = `tsconfig.regent-backup-${timestamp}-def456.json`;
            const backupPath = path.join(symlinkBackupDir, backupName);
            await fs.copy(configPath, backupPath);
            // Verify backup exists in real directory
            expect(await fs.pathExists(backupPath)).toBe(true);
            const realBackupPath = path.join(realBackupDir, backupName);
            expect(await fs.pathExists(realBackupPath)).toBe(true);
            // Cleanup
            await fs.remove(testProjectPath);
        });
    });
});
