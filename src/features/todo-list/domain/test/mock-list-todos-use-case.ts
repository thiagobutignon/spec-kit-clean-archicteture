import { vi } from 'vitest'
import type { ListTodosUseCase, ListTodosInput, ListTodosOutput } from '../use-cases/list-todos'

/**
 * Creates a mock instance of ListTodosInput
 * @returns Mock input for testing
 */
export const mockListTodosInput = (): ListTodosInput => ({
  tenantId: 'tenant-123',
  completed: false
})

/**
 * Creates a mock instance of ListTodosOutput
 * @returns Mock output for testing
 */
export const mockListTodosOutput = (): ListTodosOutput => ({
  todos: [
    {
      id: 'todo-123',
      tenantId: 'tenant-123',
      title: 'Test Todo Item 1',
      description: 'This is a test todo item',
      completed: false,
      createdAt: new Date('2025-01-01T00:00:00Z')
    },
    {
      id: 'todo-456',
      tenantId: 'tenant-123',
      title: 'Test Todo Item 2',
      completed: true,
      createdAt: new Date('2025-01-02T00:00:00Z'),
      updatedAt: new Date('2025-01-03T00:00:00Z')
    }
  ]
})

/**
 * Creates a mock instance of ListTodosUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockListTodosUseCase = (): ListTodosUseCase => ({
  execute: vi.fn()
})
