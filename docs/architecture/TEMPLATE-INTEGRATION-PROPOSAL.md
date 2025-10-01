# Integração dos Templates Clean Architecture com Spec-Kit Workflow

## Visão Geral

Este documento descreve como os templates Clean Architecture (.regent) se integram com o workflow de 7 comandos do spec-kit, criando um fluxo unificado de desenvolvimento spec-driven com arquitetura limpa.

## A Revolução: Desenvolvimento Determinístico com IA

### 🎯 O Problema Fundamental das Ferramentas de IA Atuais

**A "Loteria da IA"**: A maioria das ferramentas de IA produz resultados inconsistentes e imprevisíveis. A mesma especificação pode gerar qualidade, estrutura e padrões arquiteturais vastamente diferentes.

#### Era do Scaffolding Tradicional
- **Geradores CRUD básicos**: Padrões rígidos exigindo adaptação manual extensa
- **Scaffolding de configuração**: Estrutura fornecida, arquitetura deixada para desenvolvedores
- **Resultado**: Nunca saía como deveria, sempre precisava de retrabalho significativo

#### Era da IA 100% Generativa
- **Qualidade variável**: Arquivos 200+ linhas com organização inconsistente
- **Caos arquitetural**: Sem padrões enforçados ou estruturas comprovadas
- **Resultados imprevisíveis**: Mesma entrada produz saídas diferentes

### 🏗️ Nossa Solução: Arquitetura "Sempre Greenfield"

Resolvemos o desafio fundamental: **Como tornar o desenvolvimento com IA determinístico e previsível**

#### **🎯 Desenvolvimento Sempre Greenfield**
- **Feature Slices**: Cada caso de uso é autocontido e independente
- **Transformação de Legacy**: Transforma codebases brownfield em features greenfield
- **Zero Dívida Arquitetural**: Implementação fresca e limpa sempre
- **Crescimento Modular**: Cada feature segue os mesmos padrões comprovados

#### **👨‍💻 Simulação de Workflow de Dev Senior**
- **Ciclo TDD Profissional**: Branch → Teste Red → Código Green → Refactor → Commit
- **Desenvolvimento Atômico**: Cada passo é significativo e rastreável
- **Code Review Integrado**: Garantia de qualidade integrada em cada mudança
- **Processo Previsível**: Mesmo workflow produz mesmos resultados de alta qualidade

#### **🏗️ Template Guardrails + Inteligência de IA**
- **Arquivos `.regent`**: Esqueleto arquitetural que a IA não pode violar
- **Geração Inteligente**: IA preenche templates com lógica específica do domínio
- **Limites Estruturados**: Criatividade da IA dentro de restrições arquiteturais comprovadas
- **Enforcement de Consistência**: Conformidade com Clean Architecture garantida

#### **🧠 Framework de Aprendizado Contínuo (RLHF)**
- **Melhoria em Tempo Real**: Execução de código ruim dispara melhorias nos templates
- **Reconhecimento de Padrões**: Sistema aprende com padrões bem-sucedidos e malsucedidos
- **Evolução de Templates**: Templates se adaptam baseados em dados de uso real
- **Loop de Feedback de Qualidade**: Melhoria contínua baseada em resultados reais

#### **🔍 Integração de Contexto Avançado**
- **Serena MCP**: Análise avançada de codebase e busca inteligente
- **Context7 MCP**: Conhecimento de programação sempre atual e melhores práticas
- **Chrome DevTools MCP**: Debug em tempo real e insights de performance
- **Contexto Rico**: Informação precisa e verificada vs alucinações de IA

### 🎯 Por Que Isso Torna o Desenvolvimento Determinístico

**Brownfield → Greenfield**: Transforma complexidade legacy em features limpas e modulares

**Enterprise em Velocidade de IA**: Padrões de desenvolvimento profissional em velocidade máxima

**Fim da Loteria de IA**: Resultados consistentes e previsíveis ao invés de geração variável

**Sempre Limpo**: Cada feature mantém integridade arquitetural e qualidade

**Excelência Escalável**: Padrões funcionam desde protótipo até escala enterprise

Este é um paradigma shift de geração de IA imprevisível para desenvolvimento determinístico e profissional que consistentemente produz resultados enterprise-grade.

## Workflow Spec-Kit + Clean Architecture

```mermaid
graph TD
    A[1. /constitution] --> B[2. /specify]
    B --> C[3. /clarify]
    C --> D[4. /plan]
    D --> E[5. /tasks]
    E --> F[6. /analyze]
    F --> G[7. /implement]

    D -.-> H[Templates Clean Architecture]
    G -.-> H

    style H fill:#f9f,stroke:#333,stroke-width:4px
```

## Pontos de Integração

### 1. `/constitution` - Define Princípios
**Integração**: Adicionar princípios Clean Architecture ao constitution.md

