/**
 * Input parameters for ListTodosUseCase
 */
export type ListTodosInput = {
  tenantId: string
  completed?: boolean
}

/**
 * Output type for ListTodosUseCase
 */
export type ListTodosOutput = {
  todos: Array<{
    id: string
    tenantId: string
    title: string
    description?: string
    completed: boolean
    createdAt: Date
    updatedAt?: Date
  }>
}

/**
 * ListTodosUseCase interface
 * @description Lists all todo items for a specific tenant
 */
export interface ListTodosUseCase {
  /**
   * Execute the list todos operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   */
  execute: (input: ListTodosInput) => Promise<ListTodosOutput>
}
