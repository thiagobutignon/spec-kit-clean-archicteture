/**
 * Commit Generator
 * Generates conventional commit messages for Clean Architecture steps
 */
import { extractScope } from './scope-extractor';
/**
 * Default commit configuration
 */
export const DEFAULT_COMMIT_CONFIG = {
    enabled: true,
    qualityChecks: {
        lint: true,
        lintCommand: 'lint',
        test: true,
        testCommand: 'test --run',
    },
    conventionalCommits: {
        enabled: true,
        typeMapping: {
            create_file: 'regent',
            refactor_file: 'regent',
            delete_file: 'regent',
            folder: 'regent',
            branch: null,
            pull_request: null,
            validation: null,
            test: 'regent',
            conditional_file: 'regent',
        },
    },
    coAuthor: 'Claude <noreply@anthropic.com>',
    emoji: {
        enabled: true,
        robot: '🤖',
    },
    interactiveSafety: true,
};
/**
 * Maps step type to conventional commit type
 */
export function mapStepTypeToCommitType(stepType, config = DEFAULT_COMMIT_CONFIG) {
    return config.conventionalCommits.typeMapping[stepType] || null;
}
/**
 * Extracts entity/component name from file path for richer descriptions
 * @param filePath - The file path to extract entity from
 * @returns Entity name or null if not found
 */
function extractEntityName(filePath) {
    // Guard against null, undefined, or empty string
    if (!filePath || typeof filePath !== 'string')
        return null;
    // Normalize path to resolve . and .. segments for path traversal detection
    const normalizedPath = filePath.replace(/\\/g, '/').replace(/\/+/g, '/');
    // Check for path traversal attempts
    if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
        return null;
    }
    // Extract filename without extension (safely handle Windows and Unix paths)
    const fileName = filePath.split('/').pop()?.split('\\').pop();
    if (!fileName)
        return null;
    const nameWithoutExt = fileName.replace(/\.(ts|js|tsx|jsx)$/, '');
    // Convert kebab-case or snake_case to Title Case
    const words = nameWithoutExt.split(/[-_]/).filter(w => w.length > 0);
    if (words.length === 0)
        return null;
    // Capitalize each word
    const titleCase = words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    return titleCase;
}
/**
 * Enhances description with entity information from path
 * @param description - Original description
 * @param filePath - File path to extract entity from
 * @returns Enhanced description
 */
function enhanceDescription(description, filePath) {
    if (!filePath)
        return description;
    const entityName = extractEntityName(filePath);
    if (!entityName)
        return description;
    // Detect what kind of file it is from the path
    let fileType = '';
    if (filePath.includes('/models/') || filePath.includes('/entities/')) {
        fileType = 'entity';
    }
    else if (filePath.includes('/value-objects/')) {
        fileType = 'value object';
    }
    else if (filePath.includes('/usecases/') || filePath.includes('/use-cases/')) {
        fileType = 'use case';
    }
    else if (filePath.includes('/repositories/')) {
        fileType = 'repository';
    }
    else if (filePath.includes('/controllers/')) {
        fileType = 'controller';
    }
    else if (filePath.includes('/components/')) {
        fileType = 'component';
    }
    else if (filePath.includes('/factories/')) {
        fileType = 'factory';
    }
    else if (filePath.includes('/adapters/')) {
        fileType = 'adapter';
    }
    else if (filePath.includes('/protocols/') || filePath.includes('/interfaces/')) {
        fileType = 'protocol';
    }
    // If we have context, enhance the description
    if (fileType) {
        // Check if description already mentions the entity and type
        const lowerDesc = description.toLowerCase();
        const hasEntity = lowerDesc.includes(entityName.toLowerCase());
        const hasType = lowerDesc.includes(fileType);
        if (!hasEntity && !hasType) {
            // Add both entity and type
            return `${description} - ${entityName} ${fileType}`;
        }
        else if (!hasEntity) {
            // Add just entity
            return `${description} for ${entityName}`;
        }
        else if (!hasType) {
            // Add just type
            return `${description} (${fileType})`;
        }
    }
    return description;
}
/**
 * Generates a conventional commit message
 * @param stepType - Type of step being executed
 * @param description - Step description to use as commit message
 * @param filePath - Optional file path to extract scope from
 * @param config - Optional commit configuration
 * @returns Formatted commit message or null if step shouldn't be committed
 *
 * @example
 * generateCommitMessage('create_file', 'Create Product domain model', 'src/domain/models/product.ts')
 * // Returns: 'regent(domain): create Product domain model\n\n🤖 Generated with Claude Code\n\nCo-Authored-By: Claude <noreply@anthropic.com>'
 */
