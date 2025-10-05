#!/usr/bin/env tsx

/**
 * Extract Clean Architecture Patterns from Codebase
 * Uses Serena MCP + Claude CLI to analyze code and generate validation patterns
 */

import * as fs from 'fs/promises';
import * as yaml from 'yaml';
import { execSync } from 'child_process';

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
}

const SYSTEM_PROMPT = `You are a Clean Architecture pattern analyzer.

Given source code files, extract validation patterns that enforce Clean Architecture rules.

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

Focus on:
- Layer dependency violations (domain importing from data/infra)
- Missing interfaces (use cases without contracts)
- External dependencies in wrong layers (axios in domain)
- Architecture patterns (ISP, SRP, DDD)
- Naming conventions

DO NOT include markdown, explanations, or anything except the JSON.`;

async function analyzeCodeWithClaude(code: string, layer: string): Promise<Pattern[]> {
  const prompt = `${SYSTEM_PROMPT}

Analyze this ${layer} layer code and extract validation patterns:

\`\`\`typescript
${code.substring(0, 10000)} // Truncated for context window
\`\`\`

Extract patterns that would catch violations in similar code.`;

  try {
    // Execute claude CLI in headless mode with JSON output
    const result = execSync(`claude -p ${JSON.stringify(prompt)} --output-format json`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB
      shell: '/bin/bash'
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
    return parsed.patterns || [];
  } catch (error) {
    console.error(`Failed to analyze ${layer} code:`, error);
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
    } catch {
      console.warn(`   ⚠️  Could not read ${file}`);
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

async function main() {
  const targetDir = process.argv[2] || './src';
  const outputFile = process.argv[3] || '.regent/patterns/auto-generated.yaml';

  console.log('🚀 Clean Architecture Pattern Extractor');
  console.log(`📁 Target: ${targetDir}`);
  console.log(`💾 Output: ${outputFile}`);

  const layers = ['domain', 'data', 'infra', 'presentation', 'main'];
  const allPatterns: LayerPatterns = {
    domain: [],
    data: [],
    infra: [],
    presentation: [],
    main: []
  };

  // Extract patterns for each layer
  for (const layer of layers) {
    const patterns = await extractPatternsForLayer(targetDir, layer);
    allPatterns[layer as keyof LayerPatterns] = patterns;
  }

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
  console.log(`📊 Summary:`);
  console.log(`   Domain: ${allPatterns.domain.length} patterns`);
  console.log(`   Data: ${allPatterns.data.length} patterns`);
  console.log(`   Infra: ${allPatterns.infra.length} patterns`);
  console.log(`   Presentation: ${allPatterns.presentation.length} patterns`);
  console.log(`   Main: ${allPatterns.main.length} patterns`);
  console.log(`\n💾 Saved to: ${outputFile}`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
