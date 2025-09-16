import { CancelPaymentInput, CancelPaymentOutput } from '../models/payment'

/**
 * CancelPaymentUseCase interface
 * @description Cancel a pending or processing payment
 */
export interface CancelPaymentUseCase {
  /**
   * Execute the cancellation operation
   * @param input - The cancellation parameters
   * @returns Promise with the cancellation result
   */
  execute: (input: CancelPaymentInput) => Promise<CancelPaymentOutput>
}
