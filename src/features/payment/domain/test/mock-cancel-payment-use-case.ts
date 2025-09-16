import { vi } from 'vitest'
import type { CancelPaymentUseCase, CancelPaymentInput, CancelPaymentOutput } from '../use-cases/cancel-payment'

/**
 * Creates a mock instance of CancelPaymentInput
 * @returns Mock input for testing
 */
export const mockCancelPaymentInput = (): CancelPaymentInput => ({
  paymentId: 'payment-789',
  reason: 'Order cancelled by customer'
})

/**
 * Creates a mock instance of CancelPaymentOutput
 * @returns Mock output for testing
 */
export const mockCancelPaymentOutput = (): CancelPaymentOutput => ({
  paymentId: 'payment-789',
  status: 'cancelled',
  cancelledAt: new Date('2024-01-01T10:30:00Z')
})

/**
 * Creates a mock instance of CancelPaymentUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockCancelPaymentUseCase = (): CancelPaymentUseCase => ({
  execute: vi.fn().mockResolvedValue(mockCancelPaymentOutput())
})
