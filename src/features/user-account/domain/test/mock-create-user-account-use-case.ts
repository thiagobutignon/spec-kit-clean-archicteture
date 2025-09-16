import { vi } from 'vitest'
import type { CreateUserAccountUseCase, CreateUserAccountInput, CreateUserAccountOutput } from '../use-cases/create-user-account'

/**
 * Creates a mock instance of CreateUserAccountInput
 * @returns Mock input for testing
 */
export const mockCreateUserAccountInput = (): CreateUserAccountInput => ({
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'SecurePassword123!',
})

/**
 * Creates a mock instance of CreateUserAccountOutput
 * @returns Mock output for testing
 */
export const mockCreateUserAccountOutput = (): CreateUserAccountOutput => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date('2025-01-01T00:00:00Z'),
})

/**
 * Creates a mock instance of CreateUserAccountUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockCreateUserAccountUseCase = (): CreateUserAccountUseCase => ({
  execute: vi.fn()
})
