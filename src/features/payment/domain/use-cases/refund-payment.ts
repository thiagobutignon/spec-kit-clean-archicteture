import { RefundPaymentInput, RefundPaymentOutput } from '../models/payment'

/**
 * RefundPaymentUseCase interface
 * @description Process a refund for an existing payment
 */
export interface RefundPaymentUseCase {
  /**
   * Execute the refund operation
   * @param input - The refund parameters
   * @returns Promise with the refund result
   */
  execute: (input: RefundPaymentInput) => Promise<RefundPaymentOutput>
}
