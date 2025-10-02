export interface Logger {
  log: (message: string) => void
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string, error?: Error) => void
  success: (message: string) => void
}
