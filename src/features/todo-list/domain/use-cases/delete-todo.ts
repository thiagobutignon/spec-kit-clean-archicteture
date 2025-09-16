/**
 * Input parameters for DeleteTodoUseCase
 */
export type DeleteTodoInput = {
  tenantId: string
  todoId: string
}

/**
 * Output type for DeleteTodoUseCase
 */
export type DeleteTodoOutput = {
  success: boolean
}

/**
 * DeleteTodoUseCase interface
 * @description Deletes a todo item for a specific tenant
 */
export interface DeleteTodoUseCase {
  /**
   * Execute the delete todo operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   */
  execute: (input: DeleteTodoInput) => Promise<DeleteTodoOutput>
}
