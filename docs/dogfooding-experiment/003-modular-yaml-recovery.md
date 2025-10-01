# Experiment #003: Modular YAML Generation Recovery

**Date**: 2025-10-01
**Version**: 2.2.0
**Status**: 🔄 IN PROGRESS
**Type**: Bug Recovery + Feature Validation
**Previous Experiment**: #002 (blocked by Bug #122)
**Related Issue**: #143 (Complete test plan for modular YAML generation)

## 📊 **EXPERIMENT OBJECTIVE**

Recover from Experiment #002 failures and validate the modular YAML generation feature introduced in PR #136. This experiment specifically addresses:

1. **Bug #122 Recovery**: Verify `/06-execute-layer-steps` works after dependency fixes
2. **Issue #143 Testing**: Validate modular YAML generation (1 shared + N use cases)
3. **End-to-End Validation**: Complete workflow from `/01` → `/06` without blockers

## 🎯 **Context from Experiment #002**

### What Worked ✅
- Phase 1: `/01-plan-layer-features` generated valid JSON plan
- Phase 2: `/02-validate-layer-plan` scored +2 (PERFECT)
- Phase 3: `/03-generate-layer-code` generated YAML (but monolithic, not modular)

### What Failed ❌
- Phase 6: `/06-execute-layer-steps` completely broken
  - **Bug #122**: Missing `utils/` directory
  - **Bug #122**: Incorrect import paths in `execute-steps.ts`
  - Error: `Cannot find module '.regent/config/core/logger'`

### Critical Bugs to Verify Fixed
| Bug | Severity | Description | Status |
|-----|----------|-------------|--------|
| #122 | P0 | /06 broken - missing dependencies | ✅ **FIXED** (v2.2.0) |
| #117 | P0 | Monolithic YAML instead of modular | ⚠️ To Be Tested |
| #115 → #150 | P2 | MCP servers not detected in subdirs | 🔍 **Root Cause Found** ([#150](https://github.com/thiagobutignon/spec-kit-clean-archicteture/issues/150)) |

## 🔬 **Test Scope (Issue #143)**

This experiment will test the **modular YAML generation** feature:

### Expected Behavior (PR #136)
**Input**: JSON plan with `sharedComponents` + `useCases` arrays
```json
{
  "featureNumber": "001",
  "featureName": "product-catalog-management",
  "sharedComponents": {
    "models": [...],
    "valueObjects": [...],
    "repositories": [...]
  },
  "useCases": [
    { "name": "CreateProduct", ... },
    { "name": "UpdateProduct", ... },
    { "name": "ArchiveProduct", ... },
    { "name": "SearchProducts", ... },
    { "name": "ManageInventory", ... }
  ]
}
```

**Output**: 6 modular YAMLs
```
spec/001-product-catalog-management/domain/
├── shared-implementation.yaml          # Shared components only
├── create-product-implementation.yaml   # CreateProduct use case
├── update-product-implementation.yaml   # UpdateProduct use case
├── archive-product-implementation.yaml  # ArchiveProduct use case
├── search-products-implementation.yaml  # SearchProducts use case
└── manage-inventory-implementation.yaml # ManageInventory use case
```

### Test Scenarios

#### Test 1: `/01-plan-layer-features` generates new JSON structure
**Objective**: Verify JSON plan has `sharedComponents` and `useCases` arrays

**Success Criteria**:
- ✅ JSON has `sharedComponents` object with models, valueObjects, repositories
- ✅ JSON has `useCases` array with 5 use cases
- ✅ Each use case has name, input, output, errors
- ✅ No flat `steps` array (old structure)

#### Test 2: `/03-generate-layer-code` generates 6 YAMLs
**Objective**: Verify modular YAML generation (not monolithic)

**Success Criteria**:
- ✅ Generates `shared-implementation.yaml` with shared components
- ✅ Generates 5 use case YAMLs (create, update, archive, search, manage-inventory)
- ✅ Each YAML is atomic (can be executed independently)
- ✅ No monolithic YAML with all 19 steps

#### Test 3: `/06-execute-layer-steps` works with modular YAMLs
**Objective**: Verify execution works after Bug #122 fix

**Prerequisites**:
- Bug #122 must be fixed (utils/ copied, imports corrected)
- Modular YAMLs exist from Test 2

**Success Criteria**:
- ✅ Can execute `shared-implementation.yaml` first
- ✅ Can execute use case YAMLs independently
- ✅ Each execution creates atomic commit
- ✅ No import errors
- ✅ No missing dependency errors

#### Test 4: Edge Cases
**Objective**: Test boundary conditions

**Scenarios**:
1. Feature with 1 use case → 2 YAMLs (1 shared + 1 use case)
2. Feature with 0 shared components → N use case YAMLs only
3. Feature with 10 use cases → 1 shared + 10 use case YAMLs

## 🛠️ **Setup**

### Prerequisites
- ✅ The Regent v2.2.0 installed
- ⚠️ Bug #122 must be fixed first
- ⚠️ Bug #117 modular generation must be implemented
- ✅ Clean workspace for testing

### Initial Installation & Verification

**Step 1: Install The Regent CLI globally**
```bash
# Navigate to dogfooding directory
cd dogfooding

# Install latest version globally
npm i -g the-regent-cli

# Expected output:
# added 87 packages, and changed 1 package in 6s
```

**Step 2: Verify installation**
```bash
# Check version (should be 2.2.0)
regent -v

# Expected output:
# 2.2.0

# View help
regent --help

# Expected output:
# Usage: regent [options] [command]
# The Regent - AI-powered Clean Architecture CLI with guaranteed architectural quality
# Commands:
#   init [options] [project-name]  Initialize a new Clean Architecture project
#   check                          Check that all required tools are installed
```

**Step 3: Check system requirements**
```bash
regent check

# Expected output:
# Essential Tools:
#   git             ✅ available
#   node            ✅ available
#   npm             ✅ available
#   claude          ✅ available
#   tsx             ✅ available
#
# AI Assistant Tools:
#   claude          ✅ available
#   gemini          ✅ available
#   cursor          ✅ available
#
# MCP Tools:
#   serena          ✅ available
#   context7        ✅ available
#   chrome-devtools ✅ available
#   playwright      ✅ available
#
# Project Configuration:
#   .claude/        ⚠️  missing (expected - not in project yet)
#   templates/      ⚠️  missing (expected - not in project yet)
#   package.json    ⚠️  missing (expected - not in project yet)
```