```markdown
## Core Principles

### I. Clean Architecture Layers
- Domain layer: Pure business logic, no dependencies
- Data layer: Repositories and data sources
- Presentation layer: UI and controllers
- Infrastructure layer: Framework-specific implementations
- Main layer: Dependency injection and app initialization

### II. Dependency Rule
- Dependencies point inward only (Presentation → Domain ← Data)
- Domain layer has zero external dependencies
- Interfaces defined in domain, implemented in outer layers
```

### 2. `/specify` - Cria Especificação
**Integração**: Especificação deve identificar:
- Entidades do domínio
- Casos de uso principais
- Fontes de dados necessárias
- Interfaces de usuário requeridas

```markdown
## Key Entities
- User (domain entity)
- Order (domain entity)
- Product (domain entity)

## Use Cases
- CreateUserUseCase
- GetOrderDetailsUseCase
- UpdateProductUseCase
```

### 3. `/clarify` - Resolve Ambiguidades
**Sem mudanças** - Funciona normalmente para esclarecer requisitos

### 4. `/plan` - Cria Plano de Implementação ⚡ **PONTO CRÍTICO**

**Integração**: O plan-template.md deve:
1. Analisar a especificação
2. Determinar tipo de projeto (backend, frontend, fullstack)
3. **Definir estrutura baseada nos templates Clean Architecture**

```markdown
## Project Structure (Clean Architecture)

### Backend Structure
```
backend/
├── domain/           # [backend-domain-template.regent]
│   ├── entities/
│   ├── usecases/
│   └── repositories/
├── data/            # [backend-data-template.regent]
│   ├── datasources/
│   └── repositories/
├── presentation/    # [backend-presentation-template.regent]
│   ├── controllers/
│   └── routes/
├── infrastructure/  # [backend-infra-template.regent]
│   ├── database/
│   └── external/
└── main/           # [backend-main-template.regent]
    └── index.ts
```

### Frontend Structure
[Similar com frontend templates]
```

**Processo**:
1. `/plan` analisa requisitos
2. Identifica camadas necessárias
3. Mapeia para templates apropriados
4. Define dependências entre camadas

### 5. `/tasks` - Gera Lista de Tarefas ⚡ **PONTO CRÍTICO**

**Integração**: Tasks organizadas por camada seguindo Clean Architecture

```markdown
## Phase 3.1: Domain Layer (Zero Dependencies)
- [ ] T001 [P] Create User entity in domain/entities/user.ts
- [ ] T002 [P] Create Order entity in domain/entities/order.ts
- [ ] T003 [P] Create UserRepository interface in domain/repositories/
- [ ] T004 [P] Create CreateUserUseCase in domain/usecases/

## Phase 3.2: Data Layer (Implements Domain Interfaces)
- [ ] T005 [P] Implement UserRepository in data/repositories/
- [ ] T006 [P] Create UserDataSource in data/datasources/
- [ ] T007 [P] Create database models in data/models/

## Phase 3.3: Presentation Layer
- [ ] T008 Create UserController in presentation/controllers/
- [ ] T009 Define routes in presentation/routes/
- [ ] T010 Create DTOs in presentation/dto/

## Phase 3.4: Infrastructure Layer
- [ ] T011 Setup database connection in infrastructure/database/
- [ ] T012 Configure external services in infrastructure/external/

## Phase 3.5: Main Layer (Dependency Injection)
- [ ] T013 Configure DI container in main/container.ts
- [ ] T014 Wire all dependencies in main/index.ts
```

**Regras**:
- Domain tasks primeiro (zero dependencies)
- Data/Presentation em paralelo (dependem só do domain)
- Infrastructure pode ser paralelo
- Main por último (precisa de todas as camadas)

### 6. `/analyze` - Analisa Consistência
**Integração**: Adicionar verificações Clean Architecture

```markdown
## Clean Architecture Validation
- [ ] Domain layer has zero external imports
- [ ] No circular dependencies between layers
- [ ] All use cases have corresponding repository interfaces
- [ ] All controllers use only use cases (not repositories directly)
- [ ] Dependency injection properly configured
```

### 7. `/implement` - Executa Implementação ⚡ **PONTO MÁXIMO**

**Integração**: Aqui acontece a mágica híbrida - scaffolding + generation!

#### Modelo Híbrido em Ação

```typescript
// Processo híbrido de implementação
async function implementTask(task: Task) {
  // 1. SCAFFOLDING: Carrega template estrutural
  const layer = detectLayer(task); // domain, data, presentation, etc.
  const template = loadTemplate(layer); // backend-domain-template.regent

  // Template contém:
  // - Estrutura de pastas e arquivos
  // - Interfaces e contratos pré-definidos
  // - Padrões arquiteturais (Repository, UseCase, etc.)
  // - AI-NOTEs para guiar a geração

  // 2. GENERATIVO: AI preenche template com contexto específico
  const code = await generateFromTemplate(template, {
    entities: spec.entities,        // Ex: User, Order, Product
    useCases: spec.useCases,        // Ex: CreateUser, UpdateOrder
    repositories: spec.repositories, // Ex: UserRepository interface
    businessRules: spec.rules,      // Lógica específica do domínio
  });

  // 3. RESULTADO: Código estruturado + implementação específica
  // - Estrutura garantida pelo template
  // - Lógica de negócio gerada pela AI
  // - Best practices enforçadas automaticamente

  await writeFiles(code, task.targetPath);
}
```

