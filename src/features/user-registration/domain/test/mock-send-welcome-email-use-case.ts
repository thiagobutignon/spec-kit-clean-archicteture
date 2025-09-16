import { vi } from 'vitest'
import type { SendWelcomeEmailUseCase, SendWelcomeEmailInput, SendWelcomeEmailOutput } from '../use-cases/send-welcome-email'

/**
 * Creates a mock instance of SendWelcomeEmailInput
 * @returns Mock input for testing
 */
export const mockSendWelcomeEmailInput = (): SendWelcomeEmailInput => ({
  userId: 'user-456',
  email: 'newuser@example.com',
  firstName: 'Jane'
})

/**
 * Creates a mock instance of SendWelcomeEmailOutput
 * @returns Mock output for testing
 */
export const mockSendWelcomeEmailOutput = (): SendWelcomeEmailOutput => ({
  emailId: 'email-789',
  sentAt: new Date('2024-01-01T00:01:00Z'),
  status: 'sent'
})

/**
 * Creates a mock instance of SendWelcomeEmailUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockSendWelcomeEmailUseCase = (): SendWelcomeEmailUseCase => ({
  execute: vi.fn()
})
