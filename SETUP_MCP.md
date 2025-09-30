# 🔧 MCP Setup Guide - Context7 & Serena

> **Essential MCP (Model Context Protocol) servers for deep code analysis and external library documentation**

## 📋 Prerequisites

- Claude Code v1.0.52 or higher
- Node.js 18+ installed
- API key from Context7 (get it at [context7.com](https://context7.com))

## 🚀 Quick Setup

### Step 1: Install Context7

Context7 provides real-time documentation for external libraries. Choose one of the following methods:

#### Option A: Remote Server Connection (Recommended)
```bash
# Replace YOUR_API_KEY with your actual Context7 API key
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: YOUR_API_KEY"
```

#### Option B: Local Server Connection
```bash
# Replace YOUR_API_KEY with your actual Context7 API key
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
```

### Step 2: Install Serena

Serena provides semantic code search and hierarchical analysis capabilities.

```bash
# From your project root directory
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
```

### Step 3: Verify Installation

Verify MCP servers are installed:
```bash
claude mcp list
```

Expected response should list configured servers like `serena`, `context7`, `chrome-devtools`, and `playwright`.

**Important:** If servers don't appear, restart your Claude Code session to detect newly installed MCP servers.

## 🎯 What Each Server Does

### Context7 - External Library Documentation
- **Purpose**: Real-time documentation for any library
- **Key Features**:
  - Library resolution and version management
  - Code snippets and examples
  - API documentation
  - Best practices from popular libraries
- **GitHub**: [upstash/context7](https://github.com/upstash/context7)

### Serena - Semantic Code Analysis
- **Purpose**: Deep code understanding and navigation
- **Key Features**:
  - Hierarchical symbol analysis
  - Pattern matching across codebase
  - Refactoring with context awareness
  - Memory system for project knowledge
- **GitHub**: [oraios/serena](https://github.com/oraios/serena)

## 📚 Usage Examples

### Using Context7

```bash
# Get documentation for a library
/mcp__context7__resolve-library-id React

# Get specific topic documentation
/mcp__context7__get-library-docs /facebook/react hooks
```

### Using Serena

```bash
# Find a symbol in the codebase
/mcp__serena__find_symbol UserService

# Get overview of a file
/mcp__serena__get_symbols_overview src/domain/user.ts

# Search for a pattern
/mcp__serena__search_for_pattern "interface.*UseCase"
```

## 🔄 Initial Setup for New Conversations

When starting a new conversation or after compacting, ensure Claude reads the initial instructions:

```bash
# For Serena (if needed)
/mcp__serena__initial_instructions

# Check onboarding status
/mcp__serena__check_onboarding_performed
```

## 🛠️ Configuration

### Context7 Configuration

Create a `.env` file in your project root:
```env
CONTEXT7_API_KEY=your_api_key_here
```

### Serena Configuration

Serena uses context-specific configurations. The `ide-assistant` context is optimized for:
- Token-efficient code exploration
- Symbolic navigation
- Avoiding full file reads when possible

## 📊 How It Enhances Spec-Kit Clean Architecture

### 1. Library Pattern Learning (Context7)
```typescript
// Context7 helps understand library patterns
const libraryPatterns = await context7.getLibraryDocs('/vercel/next.js', 'app-router');
// Apply learned patterns to domain generation
```

### 2. Codebase Understanding (Serena)
```typescript
// Serena provides deep codebase analysis
const symbols = await serena.findSymbol('UserRepository');
// Understand existing patterns before generating new code
```

### 3. Combined Power
- **Context7**: Learns from external best practices
- **Serena**: Understands your specific codebase
- **Result**: Domain generation that fits perfectly with both external libraries and internal patterns

## 🚨 Troubleshooting

### MCP Servers Not Detected

**Problem:** After running `regent init` with MCP installation, Claude Code reports "No MCP servers configured"

**Solutions:**
1. **Restart Claude Code session** - New MCP servers require a session restart to be detected
2. **Verify installation manually:**
   ```bash
   claude mcp list
   ```
3. **Check Claude Code version** - Ensure you're running Claude Code v1.0.52 or higher
4. **Re-run installation:**
   ```bash
   cd your-project
   # Install specific server
   claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
   ```

### Context7 Issues

**Error: API key invalid**
```bash
# Re-add with correct API key
claude mcp remove context7
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: YOUR_CORRECT_KEY"
```

**Error: Connection timeout**
- Try the local server option instead of remote
- Check your internet connection
- Verify firewall settings

### Serena Issues

**Error: Project not found**
```bash
# Ensure you're in the project root
cd /path/to/your/project
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
```

**Error: Instructions not loaded**
```bash
# Manually load instructions
/mcp__serena__initial_instructions
```

## 📈 Performance Tips

### Context7 Optimization
- Cache frequently used library docs
- Use specific version pins for consistency
- Limit token usage with focused queries

### Serena Optimization
- Use symbol search instead of full file reads
- Leverage the memory system for repeated queries
- Prefer hierarchical navigation over broad searches

## 🔗 Integration with RLHF System

The MCP servers enhance our RLHF scoring:

1. **Pattern Recognition** (Context7)
   - Learn from successful library implementations
   - Apply proven patterns to achieve +2 scores

2. **Codebase Compliance** (Serena)
   - Ensure new code follows existing patterns
   - Detect architectural violations before execution

3. **Hierarchical Analysis** (Both)
   - Strategic level: Architecture patterns
   - Tactical level: Domain concepts
   - Implementation level: Code syntax

## 📝 Best Practices

1. **Always verify MCP servers are active** before starting domain generation
2. **Use Context7** when integrating with external libraries
3. **Use Serena** when working with existing codebase
4. **Combine both** for maximum effectiveness

## 🔄 Updating MCP Servers

### Update Context7
```bash
claude mcp update context7
```

### Update Serena
```bash
claude mcp remove serena
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)
```

## 📚 Additional Resources

- [Context7 Documentation](https://github.com/upstash/context7)
- [Serena Documentation](https://github.com/oraios/serena)
- [Claude Code MCP Docs](https://docs.anthropic.com/claude-code/mcp)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

## 💡 Pro Tips

1. **Start every session** with MCP verification
2. **Use Context7** for library research before implementation
3. **Use Serena** for brownfield projects to understand existing code
4. **Combine with RLHF** scoring for optimal results

---

<div align="center">
  <strong>MCP servers make Spec-Kit Clean Architecture smarter and more context-aware</strong>
</div>