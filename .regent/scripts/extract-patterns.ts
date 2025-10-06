#!/usr/bin/env tsx

/**
 * Extract Clean Architecture Patterns from Codebase
 * Uses Serena MCP + Claude CLI to analyze code and generate validation patterns
 *
 * CONFIGURATION
 * =============
 * All constants can be configured via environment variables:
 *
 * - MAX_PROMPT_SIZE (default: 50000, range: 1000-200000)
 *   Maximum prompt size in characters to prevent DoS attacks
 *
 * - MAX_CODE_SAMPLE_LENGTH (default: 10000, range: 100-50000)
 *   Maximum code sample length for Claude context window
 *
 * - MAX_SRC_SAMPLES (default: 3, range: 1-20)
 *   Number of source files to sample per layer
 *
 * - MAX_TEST_SAMPLES (default: 2, range: 1-20)
 *   Number of test files to sample per layer
 *
 * - MAX_CONCURRENT_API_CALLS (default: 3, range: 1-10)
 *   Rate limiting for Claude API to prevent rate limit errors
 *
 * - MAX_FILE_SIZE (default: 1048576 (1MB), range: 1024-10485760)
 *   Maximum file size in bytes to prevent memory exhaustion
 *
 * - DEBUG (values: '1' or 'true')
 *   Enable debug output with detailed logging
 *
 * Example usage:
 *   MAX_SRC_SAMPLES=5 MAX_TEST_SAMPLES=3 npm run extract-patterns
 *
 * ⚠️  SECURITY WARNING ⚠️
 * ====================
 * This script analyzes code and sends it to Claude CLI for pattern extraction.
 *
 * ONLY USE WITH TRUSTED CODEBASES!
 *
 * Security Measures Implemented:
 * - Input sanitization (null bytes, ANSI codes, control characters)
 * - Prompt validation for command injection patterns
 * - Path traversal protection
 * - File size limits (1MB max per file by default)
 * - Prompt size limits (50KB max by default)
 * - execFileSync with argument arrays (no shell interpolation)
 * - 60-second timeout on CLI calls
 * - Windows window hiding for security
 *
 * Residual Risks:
 * - Malicious code could craft prompts that exploit Claude CLI vulnerabilities
 * - No sandboxing of the analysis process
 * - Analyzed code content is sent to external API
 *
 * Mitigation:
 * - Only analyze codebases you trust
 * - Review generated patterns before committing
 * - Run in isolated environment for untrusted code
 * - Monitor Claude CLI usage and API calls
 *
 * @see https://github.com/thiagobutignon/the-regent/security for more info
 *
 * ERROR MESSAGE STANDARDS
 * =======================
 * All user-facing messages follow a consistent emoji-based format:
 *
 * ✅ Success messages (successful operations, validations passed)
 * ❌ Errors (critical failures, operations failed)
 * ⚠️  Warnings (non-critical issues, degraded functionality)
 * 💡 Hints/Suggestions (actionable guidance, next steps)
 * 🔍 Debug info (technical details when DEBUG=1)
 * 🔒 Security (security-related errors and warnings)
 * 📊 📈 📋 📂 📁 💾 Statistics/Data (summaries, file operations)
 * 🚀 🏗️ 🎯 🤖 Process/Action (ongoing operations, analysis steps)
 * 📝 📏 Technical metrics (code size, response data)
 *
 * Format Guidelines:
 * - Top-level messages start with emoji + space
 * - Nested/indented messages use 3-space indent + emoji
 * - Thrown errors include emoji prefix for consistency
 * - DEBUG output uses technical emojis (🔍 📝 📏)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { execFileSync } from 'child_process';
import { z } from 'zod';
import pLimit from 'p-limit';

// ============================================================================
// ZODS SCHEMAS - Runtime Validation
// ============================================================================

/**
 * Validates regex pattern for ReDoS (Regular Expression Denial of Service) vulnerabilities
 * Checks for catastrophic backtracking patterns that could cause performance issues
 *
 * Dangerous Patterns Detected:
 * - Nested quantifiers: (a+)+ or (a*)*
 * - Nested wildcards: (.*)+
 * - Alternation with overlap: (a|a)+ or (a|ab)+
 * - Excessive backtracking groups
 *
 * @param pattern - Regex pattern string to validate
 * @returns true if safe, false if potentially dangerous
 *
 * @see https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS
 */
function isRegexSafe(pattern: string): boolean {
  // Check for nested quantifiers (catastrophic backtracking)
  const nestedQuantifiers = /(\(.*?[+*]\))[+*{]/;
  if (nestedQuantifiers.test(pattern)) {
    return false;
  }

  // Check for alternation with duplicates or overlap
  const alternationWithDuplicates = /\([^)]*\|[^)]*\)[+*]/;
  if (alternationWithDuplicates.test(pattern)) {
    // Allow simple alternations like (jpg|png|gif)
    // but block potentially dangerous ones like (a|ab)+
    const hasOverlap = /\(([^|)]+)\|[^)]*\1[^)]*\)[+*]/.test(pattern);
    if (hasOverlap) {
      return false;
    }
  }

  // Check for nested wildcards
  const nestedWildcards = /\(\.\*[+*]?\)[+*]/;
  if (nestedWildcards.test(pattern)) {
    return false;
  }

  // Check for excessive nested groups (performance concern)
  const maxNestedGroups = 10;
  let maxNesting = 0;
  let currentNesting = 0;
  for (const char of pattern) {
    if (char === '(') {
      currentNesting++;
      maxNesting = Math.max(maxNesting, currentNesting);
    } else if (char === ')') {
      currentNesting--;
    }
  }
  if (maxNesting > maxNestedGroups) {
    return false;
  }

  // Check pattern length (very long patterns can be problematic)
  if (pattern.length > 500) {
    return false;
  }

  return true;
}

