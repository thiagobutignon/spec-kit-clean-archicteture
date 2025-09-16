/**
 * Error thrown when a payment is not found
 * @extends Error
 */
export class PaymentNotFoundError extends Error {
  constructor(paymentId: string) {
    super(`Payment with ID ${paymentId} not found`)
    this.name = 'PaymentNotFoundError'
  }
}
