# 🐕 Dogfooding The Regent CLI

## Purpose

This document tracks the dogfooding process of using The Regent to build its own CLI with React + Ink.

## Strategy

### Phase 1: Foundation Setup ✅
- [x] Create packages/cli directory structure
- [x] Initialize package.json with Ink dependencies
- [x] Set up TypeScript configuration
- [x] Create initial documentation

### Phase 2: Regent Initialization (Next)
- [ ] Run `regent init --here --ai claude --no-git`
- [ ] Execute `/constitution` to establish principles
- [ ] Create specifications with `/specify`

### Phase 3: Feature Generation
- [ ] Generate `init` command feature
- [ ] Generate `check` command feature
- [ ] Generate `generate` command feature

### Phase 4: Layer Implementation
Using The Regent's own commands:
- [ ] `/01-plan-layer-features` for domain layer
- [ ] `/02-validate-layer-plan` for validation
- [ ] `/03-generate-layer-code` for YAML generation
- [ ] `/06-execute-layer-steps` for execution

## Expected Outcomes

1. **Validate Path Resolution**: Confirm `./spec/` paths work correctly
2. **Test Template Substitution**: Verify `__PLACEHOLDER__` patterns
3. **Clean Architecture Compliance**: Ensure proper layer separation
4. **RLHF Scoring**: Achieve consistent +1 or +2 scores

## Discovered Issues

### Fixed in PR #73:
- ✅ Hardcoded paths causing files in wrong location
- ✅ Inconsistent placeholder patterns
- ✅ Mermaid diagram syntax errors

### To Be Discovered:
- (Will be documented as we proceed)

## Architecture Decisions

### Why React + Ink?
- Modern terminal UI capabilities
- Component-based architecture aligns with Clean Architecture
- Rich ecosystem of Ink components
- TypeScript support for type safety

### Feature Slicing Strategy
Each CLI command is a feature slice:
```
features/
├── init/          # regent init command
├── check/         # regent check command
└── generate/      # template generation
```

### Clean Architecture Layers
- **Domain**: Command interfaces and business logic
- **Data**: Command implementations
- **Infrastructure**: File system, git operations
- **Presentation**: Ink components for UI
- **Main**: CLI composition and dependency injection

## Next Steps

1. Initialize Regent in packages/cli
2. Run `/constitution` to establish CLI principles
3. Create feature specifications
4. Generate code using slash commands
5. Document any issues or discoveries

## Success Criteria

- ✅ All commands work from packages/cli context
- ✅ Templates generate valid code
- ✅ No manual path adjustments needed
- ✅ Clean Architecture maintained throughout
- ✅ CLI can generate its own features

## Notes

This is a live dogfooding exercise. All findings will improve The Regent system.