/**
 * Zod schema for pattern example validation
 * Ensures each pattern example has both violation and fix code samples
 * @example
 * {
 *   violation: "// Bad: Entity without validation",
 *   fix: "// Good: Entity with validation"
 * }
 */
const PatternExampleSchema = z.object({
  violation: z.string(),
  fix: z.string()
});

/**
 * Zod schema for individual pattern validation
 * Enforces structure and constraints for pattern definitions:
 * - ID format: 3 uppercase letters + 3 digits (e.g., DOM001, DAT002)
 * - Name: kebab-case format (e.g., entity-validation)
 * - Regex: Must be valid JavaScript regular expression AND safe from ReDoS
 * - Severity: One of critical, high, medium, low
 * - Description: Minimum 10 characters
 * - Examples: Optional array of violation/fix pairs
 */
const PatternSchema = z.object({
  id: z.string().regex(/^[A-Z]{3}\d{3}$/, 'ID must be 3 uppercase letters + 3 digits'),
  name: z.string().regex(/^[a-z0-9-]+$/, 'Name must be kebab-case'),
  regex: z.string()
    .refine((val) => {
      try {
        new RegExp(val);
        return true;
      } catch {
        return false;
      }
    }, 'Must be a valid regex pattern')
    .refine((val) => isRegexSafe(val), {
      message: 'Regex pattern may cause catastrophic backtracking (ReDoS vulnerability). ' +
               'Avoid nested quantifiers like (a+)+, nested wildcards like (.*)+, ' +
               'or excessive nesting depth.'
    }),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  examples: z.array(PatternExampleSchema).optional()
});

/**
 * Zod schema for validating Claude API responses
 * Ensures the response contains a valid patterns array
 * Used to validate JSON responses from Claude CLI before processing
 */
const PatternsResponseSchema = z.object({
  patterns: z.array(PatternSchema)
});

// ============================================================================
// TYPE DEFINITIONS - TypeScript Interfaces
// ============================================================================

/**
 * Pattern definition for code quality validation
 * Represents a single validation rule extracted from the codebase
 * @property id - Unique identifier (format: XXX###, e.g., DOM001)
 * @property name - Kebab-case pattern name (e.g., entity-validation)
 * @property regex - Regular expression to detect violations
 * @property severity - Impact level: critical, high, medium, low
 * @property description - Human-readable explanation of what the pattern detects
 * @property examples - Optional code samples showing violation and fix
 */
interface Pattern {
  id: string;
  name: string;
  regex: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  examples?: {
    violation: string;
    fix: string;
  }[];
}

/**
 * Collection of patterns organized by layer and quality category
 * Contains all extracted patterns from the codebase analysis
 *
 * Clean Architecture Layers:
 * @property domain - Domain/business logic patterns
 * @property data - Data access and repository patterns
 * @property infra - Infrastructure and external service patterns
 * @property presentation - UI and presentation layer patterns
 * @property main - Application composition and dependency injection patterns
 *
 * Quality Pattern Categories:
 * @property tdd - Test-Driven Development patterns
 * @property solid - SOLID principles violations
 * @property dry - Don't Repeat Yourself violations
 * @property design_patterns - Design pattern anti-patterns
 * @property kiss_yagni - Keep It Simple / You Aren't Gonna Need It violations
 * @property cross_cutting - Cross-cutting concerns (logging, error handling, etc.)
 */
interface LayerPatterns {
  domain: Pattern[];
  data: Pattern[];
  infra: Pattern[];
  presentation: Pattern[];
  main: Pattern[];
  tdd: Pattern[];
  solid: Pattern[];
  dry: Pattern[];
  design_patterns: Pattern[];
  kiss_yagni: Pattern[];
  cross_cutting: Pattern[];
}

/**
 * Represents a failed pattern extraction attempt
 * Used to track which layers failed analysis and why
 * @property layer - Layer or category name that failed
 * @property error - Error message describing the failure
 */
interface ExtractionFailure {
  layer: string;
  error: string;
}

/**
 * Result of a pattern extraction operation
 * Contains both successfully extracted patterns and any failures
 * @property patterns - Array of successfully extracted patterns
 * @property failures - Array of extraction failures for error reporting
 */
interface ExtractionResult {
  patterns: Pattern[];
  failures: ExtractionFailure[];
}

/**
 * Represents a file that was skipped during analysis
 * Used to track and report files that couldn't be processed
 * @property file - File path that was skipped
 * @property reason - Reason for skipping (e.g., "Exceeds size limit", "Read error")
 * @property size - Optional file size in bytes (for size-related skips)
 */
