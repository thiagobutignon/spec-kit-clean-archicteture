/**
 * Error thrown when attempting to register a user that already exists
 * @extends Error
 */
export class UserAlreadyExistsError extends Error {
  constructor() {
    super('A user with this email already exists')
    this.name = 'UserAlreadyExistsError'
  }
}
