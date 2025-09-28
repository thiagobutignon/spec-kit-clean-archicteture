# 🚀 The Regent CLI - Dogfooding Project

## 📋 Overview

This is the CLI package for The Regent, built using the system's own templates and architecture patterns. This serves as both:

1. **Dogfooding**: Testing The Regent by using it to build itself
2. **CLI Enhancement**: Creating a better CLI experience with React + Ink

## 🎯 Objectives

### Primary Goal: Validate The Regent System

By using The Regent to build its own CLI, we will:
- Test the slash command workflow
- Validate template generation
- Verify Clean Architecture compliance
- Discover and fix edge cases

### Secondary Goal: Modern CLI Experience

Create a modern CLI using:
- **React + Ink**: Interactive terminal UI
- **Clean Architecture**: Proper layer separation
- **Feature Slicing**: Modular command structure
- **TDD**: Test-driven development

## 🏗️ Architecture

```
packages/cli/
├── src/
│   ├── features/           # Feature-sliced architecture
│   │   ├── init/          # Project initialization feature
│   │   │   ├── domain/    # Business logic
│   │   │   ├── data/      # Implementation
│   │   │   ├── infra/     # External integrations
│   │   │   └── presentation/ # Ink components
│   │   ├── check/         # System check feature
│   │   └── generate/      # Template generation feature
│   ├── shared/            # Shared resources
│   └── main/             # Composition root
├── spec/                  # Generated specifications
├── .regent/              # Regent configuration
└── tests/                # Test files

```

## 🔄 Dogfooding Process

### Phase 1: Specification
```bash
# From packages/cli directory
/specify "Modern CLI for The Regent with React + Ink interface"
/plan from spec: SPEC-001 --target=frontend
```

### Phase 2: Layer Generation
```bash
# Generate each layer using templates
/01-plan-layer-features "init command" --layer=domain
/02-validate-layer-plan from json: plan.json
/03-generate-layer-code from json: validated-plan.json
/06-execute-layer-steps from yaml: implementation.yaml
```

### Phase 3: Implementation
- Use generated code as foundation
- Apply React + Ink for presentation layer
- Maintain Clean Architecture principles

## 🧪 Testing Strategy

1. **Unit Tests**: Each layer independently
2. **Integration Tests**: Layer interactions
3. **E2E Tests**: Complete CLI workflows
4. **Dogfooding Validation**: Using CLI to generate more features

## 📊 Success Metrics

- ✅ All slash commands work from packages/cli context
- ✅ Templates generate valid Clean Architecture code
- ✅ RLHF scores consistently +1 or +2
- ✅ Generated code follows all architectural principles
- ✅ CLI can generate its own features

## 🚀 Getting Started

```bash
# Initialize Regent in this directory
cd packages/cli
regent init --here --ai claude --no-git

# Start the dogfooding process
/constitution
/specify "Modern CLI for The Regent"
```

## 📝 Notes

This is an experimental dogfooding project. All discoveries, issues, and improvements will be documented and fed back into The Regent system.