interface SkippedFile {
  file: string;
  reason: string;
  size?: number;
}

// ============================================================================
// CONFIGURATION - Environment Variables & Constants
// ============================================================================

/**
 * Parse and validate environment variable as positive integer
 * Provides safe fallback to defaults with user-friendly warnings
 * @param envVar - Environment variable name
 * @param defaultValue - Default value if env var not set
 * @param minValue - Minimum allowed value (optional)
 * @param maxValue - Maximum allowed value (optional)
 * @returns Validated integer value
 */
function getEnvInt(envVar: string, defaultValue: number, minValue?: number, maxValue?: number): number {
  const value = process.env[envVar];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`⚠️  Invalid ${envVar}="${value}" (not a number), using default: ${defaultValue}`);
    return defaultValue;
  }

  if (minValue !== undefined && parsed < minValue) {
    console.warn(`⚠️  ${envVar}="${parsed}" below minimum (${minValue}), using minimum`);
    return minValue;
  }

  if (maxValue !== undefined && parsed > maxValue) {
    console.warn(`⚠️  ${envVar}="${parsed}" above maximum (${maxValue}), using maximum`);
    return maxValue;
  }

  return parsed;
}

/**
 * Maximum prompt size in characters (configurable via MAX_PROMPT_SIZE env var)
 * Default: 50,000 characters
 * Range: 1,000 - 200,000
 * Purpose: Prevents DoS attacks and token exhaustion
 */
const MAX_PROMPT_SIZE = getEnvInt('MAX_PROMPT_SIZE', 50000, 1000, 200000);

/**
 * Maximum code sample length for Claude context window (configurable via MAX_CODE_SAMPLE_LENGTH env var)
 * Default: 10,000 characters
 * Range: 100 - 50,000
 * Purpose: Ensures code samples fit within Claude's context window
 */
const MAX_CODE_SAMPLE_LENGTH = getEnvInt('MAX_CODE_SAMPLE_LENGTH', 10000, 100, 50000);

/**
 * Number of source files to sample per layer (configurable via MAX_SRC_SAMPLES env var)
 * Default: 3 files
 * Range: 1 - 20
 * Purpose: Balances analysis quality with API cost and execution time
 */
const MAX_SRC_SAMPLES = getEnvInt('MAX_SRC_SAMPLES', 3, 1, 20);

/**
 * Number of test files to sample per layer (configurable via MAX_TEST_SAMPLES env var)
 * Default: 2 files
 * Range: 1 - 20
 * Purpose: Provides test patterns without overwhelming the context
 */
const MAX_TEST_SAMPLES = getEnvInt('MAX_TEST_SAMPLES', 2, 1, 20);

/**
 * Maximum concurrent API calls to Claude CLI (configurable via MAX_CONCURRENT_API_CALLS env var)
 * Default: 3 concurrent calls
 * Range: 1 - 10
 * Purpose: Rate limiting to prevent API throttling and errors
 */
const MAX_CONCURRENT_API_CALLS = getEnvInt('MAX_CONCURRENT_API_CALLS', 3, 1, 10);

/**
 * Maximum file size in bytes (configurable via MAX_FILE_SIZE env var)
 * Default: 1,048,576 bytes (1MB)
 * Range: 1,024 bytes (1KB) - 10,485,760 bytes (10MB)
 * Purpose: Prevents memory exhaustion from large files
 */
const MAX_FILE_SIZE = getEnvInt('MAX_FILE_SIZE', 1024 * 1024, 1024, 10 * 1024 * 1024);

/**
 * Debug mode flag (configurable via DEBUG env var)
 * Accepts: '1' or 'true'
 * Purpose: Enables detailed logging for troubleshooting
 */
const DEBUG = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

/**
 * Layer ID prefixes for consistent pattern identification
 * Maps layer/category names to 3-letter prefixes used in pattern IDs
 * @example
 * - Domain patterns: DOM001, DOM002, ...
 * - Data patterns: DAT001, DAT002, ...
 * - TDD patterns: TDD001, TDD002, ...
 */
const LAYER_PREFIXES: Record<string, string> = {
  domain: 'DOM',
  data: 'DAT',
  infra: 'INF',
  presentation: 'PRE',
  main: 'MAI',
  tdd: 'TDD',
  solid: 'SOL',
  dry: 'DRY',
  design_patterns: 'DES',
  kiss_yagni: 'KIS',
  cross_cutting: 'CRO'
};

/**
 * System prompt for Claude CLI pattern extraction
 * Instructs Claude to analyze code and extract validation patterns
 *
 * Format Requirements:
 * - Output must be valid JSON only (no markdown, no explanations)
 * - Pattern IDs: 3 uppercase letters + 3 digits (e.g., DOM001)
 * - Pattern names: kebab-case (e.g., entity-validation)
 * - Severity levels: critical, high, medium, low
 *
 * Pattern Categories:
 * - Clean Architecture (layer violations, dependencies)
 * - TDD (test structure, naming, mocking)
 * - SOLID Principles (SRP, OCP, LSP, ISP, DIP)
 * - DRY (code duplication detection)
 * - Design Patterns (implementations and anti-patterns)
 * - KISS/YAGNI (over-engineering, dead code)
 * - Cross-Cutting Concerns (logging, error handling, security)
 *
 * @see PatternsResponseSchema for validation schema
 */
