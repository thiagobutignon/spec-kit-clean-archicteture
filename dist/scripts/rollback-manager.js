#!/usr/bin/env tsx
import fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'yaml';
import chalk from 'chalk';
import { execSync } from 'child_process';
class RollbackManager {
    snapshotsDir = '.rlhf/snapshots';
    currentSnapshot;
    constructor() {
        fs.ensureDirSync(this.snapshotsDir);
    }
    /**
     * Create a snapshot before executing a step
     */
    async createSnapshot(step) {
        console.log(chalk.blue(`📸 Creating snapshot for step: ${step.id}`));
        const snapshot = {
            stepId: step.id,
            timestamp: new Date(),
            files: new Map(),
            gitStatus: this.getGitStatus(),
            branch: this.getCurrentBranch()
        };
        // Save file contents that will be modified
        if (step.path && await fs.pathExists(step.path)) {
            const content = await fs.readFile(step.path, 'utf-8');
            snapshot.files.set(step.path, content);
        }
        // For refactor steps, save the original file
        if (step.type === 'refactor_file' && step.path) {
            if (await fs.pathExists(step.path)) {
                const content = await fs.readFile(step.path, 'utf-8');
                snapshot.files.set(step.path, content);
            }
        }
        // Save snapshot
        const snapshotPath = path.join(this.snapshotsDir, `${step.id}-${Date.now()}.json`);
        await fs.writeJson(snapshotPath, {
            ...snapshot,
            files: Array.from(snapshot.files.entries())
        }, { spaces: 2 });
        this.currentSnapshot = snapshot;
        console.log(chalk.green(`✅ Snapshot saved: ${snapshotPath}`));
    }
    /**
     * Rollback to the last snapshot
     */
    async rollback(stepId) {
        console.log(chalk.yellow(`🔄 Rolling back step: ${stepId}`));
        // Find the latest snapshot for this step
        const snapshots = await fs.readdir(this.snapshotsDir);
        const stepSnapshots = snapshots
            .filter(f => f.startsWith(`${stepId}-`))
            .sort()
            .reverse();
        if (stepSnapshots.length === 0) {
            console.log(chalk.red(`❌ No snapshot found for step: ${stepId}`));
            return;
        }
        const snapshotPath = path.join(this.snapshotsDir, stepSnapshots[0]);
        const snapshotData = await fs.readJson(snapshotPath);
        const snapshot = {
            ...snapshotData,
            files: new Map(snapshotData.files)
        };
        // Restore files
        for (const [filepath, content] of snapshot.files) {
            console.log(chalk.gray(`   Restoring: ${filepath}`));
            await fs.writeFile(filepath, content);
        }
        // Check if we need to switch branches
        const currentBranch = this.getCurrentBranch();
        if (currentBranch !== snapshot.branch) {
            console.log(chalk.gray(`   Switching branch: ${snapshot.branch}`));
            try {
                execSync(`git checkout ${snapshot.branch}`, { stdio: 'pipe' });
            }
            catch {
                console.log(chalk.yellow(`   ⚠️ Could not switch to branch: ${snapshot.branch}`));
            }
        }
        console.log(chalk.green(`✅ Rollback completed for step: ${stepId}`));
    }
    /**
     * Rollback multiple steps in reverse order
     */
    async rollbackMultiple(yamlPath) {
        const content = await fs.readFile(yamlPath, 'utf-8');
        const plan = yaml.parse(content);
        // Find all failed steps
        const failedSteps = plan.steps.filter((s) => s.status === 'FAILED');
        if (failedSteps.length === 0) {
            console.log(chalk.yellow('No failed steps to rollback'));
            return;
        }
        console.log(chalk.cyan(`🔄 Rolling back ${failedSteps.length} failed steps...`));
        // Rollback in reverse order
        for (const step of failedSteps.reverse()) {
            await this.rollback(step.id);
            // Update step status
            step.status = 'PENDING';
            step.execution_log = 'Rolled back';
            step.rlhf_score = null;
        }
        // Save updated plan
        const rolledBackPath = yamlPath.replace('.yaml', '-rolledback.yaml');
        await fs.writeFile(rolledBackPath, yaml.stringify(plan));
        console.log(chalk.green(`✅ Rollback complete. Updated plan: ${rolledBackPath}`));
    }
    /**
     * Clean old snapshots
     */
    async cleanSnapshots(daysOld = 7) {
        const snapshots = await fs.readdir(this.snapshotsDir);
        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
        let cleaned = 0;
        for (const snapshot of snapshots) {
            const snapshotPath = path.join(this.snapshotsDir, snapshot);
            const stats = await fs.stat(snapshotPath);
            if (stats.mtimeMs < cutoffTime) {
                await fs.remove(snapshotPath);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            console.log(chalk.gray(`🧹 Cleaned ${cleaned} old snapshots`));
        }
    }
    /**
     * Create a full backup before major operations
     */
    async createFullBackup(projectPath = '.') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join('.rlhf/backups', timestamp);
        console.log(chalk.blue(`💾 Creating full backup: ${backupDir}`));
        await fs.ensureDir(backupDir);
        // Backup critical directories
        const dirsToBackup = ['src', 'tests', '.claude'];
        for (const dir of dirsToBackup) {
            const sourcePath = path.join(projectPath, dir);
            if (await fs.pathExists(sourcePath)) {
                const destPath = path.join(backupDir, dir);
                await fs.copy(sourcePath, destPath);
                console.log(chalk.gray(`   Backed up: ${dir}`));
            }
        }
        // Save git information
        const gitInfo = {
            branch: this.getCurrentBranch(),
            status: this.getGitStatus(),
            lastCommit: this.getLastCommit()
        };
        await fs.writeJson(path.join(backupDir, 'git-info.json'), gitInfo, { spaces: 2 });
        console.log(chalk.green(`✅ Full backup created: ${backupDir}`));
        return backupDir;
    }
    /**
     * Restore from a full backup
     */
    async restoreFromBackup(backupPath) {
        if (!await fs.pathExists(backupPath)) {
            throw new Error(`Backup not found: ${backupPath}`);
        }
        console.log(chalk.yellow(`🔄 Restoring from backup: ${backupPath}`));
        // Restore directories
        const dirs = await fs.readdir(backupPath);
        for (const dir of dirs) {
            if (dir === 'git-info.json')
                continue;
            const sourcePath = path.join(backupPath, dir);
            const destPath = dir;
            console.log(chalk.gray(`   Restoring: ${dir}`));
            await fs.copy(sourcePath, destPath, { overwrite: true });
        }
        // Restore git state
        const gitInfo = await fs.readJson(path.join(backupPath, 'git-info.json'));
        if (gitInfo.branch !== this.getCurrentBranch()) {
            try {
                execSync(`git checkout ${gitInfo.branch}`, { stdio: 'pipe' });
            }
            catch {
                console.log(chalk.yellow(`   ⚠️ Could not restore branch: ${gitInfo.branch}`));
            }
        }
        console.log(chalk.green(`✅ Restore complete`));
    }
    getGitStatus() {
        try {
            return execSync('git status --porcelain', { encoding: 'utf-8' });
        }
        catch {
            return '';
        }
    }
    getCurrentBranch() {
        try {
            return execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
        }
        catch {
            return 'unknown';
        }
    }
    getLastCommit() {
        try {
            return execSync('git log -1 --oneline', { encoding: 'utf-8' }).trim();
        }
        catch {
            return '';
        }
    }
}
// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const manager = new RollbackManager();
    switch (command) {
        case 'rollback':
            if (args[1]) {
                await manager.rollback(args[1]);
            }
            else {
                console.log(chalk.red('Usage: rollback <step-id>'));
            }
            break;
        case 'rollback-all':
            if (args[1]) {
                await manager.rollbackMultiple(args[1]);
            }
            else {
                console.log(chalk.red('Usage: rollback-all <yaml-file>'));
            }
            break;
        case 'backup':
            await manager.createFullBackup();
            break;
        case 'restore':
            if (args[1]) {
                await manager.restoreFromBackup(args[1]);
            }
            else {
                console.log(chalk.red('Usage: restore <backup-path>'));
            }
            break;
        case 'clean':
            await manager.cleanSnapshots(parseInt(args[1]) || 7);
            break;
        default:
            console.log(chalk.cyan('Rollback Manager Commands:'));
            console.log('  rollback <step-id>     - Rollback a specific step');
            console.log('  rollback-all <yaml>    - Rollback all failed steps');
            console.log('  backup                 - Create full backup');
            console.log('  restore <backup-path>  - Restore from backup');
            console.log('  clean [days]           - Clean old snapshots');
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
export { RollbackManager };