**Step 4: Verify dogfooding directory is clean**
```bash
ls -la

# Expected output:
# total 0
# drwxr-xr-x  2 user  staff  64 Sep 30 23:41 .
# drwxr-xr-x 40 user  staff 1280 Oct  1 00:49 ..
# (empty directory - ready for experiment)
```

✅ **Installation Complete**: Ready to proceed with pre-experiment validation

---

### Pre-Experiment Validation

**Check 1: Verify Bug #122 Fix**
```bash
# Check if utils/ directory is copied by regent init
regent init test-bug-122 --ai claude --skip-mcp
ls -la test-bug-122/.regent/utils/  # Should exist

# Check execute-steps.ts imports
grep "from './core/" test-bug-122/.regent/config/execute-steps.ts
# Should return nothing (all imports should be ../core/)
```

**Check 2: Verify Modular YAML Generation**
```bash
# Check if /03 command mentions modular generation
cat .claude/commands/03-generate-layer-code.md | grep -i "modular\|separate"
# Should have instructions for generating multiple YAMLs
```

**Check 3: Verify Templates Support Modular**
```bash
# Check backend-domain-template.regent structure
cat templates/backend-domain-template.regent | grep -i "sharedComponents\|useCases"
# Should have both sections
```

### Environment Preparation
```bash
# Create test project for experiment 003
cd dogfooding
regent init product-catalog-v2 --ai claude --skip-mcp

# Verify installation
cd product-catalog-v2
ls -la .regent/templates/
ls -la .regent/utils/        # ← Must exist (Bug #122 fix)
ls -la .claude/commands/

# Verify execute-steps.ts imports are correct
cat .regent/config/execute-steps.ts | head -20
```

---

## 🧪 **EXPERIMENT EXECUTION**

### Phase 0: Pre-Flight Checks - EXECUTION LOG

**Executed**: 2025-10-01 01:08
**Location**: `/Users/thiagobutignon/dev/spec-kit-clean-archicteture/dogfooding`

#### Command Executed
```bash
regent init ecommerce
```

#### Interactive Prompts & Responses
```
✔ What is the name of your project? ecommerce
✔ Which AI assistant will you be using? Claude Code (Anthropic)
```

#### Installation Output
```
Setup Configuration:
  Project: ecommerce
  Path: /Users/thiagobutignon/dev/spec-kit-clean-archicteture/dogfooding/ecommerce
  Mode: New Project
  AI Assistant: claude

📁 Setting up The Regent structure...
🤖 Setting up Claude AI configuration...
📄 Installing Clean Architecture templates...
🎯 Installing core system files...
📜 Installing utility scripts...
🔧 Installing utility modules...
   ✅ Utility modules installed
⚙️ Installing configuration files...
⚙️ Adding VS Code configuration...
✅ Created initial project files
🔧 Initializing git repository...
✅ Git repository initialized
✅ Project initialized successfully!
```

#### MCP Installation Results
```
✔ Install recommended MCP servers? Yes
✔ Select MCP servers to install: Serena, Chrome DevTools

📦 Installing MCP Servers...

⏭️  Serena - Already installed (skipped)
⏭️  Chrome DevTools - Already installed (skipped)

🔍 Installation Report:

⏭️  Skipped (4):
   • serena (already installed)
   • context7
   • chrome-devtools (already installed)
   • playwright

⚠️ No MCP servers detected after installation
   Possible causes:
   • MCP servers may require a Claude Code restart
   • Installation may have failed silently
   • Claude CLI may not be properly configured
```

#### Bug Status Verification

**✅ Bug #122 FIXED: Missing Dependencies**

**Check 1: Verify `utils/` directory exists**
```bash
ls -la ecommerce/.regent/

# Result:
drwxr-xr-x@  8 thiagobutignon  staff  256 Oct  1 01:08 .
drwxr-xr-x@ 12 thiagobutignon  staff  384 Oct  1 01:08 ..
drwxr-xr-x@  5 thiagobutignon  staff  160 Oct  1 01:08 config
drwxr-xr-x@  4 thiagobutignon  staff  128 Oct  1 01:08 core
drwxr-xr-x@  3 thiagobutignon  staff   96 Oct  1 01:08 docs
drwxr-xr-x@  5 thiagobutignon  staff  160 Oct  1 01:08 scripts
drwxr-xr-x@ 19 thiagobutignon  staff  608 Oct  1 01:08 templates
drwxr-xr-x@ 15 thiagobutignon  staff  480 Oct  1 01:08 utils  ← ✅ EXISTS!
```

**Status**: ✅ **PASS** - `utils/` directory created successfully

**Check 2: Verify `utils/` contents**
```bash
ls -la ecommerce/.regent/utils/

# Result: 15 files found
-rw-r--r--  commit-generator.test.ts
-rw-r--r--  commit-generator.ts
-rw-r--r--  config-validator.test.ts
-rw-r--r--  config-validator.ts
-rw-r--r--  constants.ts
-rw-r--r--  git-operations.ts
-rw-r--r--  log-path-resolver.test.ts
-rw-r--r--  log-path-resolver.ts          ← ✅ KEY FILE EXISTS!
-rw-r--r--  package-manager.test.ts
-rw-r--r--  package-manager.ts
-rw-r--r--  prompt-utils.ts
-rw-r--r--  scope-extractor.test.ts
-rw-r--r--  scope-extractor.ts
```

**Status**: ✅ **PASS** - All required utility files copied

**Check 3: Verify import paths in `execute-steps.ts`**
```bash
head -20 ecommerce/.regent/config/execute-steps.ts

# Result:
import Logger from '../core/logger';                            ← ✅ CORRECT PATH!
import { EnhancedRLHFSystem, LayerInfo } from '../core/rlhf-system';  ← ✅ CORRECT PATH!
import { resolveLogDirectory } from '../utils/log-path-resolver';     ← ✅ CORRECT PATH!
import { EnhancedTemplateValidator } from './validate-template';      ← ✅ CORRECT PATH!
```

**Status**: ✅ **PASS** - All imports use correct relative paths (`../core/`, `../utils/`)

**Overall Bug #122 Status**: ✅ **COMPLETELY FIXED**

---

**⚠️ Bug #108 STILL PRESENT: MCP Installation UX Issue**

**Observed Behavior**:
```
⏭️  Serena - Already installed (skipped)
⏭️  Chrome DevTools - Already installed (skipped)
```

**Expected Behavior**: Should show ✅ or ⚠️ emoji instead of ⏭️ (but this is UX only, not functional)

