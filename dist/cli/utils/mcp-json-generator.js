/**
 * MCP JSON Generator
 * Creates project-level .mcp.json configuration files
 * Permanent solution for Issue #150
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';
/**
 * Default MCP server configurations
 * These match the recommended setup in docs/setup/mcp-configuration.md
 */
export const DEFAULT_MCP_CONFIG = {
    mcpServers: {
        serena: {
            command: 'uvx',
            args: [
                '--from',
                'git+https://github.com/oraios/serena',
                'serena-mcp-server',
                '--context',
                'ide-assistant'
            ],
            env: {}
        },
        context7: {
            command: 'npx',
            args: [
                '-y',
                '@upstash/context7-mcp@latest'
            ],
            env: {
                CONTEXT7_API_KEY: '${CONTEXT7_API_KEY:-}'
            }
        },
        'chrome-devtools': {
            command: 'npx',
            args: ['chrome-devtools-mcp@latest'],
            env: {}
        },
        playwright: {
            command: 'npx',
            args: ['@playwright/mcp@latest'],
            env: {}
        }
    }
};
/**
 * Check if .mcp.json already exists in the project
 */
export async function mcpJsonExists(projectPath) {
    try {
        const mcpJsonPath = path.join(projectPath, '.mcp.json');
        await fs.access(mcpJsonPath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Read existing .mcp.json file
 */
export async function readMcpJson(projectPath) {
    try {
        const mcpJsonPath = path.join(projectPath, '.mcp.json');
        const content = await fs.readFile(mcpJsonPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Generate .mcp.json file in the project root
 */
export async function generateMcpJson(projectPath, config = DEFAULT_MCP_CONFIG, options = {}) {
    const mcpJsonPath = path.join(projectPath, '.mcp.json');
    // Check if file already exists
    if (!options.force && await mcpJsonExists(projectPath)) {
        console.log(chalk.yellow('⚠️  .mcp.json already exists - skipping generation'));
        console.log(chalk.dim(`   File: ${mcpJsonPath}\n`));
        return;
    }
    // Generate JSON content with proper formatting
    const jsonContent = JSON.stringify(config, null, 2) + '\n';
    // Write to file
    await fs.writeFile(mcpJsonPath, jsonContent, 'utf-8');
    console.log(chalk.green('✅ Created .mcp.json with project-level MCP configuration'));
    console.log(chalk.dim(`   File: ${mcpJsonPath}\n`));
}
/**
 * Create a custom MCP configuration based on user selections
 */
export function createCustomMcpConfig(selections) {
    const config = { mcpServers: {} };
    if (selections.serena) {
        config.mcpServers.serena = DEFAULT_MCP_CONFIG.mcpServers.serena;
    }
    if (selections.context7) {
        config.mcpServers.context7 = DEFAULT_MCP_CONFIG.mcpServers.context7;
    }
    if (selections.chromeDevtools) {
        config.mcpServers['chrome-devtools'] = DEFAULT_MCP_CONFIG.mcpServers['chrome-devtools'];
    }
    if (selections.playwright) {
        config.mcpServers.playwright = DEFAULT_MCP_CONFIG.mcpServers.playwright;
    }
    return config;
}
/**
 * Display information about the generated .mcp.json
 */
export function displayMcpJsonInfo() {
    console.log(chalk.cyan.bold('\n📋 MCP Configuration (.mcp.json)\n'));
    console.log(chalk.white('Project-level MCP configuration provides:'));
    console.log(chalk.dim('  • Automatic MCP availability in all subdirectories'));
    console.log(chalk.dim('  • Shared via git (team-wide consistency)'));
    console.log(chalk.dim('  • No per-developer setup required'));
    console.log(chalk.dim('  • Environment variable support for API keys\n'));
    console.log(chalk.white('Configured servers:'));
    console.log(chalk.dim('  • serena           - Semantic code search and editing'));
    console.log(chalk.dim('  • context7         - Up-to-date library documentation'));
    console.log(chalk.dim('  • chrome-devtools  - Browser automation and debugging'));
    console.log(chalk.dim('  • playwright       - Web testing and automation\n'));
    console.log(chalk.cyan('💡 Next steps:'));
    console.log(chalk.dim('  1. Reload Claude Code to detect .mcp.json'));
    console.log(chalk.dim('  2. Approve MCP servers when prompted (one-time)'));
    console.log(chalk.dim('  3. MCPs will work in all project directories'));
    console.log(chalk.dim('  4. See docs/setup/mcp-configuration.md for details\n'));
}
/**
 * Display prerequisites for using .mcp.json
 */
export function displayPrerequisites() {
    console.log(chalk.yellow.bold('\n⚙️  Prerequisites\n'));
    console.log(chalk.white('Ensure these tools are installed globally:'));
    console.log(chalk.dim('  • Node.js >= 18.0.0  (includes npx)'));
    console.log(chalk.dim('  • uv/uvx             (for serena): pip install uv\n'));
    console.log(chalk.white('Optional:'));
    console.log(chalk.dim('  • Context7 API key   (higher rate limits)'));
    console.log(chalk.dim('    Get at: https://context7.com/dashboard\n'));
}
