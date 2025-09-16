/**
 * Error thrown when the requested user does not exist
 * @extends Error
 */
export class UserNotFoundError extends Error {
  constructor() {
    super('User with the given ID was not found')
    this.name = 'UserNotFoundError'
  }
}
