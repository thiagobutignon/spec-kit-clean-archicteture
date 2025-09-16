import { vi } from 'vitest'
import type { DeleteTodoUseCase, DeleteTodoInput, DeleteTodoOutput } from '../use-cases/delete-todo'

/**
 * Creates a mock instance of DeleteTodoInput
 * @returns Mock input for testing
 */
export const mockDeleteTodoInput = (): DeleteTodoInput => ({
  tenantId: 'tenant-123',
  todoId: 'todo-123'
})

/**
 * Creates a mock instance of DeleteTodoOutput
 * @returns Mock output for testing
 */
export const mockDeleteTodoOutput = (): DeleteTodoOutput => ({
  success: true
})

/**
 * Creates a mock instance of DeleteTodoUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockDeleteTodoUseCase = (): DeleteTodoUseCase => ({
  execute: vi.fn()
})
