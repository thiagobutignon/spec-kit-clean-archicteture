# Mapeamento de Funcionalidades: execute-steps.ts → Clean Architecture

## 📊 Status Atual do Sistema dog/

### ✅ O que já existe:
- DbExecutePlan - Use case básico
- create_file - Criação de arquivos
- delete_file - Deleção de arquivos
- Git commit básico
- Carregamento/salvamento de YAML
- FileSystem, GitRepository, Logger protocols

### ❌ O que falta (do execute-steps.ts):

## 1. 🔍 Pre-Validação de Templates
**Arquivo**: EnhancedTemplateValidator (validate-template.ts)
- Valida estrutura YAML antes de executar
- Verifica campos obrigatórios
- Valida layer/target
- **Camadas necessárias**:
  - Domain: `ValidateTemplate` use case
  - Data: `TemplateValidatorRepository` protocol
  - Infra: `YamlTemplateValidator` adapter

## 2. 🧪 Quality Checks (Lint + Test)
**Método**: runQualityChecks()
- Executa lint antes de commit
- Executa testes antes de commit
- Rollback em caso de falha
- **Camadas necessárias**:
  - Domain: `RunQualityCheck` use case
  - Data: `QualityCheckRepository` protocol
  - Infra: `NpmQualityCheckAdapter` adapter
  - Presentation: Error types (LintError, TestError)

## 3. 🤖 RLHF Scoring System
**Arquivo**: EnhancedRLHFSystem (core/rlhf-system.ts)
- Calcula scores por step
- Layer-aware scoring
- Aprende com execuções
- Gera relatórios
- **Camadas necessárias**:
  - Domain: `CalculateScore` use case
  - Data: `RLHFRepository` protocol
  - Infra: `JsonRLHFAdapter` adapter

## 4. 🔄 Git Operations Avançadas

### 4.1 Git Safety Check
**Método**: checkGitSafety()
- Verifica uncommitted changes
- Prompt interativo
- **Camadas**:
  - Domain: `CheckGitSafety` use case

### 4.2 Rollback System
**Método**: rollbackStep()
- Rollback em falha de quality check
- Restaura arquivos de HEAD
- Remove arquivos novos
- **Camadas**:
  - Domain: `RollbackStep` use case
  - Data: Estender `GitRepository` com métodos de rollback

### 4.3 Rate Limiting
**Método**: rateLimitGitOperation()
- Previne git operations excessivas
- Token bucket algorithm
- **Camadas**:
  - Infra: `RateLimiter` utility class

### 4.4 Retry Logic
**Método**: retryGitOperation()
- Exponential backoff
- Tenta novamente em falhas transientes
- **Camadas**:
  - Infra: `RetryManager` utility class

## 5. 📝 Tipos de Step Adicionais

### 5.1 refactor_file
**Handler**: handleRefactorFileStep()
- Usa <<<REPLACE>>> e <<<WITH>>>
- Substitui código existente
- **Camadas**:
  - Domain: Adicionar type ao Step model
  - Data: Método em DbExecutePlan

### 5.2 folder
**Handler**: handleFolderStep()
- Cria múltiplos diretórios
- **Camadas**:
  - Domain: Adicionar type ao Step model
  - Data: Método em DbExecutePlan

### 5.3 branch
**Handler**: handleBranchStep()
- Gerencia branches git
- **Camadas**:
  - Domain: `ManageBranch` use case
  - Data: Estender `GitRepository`

### 5.4 pull_request
**Handler**: handlePullRequestStep()
- Cria PRs via GitHub API
- **Camadas**:
  - Domain: `CreatePullRequest` use case
  - Data: `PullRequestRepository` protocol
  - Infra: `GitHubPRAdapter` adapter

## 6. 🔐 Script Validation
**Método**: validateScript(), isScriptSafe()
- Valida scripts contra allowlist
- Bloqueia comandos perigosos
- Security audit log
- **Camadas**:
  - Domain: `ValidateScript` use case
  - Presentation: `InvalidScriptError`

## 7. 📦 Package Manager Detection
**Método**: detectPackageManager()
- Detecta npm/yarn/pnpm
- Cache do resultado
- Verifica instalação
- **Camadas**:
  - Infra: `PackageManagerDetector` adapter

## 8. 🏗️ Layer Detection & Validation
**Método**: detectLayerInfo(), validateStepForLayer()
- Detecta target/layer do filename
- Valida imports por layer
- Layer-specific rules
- **Camadas**:
  - Domain: `ValidateLayer` use case
  - Data: `LayerValidatorRepository` protocol

