/**
 * Payment processing domain models
 */

export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'wallet'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'declined'
  | 'refunded'
  | 'cancelled'
  | 'failed'

export type Currency = 'BRL' | 'USD' | 'EUR'

// Process Payment
export type ProcessPaymentInput = {
  orderId: string
  amount: number
  currency: Currency
  method: PaymentMethod
  customerId: string
  description?: string
  metadata?: Record<string, unknown>
}

export type ProcessPaymentOutput = {
  paymentId: string
  orderId: string
  status: PaymentStatus
  amount: number
  currency: Currency
  method: PaymentMethod
  processedAt: Date
  transactionId?: string
  gatewayResponse?: string
}

// Refund Payment
export type RefundPaymentInput = {
  paymentId: string
  amount?: number
  reason: string
}

export type RefundPaymentOutput = {
  refundId: string
  paymentId: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  refundedAt: Date
}

// Validate Payment
export type ValidatePaymentInput = {
  paymentId: string
  transactionId: string
}

export type ValidatePaymentOutput = {
  isValid: boolean
  status: PaymentStatus
  validatedAt: Date
}

// Get Payment Status
export type GetPaymentStatusInput = {
  paymentId: string
}

export type GetPaymentStatusOutput = {
  paymentId: string
  status: PaymentStatus
  amount: number
  lastUpdatedAt: Date
}

// Cancel Payment
export type CancelPaymentInput = {
  paymentId: string
  reason: string
}

export type CancelPaymentOutput = {
  paymentId: string
  status: 'cancelled'
  cancelledAt: Date
}