const SYSTEM_PROMPT = `You are a comprehensive code quality and architecture pattern analyzer.

Given source code files, extract validation patterns that enforce best practices.

Output ONLY valid JSON in this exact format:
{
  "patterns": [
    {
      "id": "DOM001",
      "name": "pattern-name-kebab-case",
      "regex": "valid regex pattern",
      "severity": "critical|high|medium|low",
      "description": "What this pattern detects",
      "examples": [
        {
          "violation": "// bad code",
          "fix": "// good code"
        }
      ]
    }
  ]
}

Focus on extracting patterns for:

**Clean Architecture:**
- Layer dependency violations (domain importing from data/infra)
- Missing interfaces (use cases without contracts)
- External dependencies in wrong layers (axios in domain)
- Naming conventions

**TDD Patterns:**
- Test structure (AAA: Arrange, Act, Assert)
- Test naming conventions (should, describe patterns)
- Mock/Spy/Stub patterns
- Test coverage indicators
- Red-Green-Refactor cycle compliance

**SOLID Principles:**
- SRP: Single Responsibility (classes doing too much)
- OCP: Open/Closed (modification vs extension)
- LSP: Liskov Substitution (interface contract violations)
- ISP: Interface Segregation (fat interfaces)
- DIP: Dependency Inversion (direct implementations vs abstractions)

**DRY Violations:**
- Duplicated code blocks
- Repeated logic patterns
- Similar function implementations

**Design Patterns:**
- Factory Pattern implementation
- Strategy Pattern usage
- Repository Pattern
- Observer/Event patterns
- Decorator Pattern
- Adapter Pattern
- Singleton (anti-pattern detection)
- God Object (anti-pattern)

**KISS/YAGNI:**
- Unnecessary complexity
- Over-engineering
- Unused code paths
- Dead code
- Premature optimization

**Cross-Cutting Concerns:**
- Logging patterns
- Error handling consistency
- Validation patterns
- Security concerns (auth, sanitization)
- Performance patterns (caching, lazy loading)
- Transaction boundaries
- Monitoring/Observability

DO NOT include markdown, explanations, or anything except the JSON.`;

/**
 * Get layer ID prefix for pattern IDs
 * @param layer - Layer name
 * @returns Three-letter prefix for pattern IDs
 */
function getLayerPrefix(layer: string): string {
  return LAYER_PREFIXES[layer] || layer.toUpperCase().padEnd(3, 'X').slice(0, 3);
}

/**
 * Sanitize file content to prevent command injection or malicious input
 * Removes control characters and escape sequences
 */
function sanitizeInput(input: string): string {
  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove ANSI escape codes (must be done BEFORE removing control characters)
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    // Remove other control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Limit consecutive newlines
    .replace(/\n{5,}/g, '\n\n\n\n');
}

/**
 * Validates all required dependencies are installed
 * Checks both system commands (tsx, claude) and npm packages (yaml, zod, p-limit)
 * @throws Exits with code 1 if critical dependencies are missing
 */
