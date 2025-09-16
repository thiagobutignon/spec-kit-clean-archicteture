/**
 * Error thrown when the email is already registered
 * @extends Error
 */
export class UserAlreadyExistsError extends Error {
  constructor() {
    super('User with this email already exists')
    this.name = 'UserAlreadyExistsError'
  }
}
