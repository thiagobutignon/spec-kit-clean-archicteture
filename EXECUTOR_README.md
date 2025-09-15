# Test YAML Executor

Script em JavaScript para executar o arquivo `test.yaml` e criar automaticamente o projeto Clean Task Manager.

## Uso

### Execução completa
```bash
node execute-test.js
```

### Apenas uma seção específica
```bash
node execute-test.js --section=setup
node execute-test.js --section=domain
node execute-test.js --section=presentation
node execute-test.js --section=pages
node execute-test.js --section=final
```

### Apenas tasks específicas
```bash
node execute-test.js --task=S001
node execute-test.js --task=D001
```

### Modo dry-run (visualizar sem executar)
```bash
node execute-test.js --dry-run
```

### Combinações
```bash
node execute-test.js --section=setup --dry-run
node execute-test.js --task=S001 --dry-run
```

## Funcionalidades

- ✅ Parse completo do arquivo YAML
- ✅ Execução sequencial de comandos bash
- ✅ Criação automática de arquivos e diretórios
- ✅ Logs coloridos com timestamps
- ✅ Estatísticas de execução
- ✅ Filtros por seção e task
- ✅ Modo dry-run para preview
- ✅ Tratamento de erros
- ✅ Continuação automática em caso de falha

## Estrutura do test.yaml

O script processa as seguintes seções em ordem:

1. **setup** - Configuração inicial do projeto
2. **domain** - Camada de domínio (models, use cases)
3. **presentation** - Componentes React e hooks
4. **pages** - Páginas Next.js e rotas API
5. **final** - Configuração final e inicialização

## Output

O script fornece:
- Logs detalhados de cada operação
- Indicação visual de sucesso/falha
- Estatísticas finais de execução
- Tempo total de execução
- Taxa de sucesso

## Requisitos

- Node.js (testado com v18+)
- Arquivo `test.yaml` no mesmo diretório

## Exemplo de execução

```bash
$ node execute-test.js --section=setup

[2024-09-15T15:42:00.000Z] 🔄 Reading test.yaml...
[2024-09-15T15:42:00.100Z] 🔄 Parsing YAML content...
[2024-09-15T15:42:00.150Z] Found 5 sections
[2024-09-15T15:42:00.151Z] 🚀 Starting Section: SETUP

=== Executing Task: S001 - Initialize Next.js 15 project ===
[2024-09-15T15:42:00.152Z] Running 2 commands...
[2024-09-15T15:42:00.153Z] Executing: npx create-next-app@latest clean-task-manager --typescript --tailwind --app --no-src-dir --import-alias '@/*' --eslint
...

📊 Execution Summary:
Total Tasks: 5
Completed: 5
Failed: 0
Duration: 120 seconds
Success Rate: 100%

🎉 Execution completed!
```