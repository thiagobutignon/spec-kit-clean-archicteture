import { vi } from 'vitest'
import type { RefundPaymentUseCase, RefundPaymentInput, RefundPaymentOutput } from '../use-cases/refund-payment'

/**
 * Creates a mock instance of RefundPaymentInput
 * @returns Mock input for testing
 */
export const mockRefundPaymentInput = (): RefundPaymentInput => ({
  paymentId: 'payment-789',
  amount: 5000,
  reason: 'Customer requested refund'
})

/**
 * Creates a mock instance of RefundPaymentOutput
 * @returns Mock output for testing
 */
export const mockRefundPaymentOutput = (): RefundPaymentOutput => ({
  refundId: 'refund-456',
  paymentId: 'payment-789',
  amount: 5000,
  status: 'completed',
  refundedAt: new Date('2024-01-01T11:00:00Z')
})

/**
 * Creates a mock instance of RefundPaymentUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockRefundPaymentUseCase = (): RefundPaymentUseCase => ({
  execute: vi.fn().mockResolvedValue(mockRefundPaymentOutput())
})
