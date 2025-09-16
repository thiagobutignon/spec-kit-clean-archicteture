import { vi } from 'vitest'
import type { GetUserProfileUseCase, GetUserProfileInput, GetUserProfileOutput } from '../use-cases/get-user-profile'

/**
 * Creates a mock instance of GetUserProfileInput
 * @returns Mock input for testing
 */
export const mockGetUserProfileInput = (): GetUserProfileInput => ({
  userId: 'user-123'
})

/**
 * Creates a mock instance of GetUserProfileOutput
 * @returns Mock output for testing
 */
export const mockGetUserProfileOutput = (): GetUserProfileOutput => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  nickname: 'JD'
})

/**
 * Creates a mock instance of GetUserProfileUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockGetUserProfileUseCase = (): GetUserProfileUseCase => ({
  execute: vi.fn()
})
