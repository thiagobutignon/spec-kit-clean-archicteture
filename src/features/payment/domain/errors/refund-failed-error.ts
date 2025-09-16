/**
 * Error thrown when a refund operation fails
 * @extends Error
 */
export class RefundFailedError extends Error {
  constructor(paymentId: string, reason: string) {
    super(`Refund failed for payment ${paymentId}: ${reason}`)
    this.name = 'RefundFailedError'
  }
}
