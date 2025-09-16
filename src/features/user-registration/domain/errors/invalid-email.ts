/**
 * Error thrown when an invalid email format is provided
 * @extends Error
 */
export class InvalidEmailError extends Error {
  constructor() {
    super('The provided email address is not valid')
    this.name = 'InvalidEmailError'
  }
}
