export class LayerViolationError extends Error {
  constructor (
    public readonly layer: string,
    public readonly violations: string[]
  ) {
    super(`Layer violation in ${layer}: ${violations.join(', ')}`)
    this.name = 'LayerViolationError'
  }
}
