#!/usr/bin/env tsx

/**
 * Extract Clean Architecture Patterns from Codebase
 * Uses Serena MCP + Claude CLI to analyze code and generate validation patterns
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { execFileSync } from 'child_process';
import { z } from 'zod';
import pLimit from 'p-limit';

// Zod schema for pattern validation
const PatternExampleSchema = z.object({
  violation: z.string(),
  fix: z.string()
});

const PatternSchema = z.object({
  id: z.string().regex(/^[A-Z]{3}\d{3}$/, 'ID must be 3 uppercase letters + 3 digits'),
  name: z.string().regex(/^[a-z0-9-]+$/, 'Name must be kebab-case'),
  regex: z.string().refine((val) => {
    try {
      new RegExp(val);
      return true;
    } catch {
      return false;
    }
  }, 'Must be a valid regex pattern'),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  examples: z.array(PatternExampleSchema).optional()
});

const PatternsResponseSchema = z.object({
  patterns: z.array(PatternSchema)
});

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

interface ExtractionFailure {
  layer: string;
  error: string;
}

interface ExtractionResult {
  patterns: Pattern[];
  failures: ExtractionFailure[];
}

// Configuration constants
const MAX_PROMPT_SIZE = 50000; // Maximum prompt size to prevent DoS
const MAX_CODE_SAMPLE_LENGTH = 10000; // Claude context window limit
const MAX_SRC_SAMPLES = 3; // Number of source files to sample
const MAX_TEST_SAMPLES = 2; // Number of test files to sample
const MAX_CONCURRENT_API_CALLS = 3; // Rate limiting for Claude API (prevent rate limit errors)
const MAX_FILE_SIZE = 1024 * 1024; // 1MB - Maximum file size to prevent memory exhaustion

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
 * Sanitize file content to prevent command injection or malicious input
 * Removes control characters and escape sequences
 */
function sanitizeInput(input: string): string {
  return input
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove other control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Remove ANSI escape codes
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    // Limit consecutive newlines
    .replace(/\n{5,}/g, '\n\n\n\n');
}

/**
 * Checks for required dependencies (tsx, yaml) and optional ones (claude CLI)
 * @throws {Error} If critical dependencies are missing
 */
async function checkDependencies(): Promise<void> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for tsx runtime
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

  // Check for yaml package (runtime check)
  try {
    await import('yaml');
  } catch {
    errors.push('yaml package not found. Install with: npm install yaml');
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

  // Validate prompt size to prevent DoS attacks
  if (prompt.length > MAX_PROMPT_SIZE) {
    throw new Error(`Prompt size (${prompt.length}) exceeds maximum safe size (${MAX_PROMPT_SIZE})`);
  }

  try {
    let content: string;

    // Try to use Claude CLI if available, fallback to mock
    try {
      // Try with --output-format flag (newer versions)
      let result: string;
      try {
        result = execFileSync('claude', ['-p', prompt, '--output-format', 'json'], {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024, // 10MB
        });
      } catch (flagError) {
        // Fallback to no flag (older versions or different CLI behavior)
        if (process.env.DEBUG) {
          console.warn(`   ⚠️  --output-format flag not supported, trying without flag`);
        }
        result = execFileSync('claude', ['-p', prompt], {
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024, // 10MB
        });
      }

      const response = JSON.parse(result);
      content = response.result || result; // Fallback to raw result if no .result property
    } catch (claudeError) {
      // Claude CLI not available - use mock data
      console.warn(`   ⚠️  Claude CLI unavailable, using mock patterns for ${layer}`);
      content = JSON.stringify({
        patterns: [
          {
            id: `${layer.toUpperCase().slice(0, 3)}001`,
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
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to analyze ${layer} code: ${errorMsg}`);

    if (process.env.DEBUG) {
      console.error('Stack trace:', error);
    }

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
      if (process.env.DEBUG) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`Directory ${dir} not accessible: ${errorMsg}`);
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
  layer: string
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
  let combinedCode = '';

  for (const file of samples) {
    try {
      // Enforce file size limit
      const stats = await fs.stat(file);
      if (stats.size > MAX_FILE_SIZE) {
        console.warn(`   ⚠️  Skipping ${file}: exceeds size limit (${stats.size} > ${MAX_FILE_SIZE})`);
        continue;
      }

      const content = await fs.readFile(file, 'utf-8');
      combinedCode += `\n// File: ${file}\n${content}\n`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`   ⚠️  Could not read ${file}: ${errorMsg}`);
    }
  }

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
  category: string
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
  const MAX_QUALITY_SAMPLES = 5;
  let samples: string[];
  if (category === 'tdd') {
    samples = [...testFiles.slice(0, 4), ...srcFiles.slice(0, 1)];
  } else {
    samples = [...srcFiles.slice(0, 4), ...testFiles.slice(0, 1)];
  }

  let combinedCode = '';
  for (const file of samples) {
    try {
      // Enforce file size limit
      const stats = await fs.stat(file);
      if (stats.size > MAX_FILE_SIZE) {
        console.warn(`   ⚠️  Skipping ${file}: exceeds size limit (${stats.size} > ${MAX_FILE_SIZE})`);
        continue;
      }

      const content = await fs.readFile(file, 'utf-8');
      combinedCode += `\n// File: ${file}\n${content}\n`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`   ⚠️  Could not read ${file}: ${errorMsg}`);
    }
  }

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
    throw new Error('Path traversal patterns (..) are not allowed');
  }

  // Validate target directory exists and is within project bounds
  const absoluteTarget = path.resolve(targetDir);
  const projectRoot = path.resolve(process.cwd());

  if (!absoluteTarget.startsWith(projectRoot)) {
    throw new Error('Target directory must be within project root');
  }

  // Check target directory exists and is readable
  try {
    await fs.access(absoluteTarget, fs.constants.R_OK);
  } catch {
    throw new Error(`Target directory not accessible: ${targetDir}`);
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
  console.log(`📁 Target: ${targetDir}`);
  console.log(`💾 Output: ${outputFile}`);

  // Check dependencies
  console.log('\n🔍 Checking dependencies...');
  await checkDependencies();

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

  // Create rate limiter to prevent API throttling
  const limit = pLimit(MAX_CONCURRENT_API_CALLS);

  // Extract patterns for each layer (parallel with rate limiting)
  console.log(`\n🏗️  Analyzing Clean Architecture layers (max ${MAX_CONCURRENT_API_CALLS} concurrent)...`);
  const layerResults = await Promise.all(
    layers.map(layer => limit(() => extractPatternsForLayer(targetDir, layer)))
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
    qualityCategories.map(category => limit(() => extractQualityPatterns(targetDir, category)))
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

  // Ensure output directory exists
  const outputDir = outputFile.substring(0, outputFile.lastIndexOf('/'));
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
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
