# MCP Servers Not Detected in Subdirectories

> **Issue**: #150 - ✅ SOLVED with project-level `.mcp.json`

## ✅ Permanent Solution (Implemented)

This project now includes a **project-level `.mcp.json` file** that ensures MCP servers work in all subdirectories.

**What changed:**
- Added `.mcp.json` at project root
- Configured all required MCP servers (serena, context7, chrome-devtools, playwright)
- MCPs now work automatically in all subdirectories

**👉 See**: [MCP Configuration Documentation](../setup/mcp-configuration.md) for details

---

## Legacy Problem (Historical Context)

MCP configuration in Claude Code is project-scoped and **does not inherit to subdirectories**. When you run `regent init` in a subdirectory, Claude Code treats it as a separate project without MCP configuration.

### Example

```bash
# Parent directory - MCPs work ✅
cd ~/projects/my-app
/mcp  # Shows: 4 MCPs connected

# Subdirectory created with regent init - MCPs don't work ❌
cd ~/projects/my-app/backend
/mcp  # Shows: No MCP servers configured
```

## Root Cause

Claude Code scopes MCP configuration to specific directories:
- **User config**: `~/.claude.json` (global, all projects)
- **Project config**: `<project-root>/.mcp.json` (shared via git)
- **Local config**: `~/.claude.json [project: <path>]` (project-specific)

When in a subdirectory, Claude Code doesn't inherit the parent's MCP configuration.

## Alternative Solutions (If .mcp.json Doesn't Work)

> **Note**: The solutions below are alternative approaches if the `.mcp.json` configuration doesn't work in your environment. The project-level `.mcp.json` should work for most cases.

### Option 1: Work from Parent Directory

Execute commands from the parent directory where MCPs are configured:

```bash
# Instead of this ❌
cd ~/projects/my-app/backend
/01-plan-layer-features

# Do this ✅
cd ~/projects/my-app
/01-plan-layer-features
```

**Benefits:**
- No additional configuration needed
- MCPs immediately available
- Generated files still go into correct subdirectories

**Example Workflow:**
```bash
cd ~/projects/my-app

# All commands work with MCPs available
/01-plan-layer-features
/02-validate-layer-plan
/03-generate-layer-code

# Files are generated in: my-app/backend/spec/...
# You're executing from: my-app/
# MCPs: Available ✅
```

### Option 2: Configure MCPs Per Subdirectory

If you must work from the subdirectory, reconfigure MCPs locally:

```bash
cd ~/projects/my-app/backend

# Reconfigure each MCP
claude mcp add serena -- serena-mcp-server --context ide-assistant
claude mcp add context7 -- @context7/mcp-server
claude mcp add chrome-devtools -- @modelcontextprotocol/server-chrome-devtools
claude mcp add playwright -- @modelcontextprotocol/server-playwright

# Verify
/mcp  # Should show all MCPs connected
```

**Drawbacks:**
- Duplicate configuration effort
- Must repeat for each subdirectory
- Not shared with team

## ✅ Implemented Solution: Project-Level `.mcp.json`

The project now uses a `.mcp.json` file in the project root (committed to git):

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena-mcp-server", "--context", "ide-assistant"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest", "--api-key", "${CONTEXT7_API_KEY:-}"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Status**: ✅ Implemented and working

**Benefits:**
- MCPs work in all subdirectories
- Shared via version control
- No per-developer configuration needed
- Team-wide consistency

**👉 Full documentation**: [MCP Configuration](../setup/mcp-configuration.md)

## Verification

Check if MCPs are available:

```bash
/mcp
```

**Expected output when working:**
```
Connected MCP Servers:
├─ serena                   ✔ connected
├─ context7                 ✔ connected
├─ chrome-devtools          ✔ connected
└─ playwright               ✔ connected
```

**Expected output when not working:**
```
No MCP servers configured. Please run /doctor if this is unexpected.
```

## Related Issues

- **#150** - Original bug report
- **#108** - MCP installation UX improvements

## Summary

**✅ Permanent Solution**: Project now includes `.mcp.json` at root - MCPs work everywhere.

**Alternative Approaches**: If `.mcp.json` doesn't work, execute from parent directory or reconfigure per subdirectory.

**Documentation**: See [MCP Configuration](../setup/mcp-configuration.md) for complete setup guide.

---

**Last Updated**: 2025-10-01
**Status**: ✅ RESOLVED - Permanent solution implemented with `.mcp.json`
