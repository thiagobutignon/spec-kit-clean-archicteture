import { type Logger } from '@/data/protocols/log/logger'
import chalk from 'chalk'

export class ChalkLoggerAdapter implements Logger {
  log (message: string): void {
    console.log(message)
  }

  info (message: string): void {
    console.log(chalk.blue.bold(message))
  }

  warn (message: string): void {
    console.log(chalk.yellow(message))
  }

  error (message: string, error?: Error): void {
    console.error(chalk.red.bold(message))
    if (error?.stack) {
      console.error(chalk.red(error.stack))
    }
  }

  success (message: string): void {
    console.log(chalk.green(message))
  }
}
