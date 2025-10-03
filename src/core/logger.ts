// Using namespace import for native Node.js 'fs' module (not fs-extra)
// This is correct and not affected by the ESM bug - native fs works fine with namespace imports
// Only fs-extra requires default import in ESM/tsx context
import * as fs from 'fs';
import path from 'path';

// Usaremos um nome de arquivo de log consistente para cada execução
const LOG_FILE_NAME = 'execution.log';

class Logger {
  private logFilePath: string;
  private logStream: fs.WriteStream;

  constructor(logDirectory: string) {
    // Garante que o diretório de logs exista
    fs.mkdirSync(logDirectory, { recursive: true });
    this.logFilePath = path.join(logDirectory, LOG_FILE_NAME);

    // Cria um stream de escrita para o arquivo de log.
    // A flag 'a' significa 'append', então não sobrescrevemos o log a cada execução.
    this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
    
    console.log(`📝 Logging to: ${this.logFilePath}`);
  }

  public log(message: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}\n`;

    // Escreve no console
    process.stdout.write(formattedMessage);
    // E escreve no arquivo de log
    this.logStream.write(formattedMessage);
  }

  public error(message: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [ERROR] ${message}\n`;

    process.stderr.write(formattedMessage);
    this.logStream.write(formattedMessage);
  }

  public close(): void {
    this.logStream.end();
  }
}

export default Logger;