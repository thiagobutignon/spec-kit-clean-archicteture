# 🏗️ Spec-Kit Clean Architecture

> **Deterministic Software Development with AI-Powered RLHF and Clean Architecture**

[![RLHF Score](https://img.shields.io/badge/RLHF%20Score-+2%20PERFECT-brightgreen)](https://github.com/thiagobutignon/spec-kit-clean-archicteture)
[![Clean Architecture](https://img.shields.io/badge/Clean%20Architecture-✓-blue)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
[![DDD](https://img.shields.io/badge/Domain%20Driven%20Design-✓-purple)](https://martinfowler.com/tags/domain%20driven%20design.html)

## 📋 Overview

Spec-Kit Clean Architecture is an evolution of [GitHub's Spec-Kit](https://github.com/github/spec-kit), enhanced with intelligent RLHF (Reinforcement Learning from Human Feedback) scoring system for deterministic software development. This framework ensures your code follows Clean Architecture, DDD, TDD, and SOLID principles through automated validation and continuous improvement.

### 🎯 Key Features

- **🤖 Intelligent RLHF Scoring System** (-2 to +2) for automated quality assessment
- **🏛️ Clean Architecture Enforcement** with domain layer purity validation
- **🔄 Self-Healing Capabilities** with auto-fix for common issues
- **📊 Performance Optimization** with pattern caching and progress reporting
- **🛡️ Rollback Mechanism** for safe recovery from failures
- **🔍 Deep Code Search** using [Serena](https://github.com/sapientinc/HRM) and Context7 for external libraries
- **📚 Ubiquitous Language Support** for Domain-Driven Design
- **✅ Works for both Green Field and Brown Field projects**

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/thiagobutignon/spec-kit-clean-archicteture.git
cd spec-kit-clean-archicteture

# Install dependencies
yarn install

# Run domain generation
npx tsx execute-steps.ts implementation.yaml

# View RLHF dashboard
npx tsx rlhf-dashboard.ts
```

## 📖 Architecture Principles

This framework enforces best practices through automated validation:

- **Clean Architecture** - Separation of concerns with pure domain layer
- **DDD (Domain-Driven Design)** - Ubiquitous language and bounded contexts
- **TDD (Test-Driven Development)** - Test helpers for every use case
- **SOLID Principles** - Single responsibility, open/closed, etc.
- **KISS (Keep It Simple, Stupid)** - Simplicity over complexity
- **YAGNI (You Aren't Gonna Need It)** - No premature optimization
- **DRY (Don't Repeat Yourself)** - Code reusability

## 🤖 RLHF Scoring System

The intelligent scoring system evaluates code quality in real-time:

| Score | Level | Description |
|-------|-------|-------------|
| **+2** | 🏆 PERFECT | Clean Architecture + DDD + Ubiquitous Language |
| **+1** | ✅ GOOD | Valid implementation following patterns |
| **0** | ⚠️ LOW CONFIDENCE | Missing references or documentation |
| **-1** | ❌ RUNTIME ERROR | Lint failures, test failures |
| **-2** | 💥 CATASTROPHIC | Architecture violations |

## 📁 Project Structure

```
spec-kit-clean-archicteture/
├── .claude/
│   └── commands/        # AI command documentation
├── templates/           # Domain generation templates
├── .rlhf/              # RLHF learning data and metrics
├── *.ts                # Core system files
└── README.md
```

**Note**: The `backend/`, `frontend/`, and `src/` directories are example implementations and should be ignored for framework usage.

## 📚 Commands Documentation

### Core Commands

All commands are documented in `.claude/commands/` for AI-assisted development:

#### Domain Generation Commands

- **`pre-tasks-domain.md`** - Planning phase for domain layer generation with RLHF scoring awareness
- **`validate-domain-json.md`** - JSON validation with score impact assessment (-2 to +2)
- **`tasks-domain.md`** - Main domain generation with quality guidelines
- **`reflection-tasks-domain.md`** - Architectural reflection with score optimization
- **`evaluate-tasks-domain.md`** - Pre-execution evaluation with score prediction
- **`execute-domain.md`** - Execution with real-time RLHF scoring
- **`fix-failed-step.md`** - Intelligent fix suggestions for failed steps
- **`apply-rlhf-learnings.md`** - Apply learned patterns for continuous improvement

### System Tools

#### Core Executors
- **`execute-steps.ts`** - Main step executor with RLHF scoring
- **`validate-implementation.ts`** - Template validation with quality indicators
- **`rlhf-system.ts`** - RLHF scoring engine with pattern learning
- **`rlhf-dashboard.ts`** - Visual dashboard for metrics and scores
- **`rlhf-autofix.ts`** - Automatic fix system for common issues
- **`rollback-manager.ts`** - Safe rollback and recovery system
- **`logger.ts`** - Centralized logging with audit trails

## 🔧 Configuration

### Templates

The main template `templates/DOMAIN_TEMPLATE.yaml` includes:
- Ubiquitous language definitions
- Git workflow automation (branch → implementation → PR)
- Domain layer structure
- Use case interfaces
- Error classes
- Test helpers with mock data

### RLHF Learning

The system continuously learns from executions:
- Pattern analysis and caching
- Success/failure tracking
- Automatic improvements
- Performance optimization

## 🌟 Features

### For Green Field Projects
- Generate complete domain layer from scratch
- Enforce Clean Architecture from day one
- Automated test helper generation
- Git workflow automation

### For Brown Field Projects
- Gradual refactoring with safety checks
- Architecture violation detection
- Rollback capabilities for failed changes
- Incremental improvements with RLHF scoring

## 🛠️ Advanced Usage

### Auto-Fix System
```bash
# Automatically fix common issues
npx tsx rlhf-autofix.ts implementation.yaml --validate
```

### Rollback Management
```bash
# Create backup before risky operations
npx tsx rollback-manager.ts backup

# Rollback failed step
npx tsx rollback-manager.ts rollback <step-id>

# Rollback all failed steps
npx tsx rollback-manager.ts rollback-all implementation.yaml
```

### RLHF Analytics
```bash
# View dashboard
npx tsx rlhf-dashboard.ts

# Export HTML report
npx tsx rlhf-dashboard.ts export

# Apply learned improvements
npx tsx rlhf-system.ts apply
```

## 🔍 Deep Search Integration with HRM (Hierarchical Reasoning Model)

### Understanding HRM in Software Engineering

The [Hierarchical Reasoning Model (HRM)](https://github.com/sapientinc/HRM) from Sapient Inc. introduces a revolutionary approach to code analysis through hierarchical reasoning. Unlike traditional RLHF which focuses on model training, our implementation leverages HRM concepts for:

#### 🧠 Hierarchical Code Analysis
```
High-Level Planning → Domain Understanding → Use Case Mapping
         ↓                    ↓                    ↓
Low-Level Execution → Code Generation → Pattern Recognition
```

- **Level 1 (Strategic)**: Architectural patterns and domain boundaries
- **Level 2 (Tactical)**: Use cases, entities, and value objects
- **Level 3 (Implementation)**: Specific code patterns and syntax

#### 🎯 HRM Application in Clean Architecture

1. **Pattern Recognition Hierarchy**
   - **Domain Layer**: Pure business logic patterns (RLHF +2)
   - **Application Layer**: Use case orchestration patterns (RLHF +1)
   - **Infrastructure Layer**: Integration patterns (RLHF 0)

2. **Recursive Reasoning**
   - Analyze code at multiple abstraction levels simultaneously
   - Detect architectural violations through hierarchical pattern matching
   - Self-correct based on learned patterns from successful implementations

3. **Adaptive Learning Cycles**
   ```typescript
   // HRM-inspired learning cycle
   for (let cycle = 0; cycle < MAX_CYCLES; cycle++) {
     const analysis = analyzeCodeHierarchy(implementation);
     const score = calculateRLHFScore(analysis);

     if (score >= TARGET_SCORE) break;

     const improvements = generateImprovements(analysis);
     implementation = applyImprovements(implementation, improvements);
   }
   ```

### Serena Integration
The framework integrates with [Serena](https://github.com/sapientinc/HRM) for semantic code search:
- **Hierarchical Symbol Analysis**: Navigate code at different abstraction levels
- **Pattern Matching**: Find similar patterns across the codebase
- **Context-Aware Refactoring**: Understand impact across architectural layers
- **Memory System**: Retain project knowledge for future reasoning

### Context7 Integration
External library documentation through Context7:
- **Real-time Library Analysis**: Understand external dependencies
- **Pattern Extraction**: Learn from library best practices
- **API Mapping**: Connect domain concepts to library implementations
- **Cross-Reference Learning**: Apply patterns from successful libraries

### 🔬 Deep Learning Without Training

Our HRM implementation differs from traditional ML approaches:

| Traditional RLHF | Our HRM Implementation |
|------------------|------------------------|
| Model training required | No training needed |
| Large datasets needed | Works with single project |
| GPU intensive | Runs on CPU |
| Static after training | Continuously adapts |
| General purpose | Domain-specific |

#### Key Innovations:

1. **Hierarchical Pattern Database**
   ```yaml
   patterns:
     architectural:
       - clean_architecture: weight: 1.0
       - ddd_boundaries: weight: 0.9
     tactical:
       - use_case_interface: weight: 0.8
       - value_object_pattern: weight: 0.7
     implementation:
       - typescript_types: weight: 0.6
       - test_coverage: weight: 0.5
   ```

2. **Multi-Level Scoring**
   - Each hierarchical level contributes to final RLHF score
   - Weighted average based on architectural importance
   - Self-balancing based on project characteristics

3. **Reasoning Chains**
   - Traces decision paths through code
   - Explains why certain patterns are preferred
   - Provides actionable improvement suggestions

## 📊 Performance

- **Pattern Caching**: 5-minute cache with LRU eviction
- **Progress Reporting**: Visual progress bars with persistence
- **Memory Management**: Bounded cache size (100 entries max)
- **Resumable Operations**: Progress saved for recovery

## 🤝 Credits

This project builds upon excellent work from the community:

### Core Inspiration
- **[GitHub Spec-Kit](https://github.com/github/spec-kit)** - The original specification framework that inspired this project
- **[Rodrigo Manguinho](https://github.com/rmanguinho)** - Clean Architecture patterns and TDD best practices
- **[Sapient HRM](https://github.com/sapientinc/HRM)** - Deep search capabilities and semantic understanding

### Technologies
- **TypeScript** - Type-safe development
- **YAML** - Configuration and templates
- **Claude AI** - Intelligent code generation
- **MCP Servers** - Serena and Context7 integration

## 📈 Roadmap

- [ ] Visual Studio Code extension
- [ ] GitHub Actions integration
- [ ] Multi-language support (Python, Go, Rust)
- [ ] Cloud deployment templates
- [ ] Advanced RLHF training modes

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/thiagobutignon/spec-kit-clean-archicteture/issues)
- **Discussions**: [GitHub Discussions](https://github.com/thiagobutignon/spec-kit-clean-archicteture/discussions)
- **Documentation**: [Wiki](https://github.com/thiagobutignon/spec-kit-clean-archicteture/wiki)

## 🏆 Why Use Spec-Kit Clean Architecture?

1. **Deterministic Development**: Predictable, repeatable results
2. **Quality Assurance**: Automated RLHF scoring ensures high quality
3. **Architecture Compliance**: Enforces Clean Architecture principles
4. **Self-Improving**: Learns from mistakes and successes
5. **Safe Refactoring**: Rollback capabilities protect your code
6. **Developer Experience**: Visual feedback and progress tracking
7. **Best Practices**: Enforces TDD, DDD, SOLID automatically

---

<div align="center">
  <strong>Built with ❤️ for developers who care about code quality</strong>
  <br>
  <sub>Powered by Claude AI and the open-source community</sub>
</div>