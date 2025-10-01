# MCP Servers Not Detected in Subdirectories

> **Issue**: #150 - MCP servers configured in parent directory are not available in subdirectories created by `regent init`

## Problem

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

## ✅ Workaround (Immediate Solution)

### Option 1: Work from Parent Directory (Recommended)

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

## 🔮 Future Solutions (Under Consideration)

### Option A: Project-Level `.mcp.json`

Create `.mcp.json` in project root (committed to git):

```json
{
  "mcpServers": {
    "serena": {
      "command": "serena-mcp-server",
      "args": ["--context", "ide-assistant"]
    },
    "context7": {
      "command": "@context7/mcp-server"
    }
  }
}
```

**Status**: Requires Claude Code support for `.mcp.json` files

### Option B: `regent init` Auto-Configure MCPs

Automatically detect and copy parent MCP configuration when running `regent init`:

```bash
regent init backend
# Automatically creates .mcp.json in backend/ with parent's MCP config
```

**Status**: Feature request for future release

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

**Quick Fix**: Execute commands from the parent directory where MCPs are configured.

**Long-term**: Project-level `.mcp.json` or auto-configuration during `regent init`.

---

**Last Updated**: 2025-10-01
**Status**: Workaround documented, long-term solutions under consideration
