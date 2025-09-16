/**
 * Error thrown when todo data validation fails
 * @extends Error
 */
export class InvalidTodoDataError extends Error {
  constructor() {
    super('Invalid todo data provided')
    this.name = 'InvalidTodoDataError'
  }
}