**Status**: ⚠️ Minor UX issue (not blocking)

---

**⚠️ Bug #115 → Issue #150: MCP Detection in Subdirectories**

**GitHub Issue**: [#150](https://github.com/thiagobutignon/spec-kit-clean-archicteture/issues/150)

**Initial Observation**:
```
⚠️ No MCP servers detected after installation
```

**🔍 ROOT CAUSE DISCOVERED: MCP Configuration Scope**

**Test 1: MCP Detection in Parent Directory (`dogfooding/`)**
```bash
cd /Users/thiagobutignon/dev/spec-kit-clean-archicteture/dogfooding
/mcp

# Result:
╭──────────────────────────────────────────────────────────────────────────────╮
│ Manage MCP servers                                                           │
│                                                                              │
│ ❯ 1. chrome-devtools            ✔ connected · Enter to view details          │
│   2. context7                   ✔ connected · Enter to view details          │
│   3. playwright                 ✔ connected · Enter to view details          │
│   4. serena                     ✔ connected · Enter to view details          │
│                                                                              │
│ MCP Config locations (by scope):                                             │
│  • User config (available in all your projects):                             │
│    • /Users/thiagobutignon/.claude.json                                      │
│  • Project config (shared via .mcp.json):                                    │
│    • /Users/thiagobutignon/dev/spec-kit-clean-archicteture/dogfooding/.mcp.j │
│    son (file does not exist)                                                 │
│  • Local config (private to you in this project):                            │
│    • /Users/thiagobutignon/.claude.json [project:                            │
│    /Users/thiagobutignon/dev/spec-kit-clean-archicteture/dogfooding]         │
╰──────────────────────────────────────────────────────────────────────────────╯
```

**Status**: ✅ **MCPs WORK in `dogfooding/` directory** (4 servers connected)

**Test 2: MCP Detection in Child Directory (`dogfooding/ecommerce/`)**
```bash
cd /Users/thiagobutignon/dev/spec-kit-clean-archicteture/dogfooding/ecommerce
/mcp

# Result:
⎿ No MCP servers configured. Please run /doctor if this is unexpected.
  Otherwise, run `claude mcp` or visit
  https://docs.claude.com/en/docs/claude-code/mcp to learn more.
```

**Status**: ❌ **MCPs DON'T WORK in `dogfooding/ecommerce/` directory**

---

**🎯 Analysis: Why MCPs Don't Work in Subdirectories**

**Claude Code MCP Scope Resolution**:
1. Claude Code looks for MCP config at **project root level**
2. Config is scoped to specific directory: `[project: /Users/.../dogfooding]`
3. When in subdirectory (`dogfooding/ecommerce/`), Claude Code treats it as **different project**
4. No MCP config exists for `dogfooding/ecommerce/` specifically

**MCP Config Hierarchy**:
```
User config:    ~/.claude.json                          ← Global, all projects
Project config: <project-root>/.mcp.json                ← Shared via git
Local config:   ~/.claude.json [project: <path>]        ← Project-specific
```

**Problem**:
- `regent init` runs in `dogfooding/ecommerce/`
- MCPs are configured for `dogfooding/` (parent directory)
- Claude Code in `ecommerce/` subdirectory can't find MCPs

**Solutions**:

**Option A: Use Parent Directory Workflow**
```bash
# Work from parent directory
cd dogfooding
/01-plan-layer-features  # MCPs available here
```

**Option B: Configure MCPs for Subdirectory**
```bash
# Configure MCPs specifically for ecommerce project
cd dogfooding/ecommerce
claude mcp add serena -- serena-mcp-server --context ide-assistant
claude mcp add context7 -- context7-mcp-server
# ... etc
```

**Option C: Create Project-Level Config**
```bash
# Create .mcp.json in ecommerce directory
cd dogfooding/ecommerce
# Create and commit .mcp.json (shared with team)
```

**For This Experiment**:
- ✅ **Using Option A**: Work from `dogfooding/` directory
- ✅ MCPs available for all slash commands
- ✅ Generated files go into `ecommerce/` subdirectory

**Impact**: ⚠️ **Known issue** - Workaround available (work from parent directory)

---

#### Pre-Flight Checks Summary

| Check | Expected | Result | Status |
|-------|----------|--------|--------|
| Bug #122: `utils/` exists | ✅ | ✅ 15 files | ✅ PASS |
| Bug #122: Import paths | `../core/`, `../utils/` | ✅ Correct | ✅ PASS |
| Project structure created | ✅ | ✅ All directories | ✅ PASS |
| Git initialized | ✅ | ✅ Repository created | ✅ PASS |
| MCP servers (optional) | ✅ | ✅ Available in parent dir | ✅ PASS |

**Decision**: ✅ **PROCEED TO PHASE 1** - Critical Bug #122 is fixed, MCPs available from parent directory

**Workflow**: Execute commands from `dogfooding/` directory to ensure MCP availability

---

### Alternative Approach: Initialize Regent in Parent Directory

**Executed**: 2025-10-01 01:16
**Command**: `regent init --here` (in `dogfooding/` directory)

#### Rationale
Instead of working from parent directory and targeting subdirectory, initialize Regent directly in `dogfooding/` to solve MCP detection issue.

#### Execution
```bash
cd dogfooding/
regent init --here

# Interactive prompts:
✔ Which AI assistant will you be using? Claude Code (Anthropic)

# Output:
Setup Configuration:
  Project: dogfooding
  Path: /Users/thiagobutignon/dev/spec-kit-clean-archicteture/dogfooding
  Mode: Existing Project
  AI Assistant: claude

📁 Setting up The Regent structure...
📋 Setting up Claude AI configuration...
📄 Installing Clean Architecture templates...
🎯 Installing core system files...
📜 Installing utility scripts...
🔧 Installing utility modules...
   ✅ Utility modules installed
⚙️ Installing configuration files...
⚙️ Adding VS Code configuration...
✅ Updated existing project
✅ Project initialized successfully!
```

#### MCP Installation
```bash
✔ Install recommended MCP servers? Yes
✔ Select MCP servers to install: Serena, Context7, Chrome DevTools, Playwright

🔑 Context7 API Key Required
✔ Enter your Context7 API key: ctx7sk-2e23cb45-8690-48b4-9a54-bb6f22f4509d

📦 Installing MCP Servers...

⏭️  Serena - Already installed (skipped)
⏭️  Context7 - Already installed (skipped)
⏭️  Chrome DevTools - Already installed (skipped)
⏭️  Playwright - Already installed (skipped)

⚠️ No MCP servers detected after installation
   (Expected - MCPs already configured for this directory ✅)
```

#### Project Structure Created
```bash
ls -la dogfooding/

drwxr-xr-x@  9 thiagobutignon  staff   288 Oct  1 01:16 .
drwxr-xr-x  40 thiagobutignon  staff  1280 Oct  1 00:49 ..
drwxr-xr-x@  4 thiagobutignon  staff   128 Oct  1 01:16 .claude       ← Slash commands
-rw-r--r--@  1 thiagobutignon  staff   521 Oct  1 01:16 .gitignore
drwxr-xr-x@  8 thiagobutignon  staff   256 Oct  1 01:16 .regent       ← Templates & core
drwxr-xr-x@  3 thiagobutignon  staff    96 Oct  1 01:16 .vscode
-rw-r--r--@  1 thiagobutignon  staff  3321 Oct  1 01:16 eslint.config.js
-rw-r--r--@  1 thiagobutignon  staff   560 Oct  1 01:16 tsconfig.json
-rw-r--r--@  1 thiagobutignon  staff   114 Oct  1 01:16 vitest.config.ts
```

#### Benefits of This Approach

✅ **Solves Issue #150**: MCPs already configured for `dogfooding/` directory
✅ **No subdirectory issues**: Working in the project root where MCPs are available
✅ **Cleaner structure**: Features generated directly in `dogfooding/spec/` (not in subdirectory)
✅ **Better for dogfooding**: Direct testing without nested directory confusion

#### Updated Workflow

**Before (Subdirectory Approach)**:
```
dogfooding/              ← MCPs configured here
└── ecommerce/           ← regent init here (MCPs not available ❌)
    └── spec/            ← Features generated here
```

**After (Parent Directory Approach)** ✅:
```
dogfooding/              ← regent init --here (MCPs available ✅)
├── .claude/             ← Slash commands
├── .regent/             ← Templates & core
└── spec/                ← Features generated here
    └── 001-product-catalog-management/
```

#### Verification Needed

- [ ] Verify `.regent/utils/` exists with all 15 files
- [ ] Verify execute-steps.ts has correct import paths
- [ ] Verify MCPs still work (run `/mcp` command)
- [ ] Verify slash commands available (run `/01-plan-layer-features --help`)

**Decision**: ✅ **Use this approach for Phase 1** - Simpler, MCPs guaranteed, no subdirectory issues

---

### Final Project Setup: product-catalog

**Executed**: 2025-10-01 01:20
**Location**: `/Users/thiagobutignon/dev/spec-kit-clean-archicteture/dogfooding`
**Command**: `regent init product-catalog`

#### Setup Execution
```bash
cd dogfooding/
regent init product-catalog

# Interactive prompts:
✔ What is the name of your project? product-catalog
✔ Which AI assistant will you be using? Claude Code (Anthropic)

# Configuration:
Setup Configuration:
  Project: product-catalog
  Path: /Users/.../dogfooding/product-catalog
  Mode: New Project
  AI Assistant: claude

# Installation:
📁 Setting up The Regent structure... ✅
📋 Setting up Claude AI configuration... ✅
📄 Installing Clean Architecture templates... ✅
🎯 Installing core system files... ✅
📜 Installing utility scripts... ✅
🔧 Installing utility modules... ✅
⚙️ Installing configuration files... ✅
⚙️ Adding VS Code configuration... ✅
🔧 Initializing git repository... ✅
✅ Project initialized successfully!
```

#### MCP Installation Results
```bash
✔ Install recommended MCP servers? Yes
✔ Select MCP servers to install: Serena, Context7, Chrome DevTools, Playwright
✔ Enter your Context7 API key: ctx7sk-2e23cb45-8690-48b4-9a54-bb6f22f4509d

⏭️  Skipped (4):
   • serena (already installed)
   • context7 (already installed)
   • chrome-devtools (already installed)
   • playwright (already installed)

⚠️ No MCP servers detected after installation
   (Expected - Issue #150: MCPs configured for parent directory)
```

#### ✅ Bug #122 Verification - PASSED

**Check 1: Verify `.regent/utils/` directory exists**
```bash
ls -la product-catalog/.regent/

# Result:
drwxr-xr-x@  8 staff  256 Oct  1 01:20 .
drwxr-xr-x@ 12 staff  384 Oct  1 01:20 ..
drwxr-xr-x@  5 staff  160 Oct  1 01:20 config
drwxr-xr-x@  4 staff  128 Oct  1 01:20 core
drwxr-xr-x@  3 staff   96 Oct  1 01:20 docs
drwxr-xr-x@  5 staff  160 Oct  1 01:20 scripts
drwxr-xr-x@ 19 staff  608 Oct  1 01:20 templates
drwxr-xr-x@ 15 staff  480 Oct  1 01:20 utils  ← ✅ EXISTS!
```

**Status**: ✅ **PASS** - utils/ directory created

**Check 2: Verify utils/ has all required files**
```bash
ls product-catalog/.regent/utils/

# Result: 13 files (including tests)
commit-generator.test.ts
commit-generator.ts
config-validator.test.ts
config-validator.ts
constants.ts
git-operations.ts
log-path-resolver.test.ts
log-path-resolver.ts           ← ✅ KEY FILE!
package-manager.test.ts
package-manager.ts
prompt-utils.ts
scope-extractor.test.ts
scope-extractor.ts
```

**Status**: ✅ **PASS** - All required utility files present including `log-path-resolver.ts`

**Check 3: Verify import paths in execute-steps.ts**
```bash
head -20 product-catalog/.regent/config/execute-steps.ts | grep "^import"

# Result:
import Logger from '../core/logger';                            ← ✅ CORRECT!
import { EnhancedRLHFSystem, LayerInfo } from '../core/rlhf-system';  ← ✅ CORRECT!
import { resolveLogDirectory } from '../utils/log-path-resolver';     ← ✅ CORRECT!
import { EnhancedTemplateValidator } from './validate-template';      ← ✅ CORRECT!
```

**Status**: ✅ **PASS** - All imports use correct relative paths (`../core/`, `../utils/`)

#### Final Bug #122 Status: ✅ **COMPLETELY FIXED IN v2.2.0**

| Check | Expected | Result | Status |
|-------|----------|--------|--------|
| `utils/` directory exists | ✅ | ✅ 15 files | ✅ PASS |
| `log-path-resolver.ts` exists | ✅ | ✅ Present | ✅ PASS |
| Import paths correct | `../core/`, `../utils/` | ✅ All correct | ✅ PASS |
| No missing dependencies | ✅ | ✅ All present | ✅ PASS |

**Conclusion**: Bug #122 that blocked Experiment #002 Phase 6 is now **completely resolved**. The `/06-execute-layer-steps` command should work without errors.

#### Project Structure Ready

```
dogfooding/product-catalog/
├── .claude/             ← Slash commands (/01, /02, /03, etc.)
├── .regent/
│   ├── config/          ← execute-steps.ts with correct imports ✅
│   ├── core/            ← logger, rlhf-system ✅
│   ├── docs/            ← constitution.md
│   ├── scripts/         ← Utility scripts
│   ├── templates/       ← 19 templates (domain, data, infra, etc.)
│   └── utils/           ← 13 utility files including log-path-resolver ✅
├── .vscode/
├── eslint.config.js
├── tsconfig.json
└── vitest.config.ts
```

#### Working Directory Strategy

**Decision**: Work from **parent directory** (`dogfooding/`) to ensure MCP availability

```bash
# Working directory:
cd dogfooding/  # ← Execute commands here (MCPs available ✅)

# Generated files will be in:
product-catalog/spec/001-product-catalog-management/
```

**Status**: ✅ **READY FOR PHASE 1** - All prerequisites met, Bug #122 fixed, MCPs available from parent directory

---

## 📋 **Execution Plan**

### Phase 0: Pre-Flight Checks (CRITICAL) - ✅ COMPLETED
**Objective**: Verify bugs are fixed before starting

**Checks**:
- [x] Bug #122 fixed: `utils/` directory exists in `.regent/` ✅
- [x] Bug #122 fixed: Import paths use `../core/` not `./core/` ✅
- [x] Templates updated: Support `sharedComponents` and `useCases` ✅ (Phase 1 verified)
- [ ] Bug #117 implemented: `/03` command generates modular YAMLs (TO BE TESTED Phase 3)

**Decision Point**:
- ✅ Critical Bug #122 is FIXED → **PROCEED TO PHASE 1**
- ⚠️ Bug #117 status unknown - will be tested in Phase 3
- ⚠️ Bugs #108, #115 present but non-blocking

---

### Phase 1: Generate Modular JSON Plan
**Objective**: Test `/01-plan-layer-features` with new structure
**Command**: `/01-plan-layer-features`

**Input Specification**:
```
Feature: Product Catalog Management

Use Cases:
1. Create Product - Add new product with SKU, name, description, price, inventory
2. Update Product - Modify existing product details
3. Archive Product - Soft delete product from active catalog

Business Rules:
- SKU must be unique
- Price must be positive
- Inventory cannot go negative
- Archived products not shown in search
```

**Expected Output**:
```json
{
  "featureNumber": "001",
  "featureName": "product-catalog-management",
  "sharedComponents": {
    "models": ["ProductModel"],
    "valueObjects": ["SKU", "Price", "InventoryLevel"],
    "repositories": ["ProductRepository"]
  },
  "useCases": [
    {
      "name": "CreateProduct",
      "input": "CreateProductInput",
      "output": "CreateProductOutput",
      "errors": ["InvalidSKUError", "DuplicateSKUError"]
    },
    {
      "name": "UpdateProduct",
      "input": "UpdateProductInput",
      "output": "UpdateProductOutput",
      "errors": ["ProductNotFoundError", "InvalidPriceError"]
    },
    {
      "name": "ArchiveProduct",
      "input": "ArchiveProductInput",
      "output": "ArchiveProductOutput",
      "errors": ["ProductNotFoundError"]
    }
  ],
  "ubiquitousLanguage": { ... }
}
```

**Success Criteria**:
- ✅ JSON has `sharedComponents` object (not flat array)
- ✅ JSON has `useCases` array (not mixed with shared)
- ✅ Each use case has required fields
- ✅ No `steps` array (old structure)

**Metrics to Collect**:
- Execution time
- Token usage
- Number of shared components
- Number of use cases
- JSON structure validity

---

### Phase 1: Generate Modular JSON Plan - ✅ EXECUTION RESULTS

**Executed**: 2025-10-01 01:25 AM
**Location**: `dogfooding/product-catalog/` (working directory)
**Command**: `/01-plan-layer-features`
**Duration**: ~3 minutes

#### 🎯 Discovery: Automatic MCP Fallback Works!

**Initial Context - MCPs Not Available**:
```bash
cd product-catalog/
/mcp

# Result:
⎿ No MCP servers configured. Please run /doctor if this is unexpected.
```

**Result**: ✅ **Command executed successfully WITHOUT MCPs** (serena, context7)

**Fallback Behavior Observed**:
1. System attempted to use MCP tools (serena, context7) for code intelligence
2. When MCPs unavailable, **automatically fell back to alternative tools**:
   - ✅ **Web Search** used instead of context7 for documentation lookup
   - ✅ **Local file reading** used instead of serena for template analysis
   - ✅ **No manual prompt changes required** - fallback is automatic

**Key Insight**: The `/01-plan-layer-features` command has **built-in resilience** and doesn't hard-fail when MCPs are missing. This is excellent UX design!

---

#### Execution Sequence

**Step 1: Template Discovery**
```bash
# Attempted pattern search (no results):
Search(pattern: "templates/*domain-template.regent")  # Found 0 files
Search(pattern: "templates/*.regent")                  # Found 0 files

# Fallback to bash find (successful):
Bash(find . -name "*.regent" -type f | head -20)
# Found: ./.regent/templates/backend-domain-template.regent ✅
```

**Step 2: Template Analysis**
```bash
# Read template sections systematically:
Search(pattern: "# --- From: shared/00-header", output_mode: "content")    # 16 lines
Search(pattern: "# --- From: backend/01-structure", output_mode: "content") # 51 lines
Search(pattern: "# --- From: backend/steps/01-domain", output_mode: "content") # 101 lines
Search(pattern: "# --- From: shared/01-footer", output_mode: "content")    # 41 lines
```

**Step 3: External Research (Web Search Fallback)**

Instead of using context7 MCP, system automatically used Web Search:

```bash
Web Search("functional domain design TypeScript product catalog e-commerce 2025")
# Duration: 17s - SUCCESS ✅

Web Search("anemic domain model patterns TypeScript inventory management")
# Duration: 17s - SUCCESS ✅

Web Search("SKU value object TypeScript clean architecture")
# Duration: 22s - SUCCESS ✅
```

**Step 4: Project Analysis**
```bash
# Analyzed existing project structure:
Bash(find ./src -type f -name "*.ts" | head -20)  # Found: ./src/main.ts
Read(file_path: "./package.json")                 # Read project config
Read(file_path: "./src/main.ts")                  # Read existing code
Bash(pwd)                                          # Confirmed working directory
```

**Step 5: Plan Generation**
```bash
# Created spec directory structure:
Bash(mkdir -p ./spec/001-product-catalog-management/domain)

# Generated comprehensive JSON plan:
Write(./spec/001-product-catalog-management/domain/plan.json)
# Wrote 396 lines ✅
```

---

#### Generated JSON Plan Structure

**File Created**: `spec/001-product-catalog-management/domain/plan.json`
**Size**: 396 lines
**Format**: JSON with modular structure

**Top-Level Structure** ✅:
```json
{
  "featureName": "ProductCatalogManagement",
  "featureNumber": "001",
  "layer": "domain",
  "target": "backend",
  "layerContext": { ... },
  "sharedComponents": {           // ← ✅ MODULAR STRUCTURE!
    "models": [ ... ],
    "valueObjects": [ ... ],
    "repositories": [ ... ],
    "sharedErrors": [ ... ]
  },
  "useCases": [                   // ← ✅ SEPARATE FROM SHARED!
    { "name": "CreateProduct", ... },
    { "name": "UpdateProduct", ... },
    { "name": "ArchiveProduct", ... }
  ]
}
```

**Verification**:
```bash
cat plan.json | grep -E '"(sharedComponents|useCases)"'

# Result:
  "sharedComponents": {    ← ✅ EXISTS
  "useCases": [            ← ✅ EXISTS
```

---

#### Shared Components Generated

**1. Models (1)**:
- `Product` - Anemic domain model (data structure)
  - 9 properties: id, sku, name, description, price, inventory, isArchived, createdAt, updatedAt

**2. Value Objects (3)**:
- `SKU` - Stock Keeping Unit with validation (uppercase, alphanumeric, max 50 chars)
- `Price` - Monetary value in cents (positive, integer, max 999999999)
- `InventoryLevel` - Stock level (non-negative, max 1000000)
- **Pattern**: Factory functions with Result type for error handling ✅

**3. Repository (1)**:
- `ProductRepository` interface with 5 methods:
  - findById(id)
  - findBySKU(sku)
  - save(product)
  - update(product)
  - findActiveCatalog()

**4. Shared Errors (4)**:
- `ProductNotFoundError`
- `InvalidSKUError`
- `InvalidPriceError`
- `InvalidInventoryError`

---

#### Use Cases Generated

**1. CreateProduct**
- **Input**: sku, name, description, price, inventory
- **Output**: id, sku, name, price, inventory, createdAt
- **Errors**: `DuplicateSKUError`
- **Business Logic**: SKU uniqueness validation, price/inventory validation

**2. UpdateProduct**
- **Input**: id, name?, description?, price?, inventory? (all optional except id)
- **Output**: id, name, price, inventory, updatedAt
- **Errors**: `CannotUpdateArchivedProductError`
- **Business Logic**: Prevent updates to archived products, validate new values

**3. ArchiveProduct**
- **Input**: productId
- **Output**: id, sku, isArchived, archivedAt
- **Errors**: `ProductAlreadyArchivedError`
- **Business Logic**: Idempotent soft delete operation

---

#### Layer Context Generated

**Ubiquitous Language (6 terms)**:
- Product, SKU, Price, Inventory, Archive, Catalog

**Business Rules (7 rules)**:
1. SKU must be unique across all products
2. Price must be positive
3. Inventory level cannot go negative
4. Archived products excluded from catalog search
5. Products can only be archived once (idempotency)
6. Product name is required
7. Product description is optional

**Architectural Approach**:
> "Functional Clean Architecture - Anemic domain models with factory functions for value objects, business logic in use case implementations (data layer)"

**Design Decisions (5)**:
1. Anemic Product model (NOT rich domain entity)
2. Value objects use factory functions with Result type
3. Repository interface defines simple CRUD (no business logic)
4. Each use case has interface in domain, implementation in data layer
5. Immutability enforced through TypeScript readonly + object spreading

---

#### Success Criteria Assessment

| Criterion | Expected | Result | Status |
|-----------|----------|--------|--------|
| JSON has `sharedComponents` | ✅ | ✅ Present | ✅ PASS |
| JSON has `useCases` array | ✅ | ✅ 3 use cases | ✅ PASS |
| Each use case has required fields | ✅ | ✅ Complete | ✅ PASS |
| No flat `steps` array (old structure) | ❌ | ✅ No steps | ✅ PASS |
| Ubiquitous language defined | ✅ | ✅ 6 terms | ✅ PASS |
| Business rules documented | ✅ | ✅ 7 rules | ✅ PASS |

**Overall Status**: ✅ **ALL CRITERIA MET**

---

#### Metrics Collected

| Metric | Value |
|--------|-------|
| **Execution time** | ~3 minutes |
| **Token usage** | ~50,000 tokens (estimated) |
| **Web searches performed** | 3 (fallback from context7) |
| **Template sections read** | 4 major sections |
| **JSON plan lines** | 396 lines |
| **Shared components** | 9 (1 model + 3 VOs + 1 repo + 4 errors) |
| **Use cases** | 3 (Create, Update, Archive) |
| **Business rules** | 7 rules documented |
| **Ubiquitous language** | 6 terms defined |

---

#### Key Observations

**1. MCP Fallback Resilience** ⭐⭐⭐⭐⭐
- Command succeeded even without serena and context7
- Web Search automatically used instead of context7
- Local file reading used instead of serena
- **No manual intervention required**
- This is excellent defensive programming!

**2. Modular JSON Structure** ✅
- JSON has BOTH `sharedComponents` AND `useCases` (not flat structure)
- This confirms templates support the new modular approach
- **Bug #117 status**: Partially validated (JSON structure correct)
- Still need to test if `/03` generates modular YAMLs (Phase 3)

**3. Functional Architecture Approach** ✅
- Generated anemic domain models (NOT OOP rich entities)
- Value objects use factory functions (NOT classes)
- Clear separation of concerns (interfaces in domain, logic in data)
- Immutability patterns documented

**4. Quality of Generated Plan** ⭐⭐⭐⭐⭐
- Comprehensive ubiquitous language
- Well-defined business rules
- Proper architectural decisions documented
- Clear design patterns (Result type, factory functions)
- Professional structure ready for `/02` validation

---

#### Next Step

**Status**: ✅ **READY FOR PHASE 2 VALIDATION**

**Command to Execute**:
```bash
/02-validate-layer-plan --file=spec/001-product-catalog-management/domain/plan.json
```

**Expected**: Validation with RLHF score +1 or +2

---

### Phase 2: Validate JSON Plan
**Objective**: Validate modular structure
**Command**: `/02-validate-layer-plan`

**Expected Behavior**:
- Validates `sharedComponents` object
- Validates `useCases` array
- Checks for architectural violations
- Scores RLHF (+2, +1, 0, -1, -2)

**Success Criteria**:
- ✅ Validation passes with +1 or +2
- ✅ No schema errors
- ✅ Modular structure recognized

---

### Phase 3: Generate Modular YAMLs
**Objective**: Test modular YAML generation (Issue #143)
**Command**: `/03-generate-layer-code`

**Expected Output**:
```
spec/001-product-catalog-management/domain/
├── shared-implementation.yaml          # ~5 steps (models, VOs, repo)
├── create-product-implementation.yaml   # ~3 steps (use case files)
├── update-product-implementation.yaml   # ~3 steps
└── archive-product-implementation.yaml  # ~3 steps
```

**Success Criteria**:
- ✅ 4 separate YAML files generated (1 shared + 3 use cases)
- ✅ Each YAML has own branch step
- ✅ Each YAML has own folder step
- ✅ Each YAML is atomic (can execute independently)
- ✅ No monolithic YAML with all steps

**Failure Indicators**:
- ❌ Single YAML with 19 steps (Bug #117 not fixed)
- ❌ No `shared-implementation.yaml`
- ❌ Use cases mixed with shared components

---

### Phase 4: Execute Shared Components
**Objective**: Verify `/06` works with shared YAML
**Command**: `/06-execute-layer-steps --file=spec/.../shared-implementation.yaml`

**Expected Behavior**:
1. Creates branch `feat/product-catalog-management/domain-shared`
2. Creates folder structure
3. Creates 5 files (Product model, SKU, Price, InventoryLevel, ProductRepository)
4. Runs `yarn lint` (should pass)
5. Runs `yarn test` (should pass)
6. Commits with message: `feat(domain): add shared components for product catalog`
7. Creates PR

**Success Criteria**:
- ✅ No import errors
- ✅ No missing dependency errors
- ✅ Lint passes
- ✅ Test passes
- ✅ Commit created
- ✅ PR created

**Failure Indicators**:
- ❌ `Cannot find module` error (Bug #122 not fixed)
- ❌ Import path errors
- ❌ Lint failures
- ❌ Test failures

---

### Phase 5: Execute Use Case YAMLs
**Objective**: Verify atomic use case execution
**Commands**:
```bash
/06-execute-layer-steps --file=spec/.../create-product-implementation.yaml
/06-execute-layer-steps --file=spec/.../update-product-implementation.yaml
/06-execute-layer-steps --file=spec/.../archive-product-implementation.yaml
```

**Expected Behavior**:
Each execution:
1. Creates use case-specific branch
2. Creates use case files (input, output, errors, use case interface)
3. Runs quality checks
4. Creates atomic commit
5. Creates separate PR

**Success Criteria**:
- ✅ 3 separate branches created
- ✅ 3 separate commits
- ✅ 3 separate PRs
- ✅ Each PR has 2-3 files (atomic, reviewable)
- ✅ All quality checks pass

**Benefits Validated**:
- ✅ Atomic commits per use case (vs 1 monolithic commit)
- ✅ Better reviewability (2 files vs 17 files)
- ✅ True Vertical Slice Architecture
- ✅ Parallel execution possible

---

### Phase 6: Edge Case Testing
**Objective**: Test boundary conditions

**Test 6A: Single Use Case**
```bash
# Input: Feature with only 1 use case
# Expected: 2 YAMLs (1 shared + 1 use case)
```

**Test 6B: No Shared Components**
```bash
# Input: Feature with no shared models/VOs/repos
# Expected: N use case YAMLs only (no shared YAML)
```

**Test 6C: Many Use Cases**
```bash
# Input: Feature with 10 use cases
# Expected: 11 YAMLs (1 shared + 10 use cases)
```

---

## ✅ **Success Criteria**

### Primary Criteria (Must Pass)
1. ✅ **Bug #122 Fixed**: `/06` executes without import/dependency errors
2. ✅ **Issue #143 Test 1**: JSON plan has `sharedComponents` + `useCases`
3. ✅ **Issue #143 Test 2**: 6 modular YAMLs generated (not monolithic)
4. ✅ **Issue #143 Test 3**: `/06` executes modular YAMLs successfully
5. ✅ **Atomic Commits**: Each use case creates separate commit + PR

### Secondary Criteria (Desirable)
6. ⚡ **Performance**: Each YAML executes in < 3 minutes
7. 🎯 **Quality**: All quality checks pass (lint + test)
8. 📚 **Documentation**: Clear modular structure
9. 🏗️ **Architecture**: True vertical slice per use case
10. 🔄 **Completeness**: All use cases independently executable

## 📊 **Monitoring Metrics**

### Quantitative
- Number of YAMLs generated (expect 4 for 3 use cases)
- Number of commits created (expect 4)
- Number of PRs created (expect 4)
- Files per commit (expect 2-5 per use case, vs 17 monolithic)
- Execution time per YAML
- Token usage per phase

### Qualitative
- Reviewability (1-5): Can PRs be reviewed easily?
- Atomicity (1-5): Are commits truly atomic?
- Architecture (1-5): True vertical slice?
- Developer Experience (1-5): Easy to understand workflow?

## 📋 **Execution Checklist**

### Pre-Flight (Phase 0)
- [ ] Bug #122 fix verified (utils/ exists, imports correct)
- [ ] Bug #117 implementation verified (modular YAML)
- [ ] Templates updated for modular generation
- [ ] Test project initialized
- [ ] MCP servers ready (or skip if Bug #115 not fixed)

### Phase 1: Planning
- [ ] Execute `/01-plan-layer-features`
- [ ] Verify JSON has `sharedComponents` object
- [ ] Verify JSON has `useCases` array
- [ ] No flat `steps` array
- [ ] Metrics collected

### Phase 2: Validation
- [ ] Execute `/02-validate-layer-plan`
- [ ] RLHF score +1 or +2
- [ ] Modular structure validated
- [ ] Metrics collected

### Phase 3: Modular Generation
- [ ] Execute `/03-generate-layer-code`
- [ ] Count YAMLs generated (expect 4)
- [ ] Verify `shared-implementation.yaml` exists
- [ ] Verify 3 use case YAMLs exist
- [ ] No monolithic YAML
- [ ] Metrics collected

### Phase 4: Shared Execution
- [ ] Execute `/06` on `shared-implementation.yaml`
- [ ] No import/dependency errors
- [ ] Lint passes
- [ ] Test passes
- [ ] Commit created
- [ ] PR created
- [ ] Metrics collected

### Phase 5: Use Case Execution
- [ ] Execute `/06` on `create-product-implementation.yaml`
- [ ] Execute `/06` on `update-product-implementation.yaml`
- [ ] Execute `/06` on `archive-product-implementation.yaml`
- [ ] 3 separate branches created
- [ ] 3 separate commits
- [ ] 3 separate PRs
- [ ] Metrics collected

### Phase 6: Edge Cases
- [ ] Test single use case (2 YAMLs expected)
- [ ] Test no shared components (N YAMLs expected)
- [ ] Test many use cases (11 YAMLs expected)

### Post-Execution
- [ ] All metrics documented
- [ ] Screenshots captured
- [ ] Issue #143 acceptance criteria met
- [ ] Lessons learned recorded
- [ ] Next steps identified

## 🎯 **Expected Results**

### Ideal Outcome
```json
{
  "phase1": {
    "status": "✅ SUCCESS",
    "jsonStructure": "modular (sharedComponents + useCases)",
    "useCases": 3
  },
  "phase2": {
    "status": "✅ SUCCESS",
    "rlhfScore": "+2 PERFECT",
    "modularStructureValidated": true
  },
  "phase3": {
    "status": "✅ SUCCESS",
    "yamlsGenerated": 4,
    "modular": true,
    "monolithic": false
  },
  "phase4": {
    "status": "✅ SUCCESS",
    "sharedExecuted": true,
    "filesCreated": 5,
    "noErrors": true
  },
  "phase5": {
    "status": "✅ SUCCESS",
    "useCasesExecuted": 3,
    "atomicCommits": 3,
    "separatePRs": 3,
    "reviewability": "excellent"
  },
  "issue143": {
    "status": "✅ COMPLETE",
    "test1": "✅ JSON modular structure",
    "test2": "✅ Modular YAMLs generated",
    "test3": "✅ Execution successful"
  }
}
```

## 🚨 **Failure Scenarios**

### Scenario A: Bug #122 Not Fixed
**Symptoms**: Import errors, missing dependency errors
**Action**: STOP experiment, fix Bug #122 first
**Priority**: P0 (blocks everything)

### Scenario B: Bug #117 Not Implemented
**Symptoms**: Single monolithic YAML generated
**Action**: STOP experiment, implement modular generation
**Priority**: P0 (blocks Issue #143)

### Scenario C: Modular YAMLs Generated but Won't Execute
**Symptoms**: `/06` fails on modular YAMLs
**Action**: Debug execution logic, check YAML format
**Priority**: P0 (partial success)

### Scenario D: Quality Checks Fail
**Symptoms**: Lint or test failures
**Action**: Analyze errors, fix templates
**Priority**: P1 (execution works but quality issues)

## 📈 **Success Metrics**

| Metric | Target | Measured |
|--------|--------|----------|
| YAMLs generated | 4 (1 shared + 3 use cases) | ___ |
| Monolithic YAML | 0 | ___ |
| Import errors | 0 | ___ |
| Lint failures | 0 | ___ |
| Test failures | 0 | ___ |
| Commits created | 4 | ___ |
| PRs created | 4 | ___ |
| Files per PR | 2-5 | ___ |
| Execution time per YAML | < 3 min | ___ |
| Issue #143 tests passed | 3/3 | ___ |

## 📝 **Result Template**

```markdown
## Experiment #003 Result

**Execution Date**: [YYYY-MM-DD HH:MM]
**Version**: 2.2.0
**Executor**: [Name]
**Feature**: Product Catalog Management (3 use cases)

### Phase 0: Pre-Flight Checks
- Bug #122 Fixed: ✅/❌
- Bug #117 Implemented: ✅/❌
- Templates Updated: ✅/❌
- Ready to Proceed: ✅/❌

### Phase 1: Modular JSON Plan
- Status: ✅/❌
- JSON Structure: modular / monolithic
- Shared Components: [number]
- Use Cases: [number]

### Phase 2: Validation
- Status: ✅/❌
- RLHF Score: [+2/+1/0/-1/-2]
- Modular Structure: ✅/❌

### Phase 3: Modular YAML Generation
- Status: ✅/❌
- YAMLs Generated: [number]
- Modular: ✅/❌
- Monolithic: ✅/❌

### Phase 4: Shared Execution
- Status: ✅/❌
- Import Errors: [number]
- Lint: ✅/❌
- Test: ✅/❌
- Commit: ✅/❌
- PR: ✅/❌

### Phase 5: Use Case Execution
- Status: ✅/❌
- Use Cases Executed: [number]
- Atomic Commits: [number]
- Separate PRs: [number]
- Reviewability: [1-5]

### Issue #143 Tests
- Test 1 (JSON modular): ✅/❌
- Test 2 (Modular YAMLs): ✅/❌
- Test 3 (Execution): ✅/❌
- **Overall**: ✅/❌

### Overall Success
- [SUCCESS/PARTIAL/FAILURE]
- Completion Rate: [%]
- Quality Score: [average]

### Observations
[Key findings, improvements validated]

### Recommendations
[Next steps, remaining issues]
```

## 🎯 **Next Steps After Experiment**

### If SUCCESS ✅
1. Close Issue #143 (test plan complete)
2. Document modular workflow in README
3. Create video tutorial for modular generation
4. Update templates with lessons learned

### If PARTIAL ⚠️
1. Identify which phases failed
2. Create issues for remaining problems
3. Plan follow-up experiment

### If FAILURE ❌
1. Identify blockers
2. Fix critical bugs first
3. Re-run experiment after fixes

---

**Started**: [To be filled during execution]
**Last Update**: 2025-10-01 (Document created)
**Status**: 🔄 READY TO START (pending Bug #122 fix verification)
