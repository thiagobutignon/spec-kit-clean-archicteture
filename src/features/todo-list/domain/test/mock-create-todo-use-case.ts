import { vi } from 'vitest'
import type { CreateTodoUseCase, CreateTodoInput, CreateTodoOutput } from '../use-cases/create-todo'

/**
 * Creates a mock instance of CreateTodoInput
 * @returns Mock input for testing
 */
export const mockCreateTodoInput = (): CreateTodoInput => ({
  tenantId: 'tenant-123',
  title: 'Test Todo Item',
  description: 'This is a test todo item'
})

/**
 * Creates a mock instance of CreateTodoOutput
 * @returns Mock output for testing
 */
export const mockCreateTodoOutput = (): CreateTodoOutput => ({
  id: 'todo-123',
  tenantId: 'tenant-123',
  title: 'Test Todo Item',
  description: 'This is a test todo item',
  completed: false,
  createdAt: new Date('2025-01-01T00:00:00Z')
})

/**
 * Creates a mock instance of CreateTodoUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockCreateTodoUseCase = (): CreateTodoUseCase => ({
  execute: vi.fn()
})
