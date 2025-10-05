#!/usr/bin/env tsx

/**
 * Extract Clean Architecture Patterns from Codebase
 * Uses Serena MCP + Claude CLI to analyze code and generate validation patterns
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { execFileSync } from 'child_process';

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

async function analyzeCodeWithClaude(code: string, layer: string): Promise<Pattern[]> {
  const truncatedCode = code.substring(0, 10000);
  const prompt = `${SYSTEM_PROMPT}

Analyze this ${layer} layer code and extract validation patterns:

\`\`\`typescript
${truncatedCode} // Truncated for context window
\`\`\`

Extract patterns that would catch violations in similar code.`;

  try {
    // Use execFileSync with array arguments to avoid command injection
    // Note: This requires a claude CLI wrapper that accepts these args
    const result = execFileSync('claude', ['-p', prompt, '--output-format', 'json'], {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    // Parse JSON response from Claude Code
    const response = JSON.parse(result);
    const content = response.result;

    // Strip markdown code blocks if present
    const jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(jsonStr);

    if (!parsed.patterns || !Array.isArray(parsed.patterns)) {
      throw new Error('Invalid response format: missing patterns array');
    }

    return parsed.patterns;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Failed to analyze ${layer} code: ${errorMsg}`);
    if (process.env.DEBUG) {
      console.error('Stack trace:', error);
    }
    return [];
  }
}

async function getFilesFromSerena(targetDir: string, layer: string): Promise<string[]> {
  const allFiles: string[] = [];

  // Search in both src/ and tests/ directories
  const searchDirs = [targetDir, targetDir.replace('/src', '/tests')];

  for (const dir of searchDirs) {
    try {
      const files = await fs.readdir(dir, { recursive: true });
      const layerFiles = files
        .filter(f => f.toString().includes(layer))
        .filter(f => f.toString().endsWith('.ts') || f.toString().endsWith('.tsx'))
        .map(f => `${dir}/${f}`);

      allFiles.push(...layerFiles);
    } catch {
      // Directory doesn't exist, skip silently
      continue;
    }
  }

  if (allFiles.length === 0) {
    console.warn(`   ⚠️  No files found for ${layer} layer in ${searchDirs.join(', ')}`);
  }

  return allFiles;
}

async function getAllFiles(targetDir: string): Promise<string[]> {
  const allFiles: string[] = [];

  // Search in both src/ and tests/ directories
  const searchDirs = [targetDir, targetDir.replace('/src', '/tests')];

  for (const dir of searchDirs) {
    try {
      const files = await fs.readdir(dir, { recursive: true });
      const tsFiles = files
        .filter(f => f.toString().endsWith('.ts') || f.toString().endsWith('.tsx'))
        .filter(f => !f.toString().includes('node_modules'))
        .map(f => `${dir}/${f}`);

      allFiles.push(...tsFiles);
    } catch {
      // Directory doesn't exist, skip silently
      continue;
    }
  }

  return allFiles;
}

async function extractPatternsForLayer(
  targetDir: string,
  layer: string
): Promise<Pattern[]> {
  console.log(`\n📂 Analyzing ${layer} layer...`);

  const files = await getFilesFromSerena(targetDir, layer);

  const srcFiles = files.filter(f => f.includes('/src/'));
  const testFiles = files.filter(f => f.includes('/tests/') || f.includes('/test/'));

  console.log(`   Found ${files.length} files (${srcFiles.length} src, ${testFiles.length} tests)`);

  if (files.length === 0) {
    return [];
  }

  // Read first 5 files as samples (to avoid token limits)
  // Prioritize src files, then tests
  const samples = [...srcFiles.slice(0, 3), ...testFiles.slice(0, 2)];
  let combinedCode = '';

  for (const file of samples) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      combinedCode += `\n// File: ${file}\n${content}\n`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`   ⚠️  Could not read ${file}: ${errorMsg}`);
    }
  }

  if (!combinedCode) {
    return [];
  }

  console.log(`   🤖 Analyzing with Claude...`);
  const patterns = await analyzeCodeWithClaude(combinedCode, layer);
  console.log(`   ✅ Extracted ${patterns.length} patterns`);

  return patterns;
}

async function extractQualityPatterns(
  targetDir: string,
  category: string
): Promise<Pattern[]> {
  console.log(`\n📊 Analyzing ${category} patterns...`);

  const allFiles = await getAllFiles(targetDir);

  const srcFiles = allFiles.filter(f => f.includes('/src/'));
  const testFiles = allFiles.filter(f => f.includes('/tests/') || f.includes('/test/'));

  console.log(`   Found ${allFiles.length} total files (${srcFiles.length} src, ${testFiles.length} tests)`);

  if (allFiles.length === 0) {
    return [];
  }

  // For quality patterns, sample from all code
  // Prefer test files for TDD patterns, src files for others
  let samples: string[];
  if (category === 'tdd') {
    samples = [...testFiles.slice(0, 4), ...srcFiles.slice(0, 1)];
  } else {
    samples = [...srcFiles.slice(0, 4), ...testFiles.slice(0, 1)];
  }

  let combinedCode = '';
  for (const file of samples) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      combinedCode += `\n// File: ${file}\n${content}\n`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`   ⚠️  Could not read ${file}: ${errorMsg}`);
    }
  }

  if (!combinedCode) {
    return [];
  }

  console.log(`   🤖 Analyzing with Claude...`);
  const patterns = await analyzeCodeWithClaude(combinedCode, category);
  console.log(`   ✅ Extracted ${patterns.length} patterns`);

  return patterns;
}

async function validatePaths(targetDir: string, outputFile: string): Promise<void> {
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

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

async function main() {
  const targetDir = process.argv[2] || './src';
  const outputFile = process.argv[3] || '.regent/patterns/auto-generated.yaml';

  console.log('🚀 Clean Architecture Pattern Extractor');
  console.log(`📁 Target: ${targetDir}`);
  console.log(`💾 Output: ${outputFile}`);

  // Validate paths
  console.log('\n🔍 Validating paths...');
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

  // Extract patterns for each layer (parallel for better performance)
  console.log('\n🏗️  Analyzing Clean Architecture layers in parallel...');
  const layerResults = await Promise.all(
    layers.map(layer => extractPatternsForLayer(targetDir, layer))
  );
  layerResults.forEach((patterns, index) => {
    allPatterns[layers[index] as keyof LayerPatterns] = patterns;
  });

  // Extract quality patterns from all code (parallel for better performance)
  console.log('\n🎯 Analyzing quality patterns across codebase in parallel...');
  const qualityResults = await Promise.all(
    qualityCategories.map(category => extractQualityPatterns(targetDir, category))
  );
  qualityResults.forEach((patterns, index) => {
    allPatterns[qualityCategories[index] as keyof LayerPatterns] = patterns;
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
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
