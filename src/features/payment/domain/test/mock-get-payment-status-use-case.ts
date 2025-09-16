import { vi } from 'vitest'
import type { GetPaymentStatusUseCase, GetPaymentStatusInput, GetPaymentStatusOutput } from '../use-cases/get-payment-status'

/**
 * Creates a mock instance of GetPaymentStatusInput
 * @returns Mock input for testing
 */
export const mockGetPaymentStatusInput = (): GetPaymentStatusInput => ({
  paymentId: 'payment-789'
})

/**
 * Creates a mock instance of GetPaymentStatusOutput
 * @returns Mock output for testing
 */
export const mockGetPaymentStatusOutput = (): GetPaymentStatusOutput => ({
  paymentId: 'payment-789',
  status: 'approved',
  amount: 10000,
  lastUpdatedAt: new Date('2024-01-01T10:00:00Z')
})

/**
 * Creates a mock instance of GetPaymentStatusUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockGetPaymentStatusUseCase = (): GetPaymentStatusUseCase => ({
  execute: vi.fn().mockResolvedValue(mockGetPaymentStatusOutput())
})
