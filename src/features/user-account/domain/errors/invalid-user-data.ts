/**
 * Error thrown when required fields are invalid or missing
 * @extends Error
 */
export class InvalidUserDataError extends Error {
  constructor() {
    super('Invalid or missing required user data')
    this.name = 'InvalidUserDataError'
  }
}
