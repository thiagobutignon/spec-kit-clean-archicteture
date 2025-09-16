/**
 * Error thrown when the requested todo item does not exist
 * @extends Error
 */
export class TodoNotFoundError extends Error {
  constructor() {
    super('Todo item not found')
    this.name = 'TodoNotFoundError'
  }
}
