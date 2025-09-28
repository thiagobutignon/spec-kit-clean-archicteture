#!/usr/bin/env npx tsx
/**
 * Emergency script to chunk oversized templates
 * Fixes Issue #94: Templates exceed Claude Code's 25k token limit
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TemplateChunker } from '../packages/cli/src/utils/template-chunker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const CHUNKS_DIR = path.join(__dirname, '..', 'templates', 'chunks');

async function main() {
  console.log('🚨 EMERGENCY TEMPLATE CHUNKING - Issue #94 Fix');
  console.log('================================================\n');

  // Get all .regent template files
  const templates = fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.regent'))
    .map(f => path.join(TEMPLATES_DIR, f));

  console.log(`Found ${templates.length} templates to analyze\n`);

  const oversizedTemplates: string[] = [];

  // Analyze each template
  for (const templatePath of templates) {
    const fileName = path.basename(templatePath);
    console.log(`\n📄 ${fileName}`);
    console.log('─'.repeat(50));

    try {
      const content = fs.readFileSync(templatePath, 'utf-8');
      const estimatedTokens = Math.ceil(content.length / 4); // ~4 chars per token

      console.log(`   Size: ${content.length} chars (~${estimatedTokens} tokens)`);

      if (estimatedTokens > 25000) {
        oversizedTemplates.push(templatePath);
        console.log(`   ❌ EXCEEDS LIMIT - Needs chunking`);

        // Chunk this template
        const outputDir = path.join(CHUNKS_DIR, fileName.replace('.regent', ''));
        const chunked = await TemplateChunker.chunkTemplate(templatePath);
        await TemplateChunker.saveChunks(chunked, outputDir);

        console.log(`   ✅ Chunked into ${chunked.chunks.length} pieces`);
      } else {
        console.log(`   ✅ Within limit`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CHUNKING SUMMARY');
  console.log('='.repeat(60));

  if (oversizedTemplates.length === 0) {
    console.log('✅ All templates are within token limit!');
  } else {
    console.log(`\n⚠️  ${oversizedTemplates.length} templates were chunked:`);
    for (const template of oversizedTemplates) {
      console.log(`   - ${path.basename(template)}`);
    }

    console.log('\n📁 Chunks saved to: templates/chunks/');
    console.log('\n🔧 Next Steps:');
    console.log('1. Update commands to use TemplateChunker.reassembleTemplate()');
    console.log('2. Test that commands can read chunked templates');
    console.log('3. Verify workflow still functions correctly');
  }

  // Create index file for easy access
  const indexPath = path.join(CHUNKS_DIR, 'INDEX.md');
  const indexContent = `# Template Chunks Index

## Overview
This directory contains chunked versions of oversized templates.
Created to fix Issue #94: Templates exceed Claude Code's 25k token limit.

## Chunked Templates
${oversizedTemplates.map(t => {
  const name = path.basename(t);
  return `- **${name}**: chunks/${name.replace('.regent', '')}`;
}).join('\n')}

## Usage
Use \`TemplateChunker.reassembleTemplate()\` to reconstruct full templates from chunks.

Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(indexPath, indexContent);
  console.log('\n📄 Created INDEX.md for chunk directory');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});