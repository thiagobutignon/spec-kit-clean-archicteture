# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Automated Commit Convention** (#179)
  - Standardized all Regent automated commits to use `regent` conventional commit type
  - Added `regent` to ConventionalCommitType enum in commit-generator.ts
  - Updated all type mappings to use `regent` instead of `feat`, `fix`, `chore`, etc.
  - Benefits:
    - Easy identification: `git log --grep="^regent"` shows only automated commits
    - Clear git history: instant distinction between AI-generated and manual code
    - Bulk operations: revert or analyze all Regent commits at once
    - CI/CD integration: skip automated commits in workflows
  - Added `.commitlintrc.json` to validate both `regent` and standard commit types
  - Updated README.md with commit convention documentation
  - Updated CONTRIBUTING.md to clarify `regent` type is for automated commits only
  - All 46 tests updated and passing

### Planning for v2.4.0

**Breakthrough: Deterministic AI Development Methodology**

This release represents a paradigm shift in AI-assisted development. The system successfully "ate its own dog food" by refactoring itself using its own deterministic methodology.

**Target Areas for Next Release:**
- [x] Dogfooding experiment - System refactored itself (#171-#176)
- [x] Fix namespace pollution bugs (zx/globals, fs-extra ESM)
- [x] Create comprehensive AI-Deterministic Development documentation
- [x] Validate RLHF system with dogfooding test
- [ ] Integrate Auditor library for enhanced quality analysis (#171)
- [ ] Create SWE-bench TypeScript benchmark (#172)
- [ ] Improve logger output for better visibility (#173)
- [ ] Implement non-interactive execution mode (#174)
- [ ] Extract test directory patterns (#175)
- [ ] Evolve to Vertical Slice Architecture (#176)

---

## [2.4.0] - 2025-10-02

> **Release Focus**: Self-Refactoring, Namespace Pollution Fixes, and Deterministic AI Development

**🎉 Major Milestone: The System Successfully Refactored Itself**

The Regent achieved true dogfooding by refactoring its own 2000-line monolithic `execute-steps.ts` into proper Clean Architecture using its deterministic methodology. This proves the system works at scale.

### Added

- **AI-Deterministic Development Documentation** (1,416 lines)
  - Revolutionary approach: AI for creativity, systems for execution
  - Complete analysis of vibe coding vs deterministic development
  - Role of Serena MCP (15-20x faster code discovery)
  - RLHF automated feedback loops
  - 5-phase workflow diagrams
  - Real-world case study: execute-steps.ts refactoring (50 steps)
  - Comparison table: Traditional LLM vs Deterministic approach
  - **Table of Contents** for easy navigation (49 sections)
  - File: `docs/ai-deterministic-development.md`

- **Dogfooding Artifacts Documentation**
  - Complete README explaining refactoring artifacts
  - Success metrics and timeline
  - Learning guide for users, contributors, and researchers
  - Reproducibility instructions
  - Case study highlights (namespace pollution bug)
  - File: `docs/dogfooding/README.md`

- **Dogfooding Test Suite**
  - Validates generated code structure (dog/src)
  - Validates refactored code functionality (src/)
  - Tests RLHF system completeness
  - 5-step test template for rapid validation
  - Files: `scripts/test-dogfooding.ts`, `dog/test-dogfood-simple.regent`

- **Self-Refactoring Implementation** (50 steps)
  - Refactored execute-steps.ts (2000 lines) → Clean Architecture
  - Generated 50 files across 6 layers (domain, data, infra, presentation, validation, main)
  - 18 commits with automated quality checks
  - RLHF score: 2/2 (perfect execution)
  - File: `dog/implement-executor.regent`

- **Future Enhancement Issues**
  - #171: Integrate Auditor library for code quality
  - #172: SWE-bench TypeScript benchmark with deterministic methodology
  - #173: Improve logger output for better visibility
  - #174: Non-interactive execution mode for AI orchestration
  - #175: Extract test directory patterns for complete coverage
  - #176: Vertical Slice / Feature-based architecture evolution

### Fixed

- **Namespace Pollution from zx/globals** - CRITICAL BUG
  - Problem: `import 'zx/globals'` polluted namespace with zx's `fs` object
  - Conflicted with `fs-extra` imports causing `fs.readFile is not a function`
  - Solution: Changed to explicit imports `import { $, chalk, argv } from 'zx'`
  - Files fixed:
    - `src/execute-steps.ts`
    - `src/core/rlhf-system.ts`
    - `src/utils/git-operations.ts`
    - `src/utils/package-manager.ts`
  - Commits: 11b380b, 6e2b66d, 1460bbd

- **ESM Import Compatibility for fs-extra**
  - Problem: `import * as fs from 'fs-extra'` doesn't work in ESM/tsx context
  - Solution: Changed to default import `import fs from 'fs-extra'`
  - Alternative pattern: `import fsExtra from 'fs-extra'; const fs = fsExtra`
  - Files fixed:
    - `src/core/rlhf-system.ts` (f361eeb)
    - `src/execute-steps.ts` (9c7794e)

- **RLHF Analysis Error on Step Failure**
  - Bug only manifested when steps FAILED (not on success)
  - Root cause: Namespace pollution + ESM import issues
  - Fixed by addressing both import problems above
  - RLHF system now completes analysis correctly

### Changed

- **Execute Steps Architecture** - Major Refactoring
  - From: 2000-line monolithic file
  - To: 50 files following Clean Architecture
  - Layers: domain (12 files), data (18 files), infra (8 files), presentation (4 files), main (7 files), validation (1 file)
  - All quality checks passing (lint, tests, TypeScript compilation)
  - 100% deterministic execution via regent system

### Technical Deep Dive

**The Namespace Pollution Bug:**
```typescript
// BEFORE (broken):
import 'zx/globals';  // Injects zx's fs into global namespace
import * as fs from 'fs-extra';  // Creates namespace conflict

// AFTER (fixed):
import fsExtra from 'fs-extra';
import { $, chalk, argv } from 'zx';
const fs = fsExtra;  // No conflicts
```

**Why This Matters:**
- zx's `fs` is a minimal subset of Node.js fs
- fs-extra extends Node.js fs with promise methods
- Namespace pollution caused zx's `fs` to shadow fs-extra
- `fs.readFile` failed because zx's `fs` doesn't have that method

**The Discovery Process:**
1. Used Serena MCP to analyze all fs imports across codebase
2. Used Context7 to research zx documentation
3. Found zx exports its own `fs` that conflicts
4. Discovered ESM requires default import for fs-extra

**Dogfooding Success Metrics:**
- ✅ Generated code structure validated
- ✅ Refactored code executes correctly
- ✅ RLHF system operational
- ✅ Namespace pollution eliminated
- ✅ All 50 steps executed successfully
- ✅ 18 commits with quality validation
- ✅ Zero manual interventions needed

### Impact Summary

**Paradigm Shift:**
- ✅ Proven deterministic AI development methodology
- ✅ System successfully refactored itself (dogfooding)
- ✅ AI used only for creative decisions, not mechanical execution
- ✅ 15-20x faster code discovery via Serena MCP
- ✅ Automated RLHF feedback loops working

**Code Quality:**
- ✅ Fixed critical namespace pollution bug
- ✅ Fixed ESM import compatibility issues
- ✅ RLHF analysis now completes on all scenarios
- ✅ All quality checks passing

**Documentation:**
- ✅ 1,416 lines documenting revolutionary approach
- ✅ Complete comparison: vibe coding vs deterministic
- ✅ Real-world case study with 50-step refactoring
- ✅ Future roadmap with 6 enhancement issues

**Developer Experience:**
- ✅ System can refactor itself
- ✅ Deterministic execution proven at scale
- ✅ Clear path forward for enhancements
- ✅ Reproducible dogfooding test

**Issues Resolved:**
- Fixes namespace pollution (zx/globals conflict)
- Fixes ESM import issues (fs-extra compatibility)
- Fixes RLHF analysis failures on step errors
- Validates dogfooding methodology

**New Issues Created (Roadmap):**
- #171: Auditor library integration
- #172: SWE-bench TypeScript benchmark
- #173: Logger output improvements
- #174: Non-interactive execution mode
- #175: Test directory pattern extraction
- #176: Vertical Slice Architecture evolution

---

## [2.3.0] - TBD

> **Release Focus**: Quality, Documentation, and Process Improvements

This release focuses on three key areas:
1. **Code Quality** - Fixed P0 blocker preventing TypeScript compilation
2. **Documentation** - Comprehensive edge case and process documentation
3. **Tooling** - Automated validation to prevent architectural drift

### Added
- **Edge Case Documentation** (#145)
  - Complete documentation for modular YAML edge cases (650 lines)
  - 4 documented edge cases with solutions and examples
  - Decision flowchart for edge case handling
  - Integration guidance for `/01` and `/03` commands
  - File: `docs/edge-cases/modular-yaml-edge-cases.md`

- **Architectural Change Process** (#152)
  - Definition of Done checklist for architectural changes (850 lines)
  - 6-phase systematic process to prevent prompt drift
  - Real-world case study from Issue #117
  - Automation opportunities documented
  - File: `docs/processes/architectural-change-checklist.md`

- **Command Consistency Validation** (#152)
  - Automated validator script `scripts/validate-command-consistency.ts`
  - npm script `validate:commands` for easy execution
  - Validates 5 key concepts across all AI commands
  - Color-coded output with actionable error messages
  - Exit codes for CI/CD integration

- **GitHub Actions CI/CD Workflow** (#167)
  - Automated command consistency validation on pull requests
  - Runs on changes to `.claude/commands/` or validation script
  - Posts PR comment with actionable fixes when validation fails
  - Fast feedback loop (< 30 seconds)
  - Prevents inconsistent commands from being merged
  - File: `.github/workflows/validate-commands.yml`

- **Pre-commit Hook for Command Validation** (#168)
  - Automatic validation before every git commit
  - Configured with Husky and lint-staged
  - Only runs when `.claude/commands/` files change
  - Fast execution (< 1 second)
  - Easy bypass with `--no-verify` for emergencies
  - Files: `.husky/pre-commit`, `package.json` (lint-staged config)

- **Unit Tests for Command Consistency** (#166)
  - Comprehensive test suite already exists (verified)
  - Unit tests: `scripts/__tests__/validate-command-consistency.test.ts`
  - Integration tests: `scripts/__tests__/validate-command-consistency.integration.test.ts`
  - 100% coverage of validation rules and edge cases

- **Project-Level MCP Configuration** (#150) - PERMANENT SOLUTION
  - Added `.mcp.json` at project root for team-wide MCP server configuration
  - Configured 4 essential servers: serena, context7, chrome-devtools, playwright
  - MCPs now work automatically in all subdirectories
  - Supports environment variables for optional API keys (Context7)
  - **CLI Integration**: `regent init` now offers to create `.mcp.json` (recommended option)
  - **New command**: `regent setup-mcp` to create/update `.mcp.json` in existing projects
  - File: `.mcp.json`

- **MCP Configuration Documentation** (#150)
  - Comprehensive setup guide for project-level `.mcp.json` (500+ lines)
  - Prerequisites and installation instructions
  - Context7 API key setup (optional, for higher rate limits)
  - Troubleshooting guide with common issues
  - Security best practices for team configurations
  - File: `docs/setup/mcp-configuration.md`

- **MCP Troubleshooting Documentation** (#150)
  - Updated troubleshooting guide to reflect permanent solution
  - Historical context for alternative workarounds
  - Migration from per-directory to project-level configuration
  - File: `docs/troubleshooting/mcp-subdirectory-workaround.md`

- **Enhanced Logger System** (#185)
  - Comprehensive improvements to logging infrastructure
  - Multiple log levels (DEBUG, INFO, WARN, ERROR, SUCCESS) with filtering
  - Structured logging with contextual information
  - Progress tracking with visual indicators
  - Execution summary with metrics
  - RLHF score tracking and visualization with validation
  - Flexible configuration (verbose, quiet, timestamp formats, colorization)
  - Backward compatible with legacy Logger(string) constructor
  - 34 comprehensive tests covering all major functionality
  - Complete API documentation: `docs/logger-api.md`
  - Security improvements:
    - Stream error handling to prevent crashes
    - Graceful shutdown handlers (SIGINT, SIGTERM, exit)
    - Log injection sanitization
    - Proper resource cleanup to prevent memory leaks
  - Performance improvements:
    - Fixed race condition in tests with proper stream flushing
    - Optimized step progress display ([current/total] format)
  - Code quality:
    - Translated Portuguese comments to English
    - Fixed LogLevel enum ordering for intuitive filtering
    - RLHF score validation against expected range

- Automated NPM package publishing via GitHub Actions
- Release process documentation
- CHANGELOG.md for tracking project changes
- Migration note in README.md for users of legacy commands
- Documentation of numbered command pattern (/01-/09)

### Fixed
- **Import Path Mismatch in Generated Code** (#154) - P0 BLOCKER
  - Fixed value object error imports to use barrel exports
  - Changed from `from '../errors/specific-file'` to `from '../errors'`
  - Fixed in 6 template files (domain + infrastructure layers)
  - Prevents TypeScript compilation errors in generated code
  - Files fixed:
    - `backend-domain-template.regent`
    - `fullstack-domain-template.regent`
    - `fullstack-infra-template.regent`
    - `parts/backend/steps/01-domain.part.regent`
    - `parts/fullstack/steps/01-domain.part.regent`
    - `parts/fullstack/steps/03-infra.part.regent`

- **Incorrect Package Name in Documentation**
  - Fixed package name from `@the-regent/cli` to `the-regent-cli`
  - Updated 6 references in README.md
  - Command `regent` remains unchanged (as expected)

### Changed
- **AI Command Updates with Edge Case Guidance** (#145)
  - Updated `/01-plan-layer-features.md` with edge case guidance section
  - Updated `/03-generate-layer-code.md` with edge case handling section
  - Both commands now reference comprehensive edge case documentation
  - Helps AI make correct decisions during planning and generation

- **Multiple YAML Support Documentation** (#144)
  - Updated `/04-reflect-layer-lessons.md` with multi-YAML execution patterns
  - Updated `/06-execute-layer-steps.md` with critical execution order guidance
  - Documents proper sequence: shared components → use cases → updates
  - Includes batch processing examples and dependency tracking patterns
  - Prevents TypeScript compilation errors from incorrect execution order

- Reorganized documentation into thematic directories under `docs/` (#137)
  - Moved 10 markdown files from root to organized structure:
    - `docs/setup/` - Setup and configuration guides
    - `docs/reports/` - Audit and validation reports
    - `docs/architecture/` - Architecture analysis and proposals
    - `docs/features/` - Feature implementation documentation
  - Updated all internal references to new locations in CLI commands
  - Root now contains only essential files (README.md, CHANGELOG.md, CONTRIBUTING.md)

### Removed
- **BREAKING**: 7 legacy slash command files that don't work with `.regent/` templates:
  - `/constitution` - Use `/01-plan-layer-features` instead
  - `/specify` - Use `/01-plan-layer-features` instead
  - `/plan` - Use `/01-plan-layer-features` instead
  - `/tasks` - Use `/02-validate-layer-plan` instead
  - `/implement` - Use `/03-generate-layer-code` → `/06-execute-layer-steps` instead
  - `/clarify` - Functionality integrated into planning commands
  - `/analyze` - Use `/05-evaluate-layer-results` instead

### Changed
- Updated `regent init` command to suggest only validated commands (/01-/05)
- Updated README.md workflow documentation to use layer-driven commands only

### Impact Summary

**Code Quality Improvements:**
- ✅ Fixed P0 BLOCKER preventing production use (#154)
- ✅ 8 template instances corrected (domain + infrastructure)
- ✅ Zero TypeScript compilation errors in generated code

**Documentation Enhancements:**
- ✅ +1,500 lines of comprehensive documentation
- ✅ 4 edge cases fully documented with examples
- ✅ 6-phase architectural change process defined
- ✅ Real-world case studies included

**Process & Tooling:**
- ✅ Automated consistency validation (5 rule sets)
- ✅ npm script for easy validation (`validate:commands`)
- ✅ CI/CD pipeline with GitHub Actions (#167)
- ✅ Pre-commit hooks for automatic validation (#168)
- ✅ Comprehensive unit tests (#166)
- ✅ Prevents future architectural drift

**Developer Experience:**
- ✅ Clear decision rules for edge cases
- ✅ Systematic process for architectural changes
- ✅ Automated detection of inconsistencies
- ✅ Better error messages and guidance
- ✅ **MCP servers work in all subdirectories automatically** (no per-directory setup)
- ✅ Team-wide MCP configuration via git (onboarding simplified)
- ✅ Multi-YAML execution guidance prevents compilation errors

**Issues Resolved:**
- Fixes #154 (P0 BLOCKER - import path mismatch)
- Fixes #145 (edge case documentation)
- Fixes #152 (prompt consistency process)
- Fixes #150 (MCP subdirectory configuration)
- Fixes #144 (multi-YAML execution documentation)
- Fixes #167 (GitHub Actions CI/CD workflow)
- Fixes #168 (pre-commit hook automation)
- Fixes #166 (unit tests verification)
- Improves #117 (modular YAML structure quality)

## [2.1.1] - 2025-09-28

### Fixed
- Remove SpecToYamlTransformer references from /03-generate-layer-code command
- Update workflow diagram to reference /04-reflect-layer-lessons

### Changed
- Template-driven approach maintained throughout all commands

## [2.1.0] - 2025-09-28

### Added
- Sequential template reading in /01-plan-layer-features command
- Constitutional AI-NOTE against fallback patterns
- Template integration between .claude and .regent directories

### Removed
- Dead code removal: 8K+ lines of unused code
- Deleted packages/cli/ directory
- Removed SpecToYamlTransformer class

## [2.0.0] - Initial Release

### Added
- Clean Architecture CLI tool
- Domain-Driven Design support
- Template-driven code generation
- RLHF scoring system
- Multiple layer support (domain, data, infrastructure, presentation, main)

[Unreleased]: https://github.com/thiagobutignon/spec-kit-clean-archicteture/compare/v2.1.1...HEAD
[2.1.1]: https://github.com/thiagobutignon/spec-kit-clean-archicteture/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/thiagobutignon/spec-kit-clean-archicteture/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/thiagobutignon/spec-kit-clean-archicteture/releases/tag/v2.0.0