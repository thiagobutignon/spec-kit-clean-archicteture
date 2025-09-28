/**
 * Template Chunker Utility
 * Splits large .regent templates into manageable chunks for Claude Code
 * Addresses Issue #94: Templates exceed 25,000 token limit
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface TemplateChunk {
  id: string;
  section: string;
  content: string;
  lineStart: number;
  lineEnd: number;
  tokens: number; // Estimated tokens
}

export interface ChunkedTemplate {
  originalFile: string;
  totalLines: number;
  totalTokens: number;
  chunks: TemplateChunk[];
}

export class TemplateChunker {
  private static readonly MAX_TOKENS = 20000; // Conservative limit below 25k
  private static readonly AVG_CHARS_PER_TOKEN = 4; // Rough estimate

  /**
   * Split a template file into manageable chunks
   */
  static async chunkTemplate(templatePath: string): Promise<ChunkedTemplate> {
    const content = fs.readFileSync(templatePath, 'utf-8');
    const lines = content.split('\n');

    // Find natural split points (major YAML sections)
    const sections = this.identifySections(lines);

    // Create chunks based on sections
    const chunks: TemplateChunk[] = [];

    for (const section of sections) {
      const sectionContent = lines.slice(section.start, section.end).join('\n');
      const estimatedTokens = Math.ceil(sectionContent.length / this.AVG_CHARS_PER_TOKEN);

      if (estimatedTokens <= this.MAX_TOKENS) {
        // Section fits in one chunk
        chunks.push({
          id: `${path.basename(templatePath)}-${section.name}`,
          section: section.name,
          content: sectionContent,
          lineStart: section.start + 1,
          lineEnd: section.end,
          tokens: estimatedTokens
        });
      } else {
        // Section too large, needs sub-chunking
        const subChunks = this.splitLargeSection(
          section.name,
          lines.slice(section.start, section.end),
          section.start,
          path.basename(templatePath)
        );
        chunks.push(...subChunks);
      }
    }

    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);

    return {
      originalFile: templatePath,
      totalLines: lines.length,
      totalTokens,
      chunks
    };
  }

  /**
   * Identify major sections in the template
   */
  private static identifySections(lines: string[]): Array<{name: string, start: number, end: number}> {
    const sections: Array<{name: string, start: number, end: number}> = [];
    let currentSection: {name: string, start: number} | null = null;

    // Common section markers in .regent templates
    const sectionMarkers = [
      /^# --- From: .* ---$/,  // Part file markers
      /^metadata:$/,
      /^structure:$/,
      /^architecture:$/,
      /^rules:$/,
      /^steps:$/,
      /^domain_steps:$/,
      /^data_steps:$/,
      /^infra_steps:$/,
      /^presentation_steps:$/,
      /^validation_steps:$/,
      /^main_steps:$/
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      for (const marker of sectionMarkers) {
        if (marker.test(line)) {
          // End previous section
          if (currentSection) {
            sections.push({
              name: currentSection.name,
              start: currentSection.start,
              end: i
            });
          }

          // Start new section
          const sectionName = line.replace(/^# --- From: /, '').replace(/ ---$/, '').replace(':', '');
          currentSection = {
            name: sectionName,
            start: i
          };
          break;
        }
      }
    }

    // Close last section
    if (currentSection) {
      sections.push({
        name: currentSection.name,
        start: currentSection.start,
        end: lines.length
      });
    }

    // If no sections found, treat entire file as one section
    if (sections.length === 0) {
      sections.push({
        name: 'full',
        start: 0,
        end: lines.length
      });
    }

    return sections;
  }

  /**
   * Split a large section into smaller chunks
   */
  private static splitLargeSection(
    sectionName: string,
    lines: string[],
    startOffset: number,
    fileName: string
  ): TemplateChunk[] {
    const chunks: TemplateChunk[] = [];
    const maxLinesPerChunk = Math.floor(this.MAX_TOKENS * this.AVG_CHARS_PER_TOKEN / 80); // Avg 80 chars per line

    for (let i = 0; i < lines.length; i += maxLinesPerChunk) {
      const chunkLines = lines.slice(i, Math.min(i + maxLinesPerChunk, lines.length));
      const content = chunkLines.join('\n');
      const partNumber = Math.floor(i / maxLinesPerChunk) + 1;

      chunks.push({
        id: `${fileName}-${sectionName}-part${partNumber}`,
        section: `${sectionName} (part ${partNumber})`,
        content,
        lineStart: startOffset + i + 1,
        lineEnd: startOffset + i + chunkLines.length,
        tokens: Math.ceil(content.length / this.AVG_CHARS_PER_TOKEN)
      });
    }

    return chunks;
  }

  /**
   * Save chunks to separate files
   */
  static async saveChunks(chunkedTemplate: ChunkedTemplate, outputDir: string): Promise<void> {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save metadata
    const metadata = {
      originalFile: chunkedTemplate.originalFile,
      totalLines: chunkedTemplate.totalLines,
      totalTokens: chunkedTemplate.totalTokens,
      chunks: chunkedTemplate.chunks.map(c => ({
        id: c.id,
        section: c.section,
        lineStart: c.lineStart,
        lineEnd: c.lineEnd,
        tokens: c.tokens,
        file: `${c.id.replace(/[\/\\:]/g, '-')}.chunk.regent`
      }))
    };

    fs.writeFileSync(
      path.join(outputDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Save each chunk
    for (const chunk of chunkedTemplate.chunks) {
      // Sanitize chunk ID to be filesystem safe
      const safeId = chunk.id.replace(/[\/\\:]/g, '-');
      const chunkPath = path.join(outputDir, `${safeId}.chunk.regent`);

      // Add header to each chunk
      const chunkContent = `# CHUNK: ${chunk.section}
# Lines: ${chunk.lineStart}-${chunk.lineEnd}
# Estimated tokens: ${chunk.tokens}
# Original: ${path.basename(chunkedTemplate.originalFile)}
# =============================================

${chunk.content}`;

      fs.writeFileSync(chunkPath, chunkContent);
    }

    console.log(`✅ Saved ${chunkedTemplate.chunks.length} chunks to ${outputDir}`);
  }

  /**
   * Reassemble chunks into original template
   */
  static async reassembleTemplate(chunksDir: string): Promise<string> {
    const metadataPath = path.join(chunksDir, 'metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    const content: string[] = [];

    for (const chunkInfo of metadata.chunks) {
      const chunkPath = path.join(chunksDir, chunkInfo.file);
      const chunkContent = fs.readFileSync(chunkPath, 'utf-8');

      // Remove chunk header (first 6 lines)
      const lines = chunkContent.split('\n');
      const actualContent = lines.slice(6).join('\n');

      content.push(actualContent);
    }

    return content.join('');
  }
}

/**
 * CLI utility to chunk a template
 */
export async function chunkTemplateCLI(templatePath: string, outputDir?: string): Promise<void> {
  try {
    console.log(`🔍 Analyzing template: ${templatePath}`);

    const chunked = await TemplateChunker.chunkTemplate(templatePath);

    console.log(`📊 Template Analysis:`);
    console.log(`   Total lines: ${chunked.totalLines}`);
    console.log(`   Estimated tokens: ${chunked.totalTokens}`);
    console.log(`   Chunks needed: ${chunked.chunks.length}`);

    if (outputDir) {
      await TemplateChunker.saveChunks(chunked, outputDir);
    }

    // Display chunk summary
    console.log('\n📦 Chunks:');
    for (const chunk of chunked.chunks) {
      console.log(`   - ${chunk.section}: ${chunk.tokens} tokens (lines ${chunk.lineStart}-${chunk.lineEnd})`);
    }

    // Check if all chunks are within limit
    const oversizedChunks = chunked.chunks.filter(c => c.tokens > 25000);
    if (oversizedChunks.length > 0) {
      console.error('\n❌ WARNING: Some chunks still exceed token limit:');
      for (const chunk of oversizedChunks) {
        console.error(`   - ${chunk.section}: ${chunk.tokens} tokens`);
      }
    } else {
      console.log('\n✅ All chunks are within token limit!');
    }

  } catch (error) {
    console.error('❌ Error chunking template:', error);
    process.exit(1);
  }
}