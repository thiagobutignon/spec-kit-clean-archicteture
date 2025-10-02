export class LintError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'LintError'
  }
}
