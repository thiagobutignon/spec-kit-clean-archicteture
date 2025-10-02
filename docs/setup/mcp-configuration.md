# MCP Configuration (.mcp.json)

> **Issue**: #150 - Permanent solution for MCP server configuration across all project directories

## Overview

This project uses a **project-level `.mcp.json` file** to ensure all team members have consistent access to MCP (Model Context Protocol) servers, regardless of which directory they're working from.

## Why Project-Level Configuration?

Before this solution, MCP servers had to be configured per-directory, causing issues when working in subdirectories created by `regent init`. With `.mcp.json` at the project root:

✅ MCPs work in all subdirectories
✅ Configuration is shared via git
✅ No per-developer setup required
✅ Consistent team experience

## Configured MCP Servers

The project includes 4 essential MCP servers:

| Server | Purpose | Package | API Key |
|--------|---------|---------|---------|
| **serena** | Semantic code search and editing | `git+https://github.com/oraios/serena` | Not required |
| **context7** | Up-to-date library documentation | `@upstash/context7-mcp` | Optional* |
| **chrome-devtools** | Browser automation and debugging | `chrome-devtools-mcp` | Not required |
| **playwright** | Web testing and automation | `@playwright/mcp` | Not required |

\* **Context7 API Key (Optional)**: Provides higher rate limits and access to private repositories. Get yours at [context7.com/dashboard](https://context7.com/dashboard)

## Configuration File

The `.mcp.json` file at the project root contains:

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena-mcp-server",
        "--context",
        "ide-assistant"
      ],
      "env": {}
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY:-}"
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"],
      "env": {}
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {}
    }
  }
}
```

## Creating .mcp.json

### Using regent CLI (Recommended)

The `regent` CLI provides an integrated way to create `.mcp.json`:

**During project initialization:**
```bash
# regent init will prompt you to create .mcp.json
regent init my-project

# Choose "Create .mcp.json (project-level)" when prompted
# Select which MCP servers to configure
```

**After project initialization:**
```bash
# Create or update .mcp.json in existing project
cd my-project
regent setup-mcp

# Create with all servers without prompts
regent setup-mcp --all

