import { vi } from 'vitest'
import type { ValidatePaymentUseCase, ValidatePaymentInput, ValidatePaymentOutput } from '../use-cases/validate-payment'

/**
 * Creates a mock instance of ValidatePaymentInput
 * @returns Mock input for testing
 */
export const mockValidatePaymentInput = (): ValidatePaymentInput => ({
  paymentId: 'payment-789',
  transactionId: 'txn-abc-123'
})

/**
 * Creates a mock instance of ValidatePaymentOutput
 * @returns Mock output for testing
 */
export const mockValidatePaymentOutput = (): ValidatePaymentOutput => ({
  isValid: true,
  status: 'approved',
  validatedAt: new Date('2024-01-01T10:05:00Z')
})

/**
 * Creates a mock instance of ValidatePaymentUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockValidatePaymentUseCase = (): ValidatePaymentUseCase => ({
  execute: vi.fn().mockResolvedValue(mockValidatePaymentOutput())
})
