/**
 * Input parameters for CreateTodoUseCase
 */
export type CreateTodoInput = {
  tenantId: string
  title: string
  description?: string
}

/**
 * Output type for CreateTodoUseCase
 */
export type CreateTodoOutput = {
  id: string
  tenantId: string
  title: string
  description?: string
  completed: boolean
  createdAt: Date
}

/**
 * CreateTodoUseCase interface
 * @description Creates a new todo item for a specific tenant
 */
export interface CreateTodoUseCase {
  /**
   * Execute the create todo operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   */
  execute: (input: CreateTodoInput) => Promise<CreateTodoOutput>
}