**Fluxo de Execução**:
1. Para cada task, identifica a camada
2. Carrega o template .regent correspondente
3. Extrai informações da spec (entities, use cases, etc.)
4. Gera código usando o template
5. Escreve arquivos respeitando a estrutura

## Adaptações Necessárias nos Templates

### 1. Templates de Comando
Modificar para awareness de Clean Architecture:

```markdown
# templates/commands/plan.md
- Adicionar lógica para escolher templates por camada
- Definir estrutura baseada em Clean Architecture

# templates/commands/tasks.md
- Organizar tasks por camada
- Respeitar dependency rule

# templates/commands/implement.md
- Executar templates .regent apropriados
- Validar dependency rule durante geração
```

### 2. Templates Regent
Os templates já existentes são perfeitos! Só precisam ser:
1. Integrados ao comando `/implement`
2. Parametrizados com dados da spec
3. Executados na ordem correta (domain first)

## Exemplo Completo de Fluxo

```bash
# 1. Define princípios Clean Architecture
/constitution

# 2. Especifica feature
/specify "Create user management system with authentication"
# → Identifica: User entity, auth use cases, user repository

# 3. Esclarece dúvidas
/clarify
# → Define: JWT auth, PostgreSQL, REST API

# 4. Planeja implementação
/plan
# → Mapeia para estrutura Clean Architecture
# → Define quais templates usar (backend-*.regent)

# 5. Gera tarefas
/tasks
# → T001-T004: Domain layer (entities, use cases)
# → T005-T007: Data layer (repositories, datasources)
# → T008-T010: Presentation (controllers, routes)
# → T011-T012: Infrastructure (database, JWT)
# → T013-T014: Main (DI, bootstrap)

# 6. Analisa consistência
/analyze
# → Verifica dependency rule
# → Confirma cobertura de todas as camadas

# 7. Implementa
/implement
# → Executa backend-domain-template.regent para T001-T004
# → Executa backend-data-template.regent para T005-T007
# → Executa backend-presentation-template.regent para T008-T010
# → Executa backend-infra-template.regent para T011-T012
# → Executa backend-main-template.regent para T013-T014
```

## Por Que Esta Abordagem É Revolucionária

### 🚀 Resultados do Desenvolvimento Determinístico

| Aspecto | Ferramentas Tradicionais de IA | Spec-Kit Clean Architecture |
|---------|------------------------------|---------------------------|
| **Resultados** | Variáveis ("loteria de IA") | Determinísticos e previsíveis |
| **Arquitetura** | Inconsistente | Clean Architecture sempre |
| **Workflow** | Ad-hoc | Simulação de dev senior |
| **Código Legacy** | Fica mais complexo | Se transforma em greenfield |
| **Qualidade** | Imprevisível | Consistência enterprise |
| **Manutenção** | Difícil | Sempre limpa e modular |

### 🎯 Cenários de Aplicação

#### 🆕 **Projetos Greenfield**
- Arquitetura Clean desde a inicialização do projeto
- Padrões TDD built-in
- Princípios DDD integrados

#### 🔧 **Projetos Brownfield**
- Melhorias incrementais baseadas em features
- Arquitetura modular previne contaminação legacy
- Processos de refatoração seguros e guiados

**Resultado**: Desenvolvimento modular de features permite crescimento limpo e incremental em qualquer contexto de codebase.

## Implementação Proposta

### Fase 1: Adaptar Comandos (1 semana)
- [ ] Modificar plan-template.md para considerar camadas
- [ ] Adaptar tasks-template.md para organizar por camada
- [ ] Atualizar implement.md para executar templates

### Fase 2: Integrar Templates (1 semana)
- [ ] Criar engine de execução de templates .regent
- [ ] Parametrizar templates com dados da spec
- [ ] Implementar validação de dependency rule

### Fase 3: Validação (1 semana)
- [ ] Criar projeto exemplo completo
- [ ] Testar fluxo end-to-end
- [ ] Documentar processo

## Conclusão

Os templates Clean Architecture se encaixam **perfeitamente** no workflow spec-kit:

1. **Durante `/plan`**: Define estrutura de camadas
2. **Durante `/tasks`**: Organiza tarefas por camada
3. **Durante `/implement`**: Executa templates para gerar código

Isso cria um sistema poderoso onde:
- Especificações dirigem a arquitetura
- Templates garantem consistência
- Clean Architecture mantém qualidade
- Automação acelera desenvolvimento

---

*Proposta criada: 2025-09-27*
*Projeto: spec-kit-clean-architecture*