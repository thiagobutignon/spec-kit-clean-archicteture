# Sistema de Logging para execute-test.js

## 📝 Descrição
O sistema de logging intercepta automaticamente todos os `console.log`, `console.error` e `console.warn` do script `execute-test.js` e salva tudo em um arquivo estruturado para debugging.

## 🔧 Funcionalidades

### ✅ Interceptação Automática
- **console.log**: Interceptado e salvo como INFO
- **console.error**: Interceptado e salvo como ERROR
- **console.warn**: Interceptado e salvo como WARN

### 📊 Log Estruturado
- **Timestamp**: ISO format com precisão de milissegundos
- **Nível**: INFO, WARN, ERROR, SUCCESS, ACTION
- **Mensagem**: Limpa, sem códigos ANSI de cor
- **Metadados**: PID, ambiente, versão Node.js

### 📁 Organização de Arquivos
- **Diretório**: `logs/`
- **Arquivo padrão**: `execution.log`
- **Rotação automática**: Quando arquivo > 10MB

## 📋 Exemplo de Log

```
================================================================================
EXECUTION LOG STARTED: 2025-09-15T19:27:55.678Z
Process ID: 13301
Node Version: v22.14.0
Platform: darwin
Working Directory: /Users/thiagobutignon/dev/spec-kit-clean-archicteture
================================================================================

2025-09-15T19:27:55.680Z [INFO   ] TaskExecutor initialized with logging enabled
2025-09-15T19:27:55.680Z [INFO   ] 🔄 Reading test.yaml...
2025-09-15T19:27:55.681Z [WARN   ] Skipping section: domain
2025-09-15T19:27:55.682Z [SUCCESS] 🎉 Execution completed!

================================================================================
EXECUTION SUMMARY
================================================================================
{
  "timestamp": "2025-09-15T19:27:55.682Z",
  "executionSummary": {
    "totalTasks": 0,
    "completedTasks": 0,
    "failedTasks": 0,
    "skippedTasks": 0,
    "duration": "0 seconds",
    "successRate": "NaN%",
    "startTime": "2025-09-15T19:27:55.678Z",
    "endTime": "2025-09-15T19:27:55.682Z"
  },
  "environment": {
    "nodeVersion": "v22.14.0",
    "platform": "darwin",
    "workingDirectory": "/Users/thiagobutignon/dev/spec-kit-clean-archicteture",
    "pid": 13301
  }
}
================================================================================
```

## 🚀 Como Usar

### Execução Normal
```bash
# Logging é automático - nenhuma configuração necessária
node execute-test.js

# Log será salvo em: logs/execution.log
```

### Especificar Arquivo de Log
```javascript
// No código, modificar o construtor:
const executor = new TaskExecutor('logs/custom-log.log');
```

### Comandos de Teste
```bash
# Dry run com logging
node execute-test.js --dry-run

# Executar seção específica com logging
node execute-test.js --section=setup

# Ver log em tempo real
tail -f logs/execution.log
```

## 🔍 Detecção Automática de Níveis

O sistema detecta automaticamente o nível do log baseado no conteúdo:

- **ERROR**: Mensagens com "error", "failed", "✗"
- **WARN**: Mensagens com "warning", "warn", "skipping"
- **SUCCESS**: Mensagens com "success", "completed", "✓"
- **ACTION**: Mensagens com "executing", "running", "creating"
- **INFO**: Todas as outras mensagens

## 📂 Estrutura de Arquivos

```
project/
├── execute-test.js     # Script principal com logging
├── logs/              # Diretório de logs (criado automaticamente)
│   ├── execution.log  # Log atual
│   └── execution-2025-09-15T19-27-35-123Z.log  # Logs rotacionados
└── LOGGING.md         # Esta documentação
```

## 🛠️ Customização

### Mudar Diretório de Log
```javascript
// Modificar no construtor do TaskExecutor:
constructor(logFile = 'debug/my-custom.log') {
```

### Desabilitar Logging
```javascript
// Comentar a linha de inicialização:
// this.logger = new Logger(logFile);
```

### Filtrar Logs
O sistema automaticamente:
- Remove códigos de cor ANSI
- Remove timestamps duplicados
- Formata objetos JSON
- Detecta tipos de erro

## 🐛 Debug

Para debugar problemas com o sistema de logging:

1. **Verificar arquivo existe**: `ls -la logs/`
2. **Ver logs em tempo real**: `tail -f logs/execution.log`
3. **Verificar permissões**: `ls -la logs/execution.log`
4. **Log de erros**: Erros do logger aparecem no console original

## 🔄 Rotação de Logs

- **Tamanho máximo**: 10MB por arquivo
- **Rotação automática**: Arquivo é renomeado com timestamp
- **Formato rotacionado**: `execution-YYYY-MM-DDTHH-mm-ss-SSSZ.log`

## 💡 Benefícios

- **Debug completo**: Todo output capturado
- **Análise offline**: Logs persistem para revisão
- **Performance**: Logging assíncrono não bloqueia execução
- **Estruturado**: Fácil parsing e análise
- **Automático**: Zero configuração necessária