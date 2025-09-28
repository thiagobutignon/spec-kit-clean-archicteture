# Changelog

All notable changes to The Regent CLI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2025-09-28

### Fixed
- Corrected template path references in `/03-generate-layer-code` command from non-existent `.yaml` files to actual `.regent` template files
- Fixed template resolution to properly use `[TARGET]-[LAYER]-template.regent` format (e.g., `backend-domain-template.regent`)
- Updated validation script path to `.regent/config/validate-template.ts`

### Added
- Comprehensive Template Resolution Strategy documentation
- Multi-Target Clean Architecture Matrix documentation showing support for:
  - Backend (Node.js, Express, Prisma)
  - Frontend (React, Next.js)
  - Fullstack (Shared types, API contracts)
  - Mobile (React Native, Expo)
  - API (OpenAPI, GraphQL)
- Template Discovery Algorithm with visual flow diagram
- RLHF Score Impact documentation for template selection
- Template Capabilities Matrix for different targets
- Target and layer fields in JSON input parameters

### Documentation
- Enhanced `/03-generate-layer-code` command documentation
- Added template resolution precedence order
- Documented fallback mechanisms for missing templates
- Revealed multi-target architecture capabilities

## [2.0.0] - 2025-09-27

### Added
- Initial release of The Regent CLI
- Clean Architecture project generation
- RLHF (Reinforcement Learning from Human Feedback) scoring system
- Domain-Driven Design support
- Feature slicing architecture
- Slash commands for AI assistants
- Template-based code generation
- Multi-layer support (domain, data, infrastructure, presentation, main)
- Git workflow integration
- Automated validation and testing

### Features
- `regent init` - Initialize new Clean Architecture project
- `regent check` - Validate system requirements
- Interactive CLI with AI assistant selection
- Comprehensive templates for all architectural layers
- Built-in RLHF scoring from -2 to +2
- Support for multiple AI assistants (Claude, Gemini, Copilot, Cursor)

## [1.0.0] - 2025-09-26

### Added
- Beta release
- Basic project scaffolding
- Initial template system