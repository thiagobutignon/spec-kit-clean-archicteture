/**
 * Shared test utilities for environment variable cleanup
 */
/**
 * Clean up execution option environment variables
 * Use in beforeEach and afterEach to prevent test pollution
 */
export function cleanupExecutionEnvVars() {
    delete process.env.REGENT_NON_INTERACTIVE;
    delete process.env.REGENT_AUTO_CONFIRM;
    delete process.env.REGENT_STRICT;
    delete process.env.CI;
    delete process.env.CLAUDE_CODE;
    delete process.env.AI_ORCHESTRATOR;
}
/**
 * Set up environment variables for testing
 * @param vars - Object with environment variable values to set
 */
export function setupExecutionEnvVars(vars) {
    if (vars.nonInteractive)
        process.env.REGENT_NON_INTERACTIVE = vars.nonInteractive;
    if (vars.autoConfirm)
        process.env.REGENT_AUTO_CONFIRM = vars.autoConfirm;
    if (vars.strict)
        process.env.REGENT_STRICT = vars.strict;
    if (vars.ci)
        process.env.CI = vars.ci;
    if (vars.claudeCode)
        process.env.CLAUDE_CODE = vars.claudeCode;
    if (vars.aiOrchestrator)
        process.env.AI_ORCHESTRATOR = vars.aiOrchestrator;
}
