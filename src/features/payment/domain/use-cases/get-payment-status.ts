import { GetPaymentStatusInput, GetPaymentStatusOutput } from '../models/payment'

/**
 * GetPaymentStatusUseCase interface
 * @description Retrieve the current status of a payment
 */
export interface GetPaymentStatusUseCase {
  /**
   * Execute the status retrieval operation
   * @param input - The payment identifier
   * @returns Promise with the payment status
   */
  execute: (input: GetPaymentStatusInput) => Promise<GetPaymentStatusOutput>
}
