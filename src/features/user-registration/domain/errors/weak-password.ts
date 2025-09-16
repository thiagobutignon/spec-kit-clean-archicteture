/**
 * Error thrown when password does not meet security requirements
 * @extends Error
 */
export class WeakPasswordError extends Error {
  constructor() {
    super('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character')
    this.name = 'WeakPasswordError'
  }
}
