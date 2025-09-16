/**
 * Input parameters for UpdateTodoUseCase
 */
export type UpdateTodoInput = {
  tenantId: string
  todoId: string
  title?: string
  description?: string
  completed?: boolean
}

/**
 * Output type for UpdateTodoUseCase
 */
export type UpdateTodoOutput = {
  id: string
  tenantId: string
  title: string
  description?: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * UpdateTodoUseCase interface
 * @description Updates an existing todo item for a specific tenant
 */
export interface UpdateTodoUseCase {
  /**
   * Execute the update todo operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   */
  execute: (input: UpdateTodoInput) => Promise<UpdateTodoOutput>
}
