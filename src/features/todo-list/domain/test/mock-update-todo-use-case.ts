import { vi } from 'vitest'
import type { UpdateTodoUseCase, UpdateTodoInput, UpdateTodoOutput } from '../use-cases/update-todo'

/**
 * Creates a mock instance of UpdateTodoInput
 * @returns Mock input for testing
 */
export const mockUpdateTodoInput = (): UpdateTodoInput => ({
  tenantId: 'tenant-123',
  todoId: 'todo-123',
  title: 'Updated Todo Item',
  completed: true
})

/**
 * Creates a mock instance of UpdateTodoOutput
 * @returns Mock output for testing
 */
export const mockUpdateTodoOutput = (): UpdateTodoOutput => ({
  id: 'todo-123',
  tenantId: 'tenant-123',
  title: 'Updated Todo Item',
  description: 'This is an updated todo item',
  completed: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-02T00:00:00Z')
})

/**
 * Creates a mock instance of UpdateTodoUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockUpdateTodoUseCase = (): UpdateTodoUseCase => ({
  execute: vi.fn()
})