async function checkDependencies(): Promise<void> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for tsx runtime (required)
  try {
    execFileSync('which', ['tsx'], { encoding: 'utf-8' });
  } catch {
    errors.push('tsx runtime not found. Install with: npm install -g tsx');
  }

  // Check for claude CLI (optional - will use mock if not available)
  try {
    execFileSync('which', ['claude'], { encoding: 'utf-8' });
  } catch {
    warnings.push('Claude CLI not found. Pattern extraction will use mock data.');
    warnings.push('For real analysis, install Claude Code from: https://claude.ai/download');
  }

  // Check for required npm packages (pre-flight validation)
  const requiredPackages: Array<{ name: string; installCmd: string }> = [
    { name: 'yaml', installCmd: 'npm install yaml' },
    { name: 'zod', installCmd: 'npm install zod' },
    { name: 'p-limit', installCmd: 'npm install p-limit' }
  ];

  for (const pkg of requiredPackages) {
    try {
      await import(pkg.name);
    } catch {
      errors.push(`${pkg.name} package not found. Install with: ${pkg.installCmd}`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ Missing dependencies:');
    errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    warnings.forEach(warn => console.warn(`   - ${warn}`));
  }
}

/**
 * Checks Claude CLI version and availability
 * @returns Version string or null if unavailable
 */
function getClaudeVersion(): string | null {
  try {
    const version = execFileSync('claude', ['--version'], {
      encoding: 'utf-8',
      timeout: 5000
    }).trim();
    return version;
  } catch {
    return null;
  }
}

/**
 * Retry wrapper with exponential backoff for API calls
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Result of the function call
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if error is retryable (network/timeout errors)
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isRetryable = errorMsg.includes('ETIMEDOUT') ||
                          errorMsg.includes('ECONNREFUSED') ||
                          errorMsg.includes('ENOTFOUND') ||
                          errorMsg.includes('rate limit');

      if (!isRetryable) {
        throw error; // Don't retry non-network errors
      }

      const backoffMs = Math.pow(2, attempt) * 1000;
      if (DEBUG) {
        console.warn(`   ⚠️  Attempt ${attempt} failed, retrying in ${backoffMs}ms...`);
      }
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  // Note: This point is unreachable - loop always returns or throws
  // TypeScript knows the return type is Promise<T>, no need for unreachable code
}

/**
 * Validates prompt for security concerns before sending to CLI
 * @param prompt - The prompt to validate
 * @throws Error if prompt contains suspicious patterns
 */
function validatePromptSecurity(prompt: string): void {
  // Check for command injection patterns
  const dangerousPatterns = [
    /;[\s]*(?:rm|del|format|curl|wget|nc|netcat|bash|sh|powershell|cmd)/i,
    /\$\(.*\)/,  // Command substitution
    /`[^`]*`/,   // Backtick command execution
    /&&|;|\||>/,  // Shell operators (except in code blocks)
    /\x00/,      // Null bytes (should already be removed but double-check)
  ];

  // Allow shell operators inside code blocks (between triple backticks)
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks: string[] = [];
  const promptWithoutCode = prompt.replace(codeBlockRegex, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Check dangerous patterns only in non-code sections
  for (const pattern of dangerousPatterns) {
    if (pattern.test(promptWithoutCode)) {
      throw new Error(`🔒 Security: Prompt contains potentially dangerous pattern: ${pattern}`);
    }
  }

  // Validate prompt doesn't exceed safe limits
  if (prompt.length > MAX_PROMPT_SIZE) {
    throw new Error(`🔒 Security: Prompt size (${prompt.length}) exceeds maximum safe size (${MAX_PROMPT_SIZE})`);
  }

  // Check for excessive nested structures that could cause issues
  const nestedBrackets = (prompt.match(/[{[]/g) || []).length;
  if (nestedBrackets > 1000) {
    throw new Error('🔒 Security: Prompt contains excessive nested structures');
  }
}

/**
 * Calls Claude CLI with retry logic for network resilience
 * ⚠️  SECURITY WARNING: This function passes prompts to external CLI.
 * Only use with trusted codebases. Prompts are validated but not sandboxed.
 *
 * @param prompt - The prompt to send to Claude (will be validated)
 * @returns Raw response string from Claude CLI
 * @throws Error if prompt fails security validation
 */
async function callClaudeCLI(prompt: string): Promise<string> {
  // Validate prompt security before sending to CLI
  validatePromptSecurity(prompt);

  return withRetry(async () => {
    // Try with --output-format flag (newer versions)
    try {
      return execFileSync('claude', ['-p', prompt, '--output-format', 'json'], {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 60000, // 60 second timeout
        windowsHide: true // Hide window on Windows for security
      });
    } catch {
      // Fallback to no flag (older versions or different CLI behavior)
      if (DEBUG) {
        console.warn(`   ⚠️  --output-format flag not supported, trying without flag`);
      }
      return execFileSync('claude', ['-p', prompt], {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 60000, // 60 second timeout
        windowsHide: true // Hide window on Windows for security
      });
    }
  }, 3); // 3 retry attempts with exponential backoff
}

/**
 * Analyzes code with Claude CLI (or mock if unavailable) to extract validation patterns
 * @param code - Source code to analyze (will be sanitized and truncated)
 * @param layer - Layer name for context (domain, data, infra, etc.)
 * @returns Extraction result with patterns and any failures
 */
async function analyzeCodeWithClaude(code: string, layer: string): Promise<ExtractionResult> {
  // Sanitize and truncate code to prevent injection attacks
  const sanitizedCode = sanitizeInput(code);
  const truncatedCode = sanitizedCode.substring(0, MAX_CODE_SAMPLE_LENGTH);

  const prompt = `${SYSTEM_PROMPT}

Analyze this ${layer} layer code and extract validation patterns:

\`\`\`typescript
${truncatedCode} // Truncated for context window
\`\`\`

Extract patterns that would catch violations in similar code.`;

  // Note: Prompt validation (size, injection patterns) is done in callClaudeCLI

  try {
    let content: string;

    // Try to use Claude CLI if available, fallback to mock
    try {
      const result = await callClaudeCLI(prompt);

      // Parse JSON response with error handling
      let response: { result?: string; [key: string]: unknown };
      try {
        response = JSON.parse(result) as { result?: string; [key: string]: unknown };
      } catch (parseError) {
        console.error(`❌ Failed to parse Claude CLI response for ${layer}`);
        if (DEBUG) {
          console.error('   📝 Raw response:', result.substring(0, 200));
          console.error('   🔍 Parse error:', parseError);
        }
        throw new Error(`JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }

      content = response.result || result; // Fallback to raw result if no .result property
    } catch (cliError) {
      // Claude CLI not available - use mock data
      const errorMsg = cliError instanceof Error ? cliError.message : String(cliError);
      if (errorMsg.includes('ENOENT') || errorMsg.includes('command not found')) {
        console.warn(`   ⚠️  Claude CLI not found, using mock patterns for ${layer}`);
      } else {
        console.warn(`   ⚠️  Claude CLI error (${errorMsg}), using mock patterns for ${layer}`);
      }

      content = JSON.stringify({
        patterns: [
          {
            id: `${getLayerPrefix(layer)}001`,
            name: `mock-${layer}-pattern`,
            regex: `${layer}.*violation`,
            severity: 'medium',
            description: `Mock pattern for ${layer} layer (Claude CLI not available)`,
            examples: [{
              violation: `// ${layer} violation example`,
              fix: `// ${layer} fix example`
            }]
          }
        ]
      });
    }

    // Strip markdown code blocks if present
    const jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(jsonStr);

    // Validate response schema with Zod
    const validation = PatternsResponseSchema.safeParse(parsed);

    if (!validation.success) {
      console.error(`❌ Invalid pattern format for ${layer}:`, validation.error.issues);
      const error = `Schema validation failed: ${validation.error.issues.map(i => i.message).join(', ')}`;
      return {
        patterns: [],
        failures: [{ layer, error }]
      };
    }

    return {
      patterns: validation.data.patterns,
      failures: []
    };
  } catch (error) {
    // Provide specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('command not found')) {
        console.error(`❌ Claude CLI not found for ${layer} analysis`);
        console.error(`   💡 Install from: https://claude.ai/download`);
      } else if (error.message.includes('ETIMEDOUT')) {
        console.error(`❌ API timeout while analyzing ${layer}`);
        console.error(`   💡 Check network connection or retry later`);
      } else if (error.message.includes('rate limit')) {
        console.error(`❌ Rate limit exceeded for ${layer}`);
        console.error(`   💡 Wait a few minutes before retrying`);
      } else if (error.message.includes('Prompt size')) {
        console.error(`❌ Code sample too large for ${layer}: ${error.message}`);
        console.error(`   💡 Try analyzing a smaller subset of files`);
      } else {
        console.error(`❌ Failed to analyze ${layer}: ${error.message}`);
        console.error(`   💡 Enable DEBUG=1 for details`);
      }

      if (DEBUG) {
        console.error('   🔍 Full error:', error);
        console.error('   📏 Code sample length:', code.length);
        console.error('   📏 Prompt length:', prompt.length);
      }

      return {
        patterns: [],
        failures: [{ layer, error: error.message }]
      };
    }

    // Fallback for non-Error objects
    const errorMsg = String(error);
    return {
      patterns: [],
      failures: [{ layer, error: errorMsg }]
    };
  }
}

