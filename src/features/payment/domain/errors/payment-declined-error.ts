/**
 * Error thrown when a payment is declined by the gateway
 * @extends Error
 */
export class PaymentDeclinedError extends Error {
  constructor(reason: string) {
    super(`Payment declined: ${reason}`)
    this.name = 'PaymentDeclinedError'
  }
}
