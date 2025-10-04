/**
 * Package Manager Utilities
 * Provides safe package manager operations with caching and validation
 */
import fs from 'fs-extra';
import { $ } from 'zx';
/**
 * Cached package manager detection result
 */
let cachedPackageManager = null;
/**
 * Detect package manager being used in the project
 * Results are cached for performance
 */
export function detectPackageManager() {
    // Return cached result if available
    if (cachedPackageManager) {
        return cachedPackageManager;
    }
    // Check for lock files
    if (fs.existsSync('pnpm-lock.yaml')) {
        cachedPackageManager = 'pnpm';
        return 'pnpm';
    }
    if (fs.existsSync('yarn.lock')) {
        cachedPackageManager = 'yarn';
        return 'yarn';
    }
    // Default to npm
    cachedPackageManager = 'npm';
    return 'npm';
}
/**
 * Clear cached package manager (useful for testing)
 */
export function clearPackageManagerCache() {
    cachedPackageManager = null;
}
/**
 * Sanitize script name to prevent command injection
 * Removes dangerous characters that could be used for injection
 */
export function sanitizeScriptName(scriptName) {
    // Allow only alphanumeric, dash, underscore, colon, and space
    return scriptName.replace(/[^a-zA-Z0-9\-_:\s]/g, '');
}
/**
 * Build safe command for package manager
 * Uses array format to prevent shell injection
 */
export function buildPackageManagerCommand(pm, scriptName) {
    const sanitizedScript = sanitizeScriptName(scriptName);
    switch (pm) {
        case 'pnpm':
            return {
                command: 'pnpm',
                args: sanitizedScript.split(/\s+/),
            };
        case 'yarn':
            return {
                command: 'yarn',
                args: sanitizedScript.split(/\s+/),
            };
        case 'npm':
            return {
                command: 'npm',
                args: ['run', ...sanitizedScript.split(/\s+/)],
            };
        default:
            return {
                command: 'npm',
                args: ['run', ...sanitizedScript.split(/\s+/)],
            };
    }
}
/**
 * Execute package manager command safely
 * Uses direct command execution instead of sh -c to prevent injection
 */
export async function executePackageManagerCommand(scriptName, options = {}) {
    const pm = detectPackageManager();
    const { command, args } = buildPackageManagerCommand(pm, scriptName);
    const originalVerbose = $.verbose;
    try {
        $.verbose = options.verbose ?? false;
        // Use direct command execution with args array (safer than sh -c)
        const result = await $ `${command} ${args}`.timeout(options.timeout || 300000 // 5 minutes default
        );
        return {
            stdout: result.stdout,
            stderr: result.stderr,
            exitCode: result.exitCode || 0,
        };
    }
    catch (error) {
        const err = error;
        return {
            stdout: err.stdout || '',
            stderr: err.stderr || err.message || '',
            exitCode: err.exitCode || 1,
        };
    }
    finally {
        $.verbose = originalVerbose;
    }
}
/**
 * Validate script exists in package.json
 */
export async function validateScriptExists(scriptName) {
    try {
        const packageJson = await fs.readJson('package.json');
        return scriptName in (packageJson.scripts || {});
    }
    catch {
        return false;
    }
}
/**
 * Get available scripts from package.json
 */
export async function getAvailableScripts() {
    try {
        const packageJson = await fs.readJson('package.json');
        return Object.keys(packageJson.scripts || {});
    }
    catch {
        return [];
    }
}
