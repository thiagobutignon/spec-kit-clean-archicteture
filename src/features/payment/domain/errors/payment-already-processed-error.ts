/**
 * Error thrown when trying to process an already processed payment
 * @extends Error
 */
export class PaymentAlreadyProcessedError extends Error {
  constructor(paymentId: string) {
    super(`Payment ${paymentId} has already been processed`)
    this.name = 'PaymentAlreadyProcessedError'
  }
}
