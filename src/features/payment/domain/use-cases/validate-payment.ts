import { ValidatePaymentInput, ValidatePaymentOutput } from '../models/payment'

/**
 * ValidatePaymentUseCase interface
 * @description Validate a payment transaction with the gateway
 */
export interface ValidatePaymentUseCase {
  /**
   * Execute the validation operation
   * @param input - The validation parameters
   * @returns Promise with the validation result
   */
  execute: (input: ValidatePaymentInput) => Promise<ValidatePaymentOutput>
}
