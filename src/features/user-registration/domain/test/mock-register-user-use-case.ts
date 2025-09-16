import { vi } from 'vitest'
import type { RegisterUserUseCase, RegisterUserInput, RegisterUserOutput } from '../use-cases/register-user'

/**
 * Creates a mock instance of RegisterUserInput
 * @returns Mock input for testing
 */
export const mockRegisterUserInput = (): RegisterUserInput => ({
  email: 'newuser@example.com',
  password: 'SecurePass123!',
  firstName: 'Jane',
  lastName: 'Smith'
})

/**
 * Creates a mock instance of RegisterUserOutput
 * @returns Mock output for testing
 */
export const mockRegisterUserOutput = (): RegisterUserOutput => ({
  id: 'user-456',
  email: 'newuser@example.com',
  firstName: 'Jane',
  lastName: 'Smith',
  createdAt: new Date('2024-01-01T00:00:00Z')
})

/**
 * Creates a mock instance of RegisterUserUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockRegisterUserUseCase = (): RegisterUserUseCase => ({
  execute: vi.fn()
})
