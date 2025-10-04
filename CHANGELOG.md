# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planning for v2.3.0

**Target Areas for Next Release:**
- [ ] Add `validate:commands` to CI/CD pipeline
- [ ] Implement pre-commit hook for consistency checks
- [ ] Create command dependency graph visualization
- [ ] Add migration guide for v1 to v2 structure changes
- [ ] Dogfooding experiment with new edge case documentation
- [ ] Performance optimization for template generation
- [ ] Additional MCP server integrations

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
- ✅ CI/CD ready with exit codes
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