async function getFiles(
  targetDir: string,
  filter?: (f: string) => boolean
): Promise<string[]> {
  const allFiles: string[] = [];

  // Search in both src/ and tests/ directories
  const searchDirs = [targetDir, targetDir.replace('/src', '/tests')];

  for (const dir of searchDirs) {
    try {
      const files = await fs.readdir(dir, { recursive: true });
      let tsFiles = files
        .filter(f => f.toString().endsWith('.ts') || f.toString().endsWith('.tsx'))
        .filter(f => !f.toString().includes('node_modules'))
        .map(f => path.join(dir, f.toString()));

      // Apply custom filter if provided
      if (filter) {
        tsFiles = tsFiles.filter(filter);
      }

      allFiles.push(...tsFiles);
    } catch (error) {
      // Directory doesn't exist or not accessible
      if (DEBUG) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`   ⚠️  Directory ${dir} not accessible: ${errorMsg}`);
      }
      continue;
    }
  }

  return allFiles;
}

async function getFilesFromSerena(targetDir: string, layer: string): Promise<string[]> {
  const files = await getFiles(targetDir, f => f.includes(layer));

  if (files.length === 0) {
    const searchDirs = [targetDir, targetDir.replace('/src', '/tests')];
    console.warn(`   ⚠️  No files found for ${layer} layer in ${searchDirs.join(', ')}`);
  }

  return files;
}

async function getAllFiles(targetDir: string): Promise<string[]> {
  return getFiles(targetDir);
}

async function extractPatternsForLayer(
  targetDir: string,
  layer: string,
  skippedFiles: SkippedFile[]
): Promise<ExtractionResult> {
  console.log(`\n📂 Analyzing ${layer} layer...`);

  const files = await getFilesFromSerena(targetDir, layer);

  const srcFiles = files.filter(f => f.includes('/src/'));
  const testFiles = files.filter(f => f.includes('/tests/') || f.includes('/test/'));

  console.log(`   Found ${files.length} files (${srcFiles.length} src, ${testFiles.length} tests)`);

  if (files.length === 0) {
    return { patterns: [], failures: [] };
  }

  // Read first 5 files as samples (to avoid token limits)
  // Prioritize src files, then tests
  const samples = [...srcFiles.slice(0, MAX_SRC_SAMPLES), ...testFiles.slice(0, MAX_TEST_SAMPLES)];

  // Read files in parallel for better performance
  const fileContents = await Promise.all(
    samples.map(async (file) => {
      try {
        // Enforce file size limit
        const stats = await fs.stat(file);
        if (stats.size > MAX_FILE_SIZE) {
          skippedFiles.push({
            file,
            reason: 'Exceeds size limit',
            size: stats.size
          });
          console.warn(`   ⚠️  Skipping ${file}: exceeds size limit (${stats.size} > ${MAX_FILE_SIZE})`);
          return null;
        }

        const content = await fs.readFile(file, 'utf-8');
        return `\n// File: ${file}\n${content}\n`;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        skippedFiles.push({
          file,
          reason: errorMsg
        });
        console.warn(`   ⚠️  Could not read ${file}: ${errorMsg}`);
        return null;
      }
    })
  );

  // Filter out nulls and join
  const combinedCode = fileContents.filter(Boolean).join('');

  if (!combinedCode) {
    return { patterns: [], failures: [] };
  }

  console.log(`   🤖 Analyzing with Claude...`);
  const result = await analyzeCodeWithClaude(combinedCode, layer);
  console.log(`   ✅ Extracted ${result.patterns.length} patterns`);

  return result;
}