## 9. ⚙️ Commit Configuration
**Arquivo**: .regent/config/execute.yml
**Método**: loadCommitConfig()
- Conventional commits
- Quality checks config
- Co-author
- **Camadas**:
  - Domain: `CommitConfig` model
  - Data: `ConfigRepository` protocol
  - Infra: `YamlConfigAdapter` adapter

## 10. 📋 Batch Execution
**Função**: executeBatch()
- Executa múltiplos templates
- --all, --layer=, --target=
- **Camadas**:
  - Presentation: `BatchController`
  - Domain: `ExecuteBatch` use case

## 11. 📊 Audit Log
**Método**: logAuditEvent()
- Rastreia operações de segurança
- Script validation
- Rollback events
- **Camadas**:
  - Domain: `AuditLog` model
  - Data: `AuditRepository` protocol
  - Infra: `FileAuditAdapter` adapter

## 12. 📝 Logger System
**Classe**: Logger (core/logger.ts)
- Logs em arquivo
- Múltiplos níveis
- **Camadas**:
  - Já existe como protocol em data/protocols/log/logger.ts
  - Precisa melhorar ChalkLoggerAdapter

## 13. ❗ Enhanced Error Handling
**Método**: enhanceErrorMessageWithLayerContext()
- Mensagens de erro com contexto de layer
- Guidance específica por layer
- **Camadas**:
  - Presentation: Error classes específicas por layer

## 14. 🔄 Validation Script Execution
**Método**: runValidationScript()
- Executa bash scripts
- Captura output
- Timeout handling
- **Camadas**:
  - Domain: `ExecuteValidationScript` use case
  - Data: `ScriptExecutorRepository` protocol
  - Infra: `BashScriptExecutor` adapter

## 📊 Resumo

### Total de Funcionalidades Faltantes: 14

### Arquivos Novos Necessários (~50 arquivos):

#### Domain Layer (~12 arquivos):
- models/commit-config.ts
- models/audit-log.ts
- models/quality-check-result.ts
- usecases/validate-template.ts
- usecases/run-quality-check.ts
- usecases/calculate-rlhf-score.ts
- usecases/rollback-step.ts
- usecases/check-git-safety.ts
- usecases/validate-script.ts
- usecases/validate-layer.ts
- usecases/execute-batch.ts
- usecases/execute-validation-script.ts

#### Data Layer (~10 arquivos):
- protocols/template/template-validator-repository.ts
- protocols/quality/quality-check-repository.ts
- protocols/rlhf/rlhf-repository.ts
- protocols/config/config-repository.ts
- protocols/audit/audit-repository.ts
- protocols/script/script-executor-repository.ts
- usecases/template/db-validate-template.ts
- usecases/quality/db-run-quality-check.ts
- usecases/rlhf/db-calculate-score.ts
- usecases/batch/db-execute-batch.ts

#### Infra Layer (~15 arquivos):
- template/yaml-template-validator.ts
- quality/npm-quality-check-adapter.ts
- rlhf/json-rlhf-adapter.ts
- config/yaml-config-adapter.ts
- audit/file-audit-adapter.ts
- script/bash-script-executor.ts
- git/enhanced-git-repository.ts (estender ZxGitRepository)
- utils/rate-limiter.ts
- utils/retry-manager.ts
- utils/package-manager-detector.ts
- pr/github-pr-adapter.ts
- layer/layer-validator.ts
- errors/error-enhancer.ts
- log/enhanced-logger-adapter.ts
- security/script-validator.ts

#### Presentation Layer (~5 arquivos):
- controllers/batch/execute-batch-controller.ts
- errors/lint-error.ts
- errors/test-error.ts
- errors/invalid-script-error.ts
- errors/layer-violation-error.ts

#### Main Layer (~8 arquivos):
- factories/usecases/validate-template-factory.ts
- factories/usecases/run-quality-check-factory.ts
- factories/usecases/calculate-score-factory.ts
- factories/usecases/rollback-step-factory.ts
- factories/usecases/check-git-safety-factory.ts
- factories/controllers/batch-controller-factory.ts
- config/execute-config.ts
- adapters/enhanced-executor-adapter.ts

## 🎯 Próximos Passos

1. Criar um novo `implement-executor.regent` completo
2. Executar com o sistema atual (scripts/execute-steps.ts)
3. Resultado: Sistema dog/ completo com todas as funcionalidades
4. Testar executando o implement.regent original

## 💡 Benefícios

Após implementação completa, o sistema dog/ terá:
- ✅ Mesmas funcionalidades que execute-steps.ts
- ✅ Arquitetura limpa e testável
- ✅ Separação de concerns clara
- ✅ Fácil manutenção e extensão
- ✅ Código reutilizável em outros projetos
