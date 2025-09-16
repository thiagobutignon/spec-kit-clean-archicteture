import { vi } from 'vitest'
import type { ProcessPaymentUseCase, ProcessPaymentInput, ProcessPaymentOutput } from '../use-cases/process-payment'
import type { PaymentStatus } from '../models/payment'

/**
 * Creates a mock instance of ProcessPaymentInput
 * @returns Mock input for testing
 */
export const mockProcessPaymentInput = (): ProcessPaymentInput => ({
  orderId: 'order-123',
  amount: 10000,
  currency: 'BRL',
  method: 'credit_card',
  customerId: 'customer-456',
  description: 'Test payment',
  metadata: {
    source: 'test',
    environment: 'development'
  }
})

/**
 * Creates a mock instance of ProcessPaymentOutput
 * @returns Mock output for testing
 */
export const mockProcessPaymentOutput = (status: PaymentStatus = 'approved'): ProcessPaymentOutput => ({
  paymentId: 'payment-789',
  orderId: 'order-123',
  status,
  amount: 10000,
  currency: 'BRL',
  method: 'credit_card',
  processedAt: new Date('2024-01-01T10:00:00Z'),
  transactionId: 'txn-abc-123',
  gatewayResponse: 'Transaction approved'
})

/**
 * Creates a mock instance of ProcessPaymentUseCase
 * @returns Mocked use case with vitest functions
 */
export const mockProcessPaymentUseCase = (): ProcessPaymentUseCase => ({
  execute: vi.fn().mockResolvedValue(mockProcessPaymentOutput())
})