async function extractQualityPatterns(
  targetDir: string,
  category: string,
  skippedFiles: SkippedFile[]
): Promise<ExtractionResult> {
  console.log(`\n📊 Analyzing ${category} patterns...`);

  const allFiles = await getAllFiles(targetDir);

  const srcFiles = allFiles.filter(f => f.includes('/src/'));
  const testFiles = allFiles.filter(f => f.includes('/tests/') || f.includes('/test/'));

  console.log(`   Found ${allFiles.length} total files (${srcFiles.length} src, ${testFiles.length} tests)`);

  if (allFiles.length === 0) {
    return { patterns: [], failures: [] };
  }

  // For quality patterns, sample from all code
  // Prefer test files for TDD patterns, src files for others
  let samples: string[];
  if (category === 'tdd') {
    samples = [...testFiles.slice(0, 4), ...srcFiles.slice(0, 1)];
  } else {
    samples = [...srcFiles.slice(0, 4), ...testFiles.slice(0, 1)];
  }

  // Read files in parallel for better performance
  const fileContents = await Promise.all(
    samples.map(async (file) => {
      try {
        // Enforce file size limit
        const stats = await fs.stat(file);
        if (stats.size > MAX_FILE_SIZE) {
          skippedFiles.push({
            file,
            reason: 'Exceeds size limit',
            size: stats.size
          });
          console.warn(`   ⚠️  Skipping ${file}: exceeds size limit (${stats.size} > ${MAX_FILE_SIZE})`);
          return null;
        }

        const content = await fs.readFile(file, 'utf-8');
        return `\n// File: ${file}\n${content}\n`;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        skippedFiles.push({
          file,
          reason: errorMsg
        });
        console.warn(`   ⚠️  Could not read ${file}: ${errorMsg}`);
        return null;
      }
    })
  );

  // Filter out nulls and join
  const combinedCode = fileContents.filter(Boolean).join('');

  if (!combinedCode) {
    return { patterns: [], failures: [] };
  }

  console.log(`   🤖 Analyzing with Claude...`);
  const result = await analyzeCodeWithClaude(combinedCode, category);
  console.log(`   ✅ Extracted ${result.patterns.length} patterns`);

  return result;
}

/**
 * Validates input and output paths for security
 * - Checks for path traversal patterns (..)
 * - Ensures target is within project bounds
 * - Verifies read/write permissions
 * @param targetDir - Directory to analyze
 * @param outputFile - Output YAML file path
 * @throws {Error} If paths are invalid or inaccessible
 */
async function validatePaths(targetDir: string, outputFile: string): Promise<void> {
  // Check for path traversal patterns
  if (targetDir.includes('..') || outputFile.includes('..')) {
    throw new Error('🔒 Security: Path traversal patterns (..) are not allowed');
  }

  // Validate target directory exists and is within project bounds
  const absoluteTarget = path.resolve(targetDir);
  const projectRoot = path.resolve(process.cwd());

  if (!absoluteTarget.startsWith(projectRoot)) {
    throw new Error('🔒 Security: Target directory must be within project root');
  }

  // Check target directory exists and is readable
  try {
    await fs.access(absoluteTarget, fs.constants.R_OK);
  } catch {
    throw new Error(`❌ Error: Target directory not accessible: ${targetDir}`);
  }

  // Check output directory is writable, create if needed
  const outputDir = path.dirname(path.resolve(outputFile));
  try {
    await fs.access(outputDir, fs.constants.W_OK);
  } catch {
    // Try to create it
    await fs.mkdir(outputDir, { recursive: true });
  }
}

/**
 * Main execution function
 * Orchestrates the entire pattern extraction workflow:
 * 1. Validates dependencies and paths
 * 2. Extracts patterns from Clean Architecture layers
 * 3. Extracts quality patterns (TDD, SOLID, etc.)
 * 4. Generates YAML output with metadata
 * 5. Reports results and failures
 */
