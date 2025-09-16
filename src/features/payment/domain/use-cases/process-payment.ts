import { ProcessPaymentInput, ProcessPaymentOutput } from '../models/payment'

/**
 * ProcessPaymentUseCase interface
 * @description Process a payment transaction for an order
 */
export interface ProcessPaymentUseCase {
  /**
   * Execute the payment processing operation
   * @param input - The payment processing parameters
   * @returns Promise with the payment result
   */
  execute: (input: ProcessPaymentInput) => Promise<ProcessPaymentOutput>
}
