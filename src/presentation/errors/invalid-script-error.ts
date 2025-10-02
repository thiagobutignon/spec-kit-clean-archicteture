export class InvalidScriptError extends Error {
  constructor (public readonly script: string, reason: string) {
    super(`Invalid script "${script}": ${reason}`)
    this.name = 'InvalidScriptError'
  }
}