async function main() {
  const targetDir = process.argv[2] || './src';
  const outputFile = process.argv[3] || '.regent/patterns/auto-generated.yaml';

  console.log('🚀 Clean Architecture Pattern Extractor');
  console.log('');
  console.log('⚠️  SECURITY WARNING: This tool analyzes code and sends it to Claude CLI.');
  console.log('   Only use with TRUSTED codebases. See file header for security details.');
  console.log('');
  console.log(`📁 Target: ${targetDir}`);
  console.log(`💾 Output: ${outputFile}`);

  // Check dependencies
  console.log('\n🔍 Checking dependencies...');
  await checkDependencies();

  // Check Claude CLI version
  const claudeVersion = getClaudeVersion();
  if (claudeVersion) {
    console.log(`✅ Claude CLI detected: ${claudeVersion}`);
  } else {
    console.warn('⚠️  Claude CLI not detected - will use mock patterns');
  }

  // Validate paths
  console.log('🔍 Validating paths...');
  await validatePaths(targetDir, outputFile);

  const layers = ['domain', 'data', 'infra', 'presentation', 'main'];
  const qualityCategories = ['tdd', 'solid', 'dry', 'design_patterns', 'kiss_yagni', 'cross_cutting'];

  const allPatterns: LayerPatterns = {
    domain: [],
    data: [],
    infra: [],
    presentation: [],
    main: [],
    tdd: [],
    solid: [],
    dry: [],
    design_patterns: [],
    kiss_yagni: [],
    cross_cutting: []
  };

  // Track skipped files for summary reporting
  const skippedFiles: SkippedFile[] = [];

  // Create rate limiter to prevent API throttling
  const limit = pLimit(MAX_CONCURRENT_API_CALLS);

  // Extract patterns for each layer (parallel with rate limiting)
  console.log(`\n🏗️  Analyzing Clean Architecture layers (max ${MAX_CONCURRENT_API_CALLS} concurrent)...`);
  const layerResults = await Promise.all(
    layers.map(layer => limit(() => extractPatternsForLayer(targetDir, layer, skippedFiles)))
  );

  // Collect patterns and failures from results
  const allFailures: ExtractionFailure[] = [];
  layerResults.forEach((result, index) => {
    allPatterns[layers[index] as keyof LayerPatterns] = result.patterns;
    allFailures.push(...result.failures);
  });

  // Extract quality patterns from all code (parallel with rate limiting)
  console.log(`\n🎯 Analyzing quality patterns (max ${MAX_CONCURRENT_API_CALLS} concurrent)...`);
  const qualityResults = await Promise.all(
    qualityCategories.map(category => limit(() => extractQualityPatterns(targetDir, category, skippedFiles)))
  );

  qualityResults.forEach((result, index) => {
    allPatterns[qualityCategories[index] as keyof LayerPatterns] = result.patterns;
    allFailures.push(...result.failures);
  });

  // Generate YAML output
  const output = {
    metadata: {
      generated: new Date().toISOString(),
      source: targetDir,
      tool: 'The Regent Pattern Extractor',
      version: '1.0.0'
    },
    patterns: allPatterns
  };

  // Ensure output directory exists (using path.dirname for cross-platform support)
  const outputDir = path.dirname(path.resolve(outputFile));
  await fs.mkdir(outputDir, { recursive: true });

  // Write YAML
  const yamlContent = yaml.stringify(output);
  await fs.writeFile(outputFile, yamlContent, 'utf-8');

  console.log('\n✅ Pattern extraction complete!');
  console.log(`\n📊 Clean Architecture Summary:`);
  console.log(`   Domain: ${allPatterns.domain.length} patterns`);
  console.log(`   Data: ${allPatterns.data.length} patterns`);
  console.log(`   Infra: ${allPatterns.infra.length} patterns`);
  console.log(`   Presentation: ${allPatterns.presentation.length} patterns`);
  console.log(`   Main: ${allPatterns.main.length} patterns`);

  console.log(`\n🎯 Quality Patterns Summary:`);
  console.log(`   TDD: ${allPatterns.tdd.length} patterns`);
  console.log(`   SOLID: ${allPatterns.solid.length} patterns`);
  console.log(`   DRY: ${allPatterns.dry.length} patterns`);
  console.log(`   Design Patterns: ${allPatterns.design_patterns.length} patterns`);
  console.log(`   KISS/YAGNI: ${allPatterns.kiss_yagni.length} patterns`);
  console.log(`   Cross-Cutting: ${allPatterns.cross_cutting.length} patterns`);

  const totalPatterns = Object.values(allPatterns).reduce((sum, patterns) => sum + patterns.length, 0);
  console.log(`\n📈 Total: ${totalPatterns} patterns extracted`);
  console.log(`\n💾 Saved to: ${outputFile}`);

  // Show failures if any
  if (allFailures.length > 0) {
    console.log(`\n⚠️  Failed Extractions: ${allFailures.length}`);
    allFailures.forEach(({ layer, error }) => {
      console.log(`   - ${layer}: ${error}`);
    });
  }

  // Show skipped files summary
  if (skippedFiles.length > 0) {
    console.log(`\n📋 Skipped Files Summary: ${skippedFiles.length} file(s)`);

    // Group by reason
    const byReason = new Map<string, SkippedFile[]>();
    skippedFiles.forEach(sf => {
      const existing = byReason.get(sf.reason) || [];
      existing.push(sf);
      byReason.set(sf.reason, existing);
    });

    byReason.forEach((files, reason) => {
      console.log(`\n   ${reason}: ${files.length} file(s)`);
      files.slice(0, 5).forEach(f => {
        const sizeInfo = f.size ? ` (${(f.size / 1024).toFixed(1)}KB)` : '';
        console.log(`      - ${f.file}${sizeInfo}`);
      });
      if (files.length > 5) {
        console.log(`      ... and ${files.length - 5} more`);
      }
    });
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
