/**
 * Error thrown when payment data is invalid
 * @extends Error
 */
export class InvalidPaymentError extends Error {
  constructor(message: string) {
    super(`Invalid payment: ${message}`)
    this.name = 'InvalidPaymentError'
  }
}