# Force overwrite existing .mcp.json
regent setup-mcp --force
```

### Manual Creation

You can also create `.mcp.json` manually by copying the template above to your project root.

## How It Works

### 1. First-Time Setup

When you first open the project in Claude Code:

1. Claude Code detects `.mcp.json` at project root
2. Prompts you to approve the MCP servers (security feature)
3. Installs and connects the servers automatically
4. MCPs become available in all project directories

### 2. Environment Variable Support

The configuration supports environment variables for sensitive data:

```json
{
  "mcpServers": {
    "custom-server": {
      "command": "npx",
      "args": ["server-name"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

**Supported syntax:**
- `${VAR}` - Expands to environment variable value
- `${VAR:-default}` - Uses default if VAR is not set

### 3. Verification

Check if MCPs are working:

```bash
# In Claude Code
/mcp
```

**Expected output:**
```
Connected MCP Servers:
├─ serena                   ✔ connected
├─ context7                 ✔ connected
├─ chrome-devtools          ✔ connected
└─ playwright               ✔ connected
```

## Optional: Context7 API Key Setup

Context7 works without an API key but provides **higher rate limits and private repository access** with one.

### Getting Your API Key

1. Visit [context7.com/dashboard](https://context7.com/dashboard)
2. Create an account or sign in
3. Copy your API key from the dashboard

### Setting the API Key

**Option 1: Environment Variable (Recommended)**
```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
export CONTEXT7_API_KEY="your-api-key-here"

# Reload shell or restart terminal
source ~/.zshrc  # or ~/.bashrc
```

**Option 2: Per-Session**
```bash
# Temporary for current session only
export CONTEXT7_API_KEY="your-api-key-here"

# Then open Claude Code
```

**Note**: The `.mcp.json` uses `${CONTEXT7_API_KEY:-}` which means:
- If the environment variable is set → uses your API key
- If not set → works without API key (with rate limits)

### Verification

```bash
# Check if variable is set
echo $CONTEXT7_API_KEY

# Should output your API key or nothing (both are OK)
```

## Prerequisites

The following tools must be installed globally:

### Required Tools

```bash
# uvx (for serena)
pip install uv

# npx (comes with Node.js)
# Verify with:
npx --version
```

**Minimum versions:**
- Node.js >= 18.0.0
- Python >= 3.8 (for uv/uvx)

### Installing Missing Dependencies

If a server fails to connect, install its dependencies:

```bash
# For serena
pip install uv

# For npx-based servers (already installed with Node.js)
# No additional action needed
```

## Troubleshooting

### Issue: "Server failed to start"

**Solution**: Ensure prerequisites are installed
```bash
# Check Node.js
node --version  # Should be >= 18.0.0

# Check uvx
uvx --version  # Should exist

# If missing, install uv:
pip install uv
```

### Issue: "Permission denied"

**Solution**: Approve the MCP servers when prompted by Claude Code

### Issue: "Server not found in subdirectory"

**Solution**:
1. Ensure you're working in a directory under the project root
2. Reload Claude Code window
3. Check `/mcp` to verify connection

### Issue: "Configuration not loading"

**Solution**:
1. Verify `.mcp.json` exists at project root (not in subdirectories)
2. Check JSON syntax with: `npx ajv compile -s .mcp.json`
3. Reload Claude Code window

## Adding New MCP Servers

To add a new MCP server to the project:

### 1. Update `.mcp.json`

```json
{
  "mcpServers": {
    "new-server": {
      "command": "npx",
      "args": ["-y", "package-name@latest"],
      "env": {}
    }
  }
}
```

### 2. Document the Server

Add an entry to the table in this document explaining:
- Server purpose
- Package name
- Any special configuration

### 3. Commit and Push

```bash
git add .mcp.json docs/setup/mcp-configuration.md
git commit -m "feat: add new-server MCP"
git push
```

### 4. Notify Team

All team members need to:
1. Pull the latest changes
2. Reload Claude Code
3. Approve the new server when prompted

## Security Considerations

### Why Approval is Required

Claude Code requires approval for project-scoped MCPs because:
- They execute code from the repository
- They have access to your filesystem
- Malicious configurations could be harmful

**Always review `.mcp.json` changes in PRs before approving!**

### Best Practices

✅ **DO:**
- Keep `.mcp.json` in version control
- Review changes in pull requests
- Use environment variables for secrets
- Document all configured servers

❌ **DON'T:**
- Add API keys directly to `.mcp.json`
- Configure untrusted MCP servers
- Bypass approval prompts without review
- Modify `.mcp.json` without team agreement

## Configuration Hierarchy

When multiple configurations exist, Claude Code prioritizes:

1. **Local scope** (`~/.claude.json [project: <path>]`) - highest priority
2. **Project scope** (`.mcp.json` at project root)
3. **User scope** (`~/.claude.json`) - lowest priority

This means developers can override project MCPs locally if needed.

## Benefits Summary

### For Developers
- ✅ No per-directory MCP configuration
- ✅ Works immediately after git clone
- ✅ Consistent tooling across team
- ✅ Simplified onboarding

### For the Project
- ✅ Reproducible development environment
- ✅ Shared via version control
- ✅ Documentation of required tools
- ✅ Team-wide consistency

## Related Documentation

- [MCP Subdirectory Workaround](../troubleshooting/mcp-subdirectory-workaround.md) - Alternative solutions
- [Claude Code MCP Docs](https://docs.claude.com/en/docs/claude-code/mcp) - Official documentation
- [Issue #150](https://github.com/thiagobutignon/spec-kit-clean-archicteture/issues/150) - Original issue

## Maintenance

### Updating Server Versions

Servers using `@latest` automatically update. To pin versions:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@1.2.3"],
      "env": {}
    }
  }
}
```

### Removing Servers

1. Remove from `.mcp.json`
2. Update this documentation
3. Commit and notify team
4. Team members reload Claude Code

---

**Last Updated**: 2025-10-01
**Status**: ✅ Active - Solves Issue #150 permanently
**Maintainer**: See CONTRIBUTING.md for code owners
