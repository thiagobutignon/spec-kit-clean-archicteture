# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Automated NPM package publishing via GitHub Actions
- Release process documentation
- CHANGELOG.md for tracking project changes
- Migration note in README.md for users of legacy commands
- Documentation of numbered command pattern (/01-/09)

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