export function generateCommitMessage(stepType, description, filePath, config = DEFAULT_COMMIT_CONFIG) {
    // Input validation
    if (!stepType || typeof stepType !== 'string') {
        throw new Error('Invalid stepType: must be a non-empty string');
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        throw new Error('Invalid description: must be a non-empty string');
    }
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid config: must be an object');
    }
    // Validate config structure
    if (typeof config.enabled !== 'boolean') {
        throw new Error('Invalid config.enabled: must be a boolean');
    }
    if (!config.conventionalCommits || typeof config.conventionalCommits !== 'object') {
        throw new Error('Invalid config.conventionalCommits: must be an object');
    }
    if (!config.enabled || !config.conventionalCommits.enabled) {
        return null;
    }
    const commitType = mapStepTypeToCommitType(stepType, config);
    // No commit for certain step types (branch, pull_request, etc)
    if (!commitType) {
        return null;
    }
    // Extract scope from file path
    const scope = filePath ? extractScope(filePath) : 'core';
    // Enhance description with entity information
    const enhancedDescription = enhanceDescription(description, filePath);
    // Normalize description: lowercase first letter for conventional commits
    const normalizedDescription = enhancedDescription.charAt(0).toLowerCase() + enhancedDescription.slice(1);
    // Build subject line and validate length
    const subjectLine = `${commitType}(${scope}): ${normalizedDescription}`;
    // Validate subject line length against conventional commit standard (72 chars)
    const MAX_SUBJECT_LENGTH = 72;
    if (subjectLine.length > MAX_SUBJECT_LENGTH) {
        // Truncate description to fit within limit
        const prefixLength = `${commitType}(${scope}): `.length;
        const availableLength = MAX_SUBJECT_LENGTH - prefixLength - 3; // -3 for '...'
        if (availableLength > 0) {
            const truncatedDescription = normalizedDescription.slice(0, availableLength) + '...';
            const truncatedSubject = `${commitType}(${scope}): ${truncatedDescription}`;
            // Build commit message with truncated subject
            const emojiPrefix = config.emoji?.enabled !== false
                ? `${config.emoji?.robot || '🤖'} `
                : '';
            const message = `${truncatedSubject}

${emojiPrefix}Generated with Claude Code

Co-Authored-By: ${config.coAuthor}`;
            return message;
        }
        else {
            throw new Error(`Commit subject line too long (${subjectLine.length} > ${MAX_SUBJECT_LENGTH} chars). ` +
                `Even after truncation, prefix "${commitType}(${scope}): " is too long.`);
        }
    }
    // Build commit message with configurable emoji
    const emojiPrefix = config.emoji?.enabled !== false
        ? `${config.emoji?.robot || '🤖'} `
        : '';
    const message = `${subjectLine}

${emojiPrefix}Generated with Claude Code

Co-Authored-By: ${config.coAuthor}`;
    return message;
}
/**
 * Checks if a step type should trigger a commit
 */
export function shouldCommitStep(stepType, config = DEFAULT_COMMIT_CONFIG) {
    if (!config.enabled || !config.conventionalCommits.enabled) {
        return false;
    }
    const commitType = mapStepTypeToCommitType(stepType, config);
    return commitType !== null;
}
/**
 * Formats a commit message for git commit command
 * Ensures proper escaping for shell execution
 */
export function formatCommitMessageForShell(message) {
    // Guard against null, undefined, or non-string input
    if (!message || typeof message !== 'string') {
        return '';
    }
    // Escape single quotes and newlines for heredoc
    return message.replace(/'/g, "'\\''");
}
/**
 * Dummy quality check - actual implementation will be in execute-steps.ts
 * This is just the interface
 */
export function createQualityCheckResult(lintPassed, testPassed, lintOutput, testOutput) {
    return {
        lint: {
            passed: lintPassed,
            output: lintOutput,
        },
        test: {
            passed: testPassed,
            output: testOutput,
        },
        overallPassed: lintPassed && testPassed,
    };
}
