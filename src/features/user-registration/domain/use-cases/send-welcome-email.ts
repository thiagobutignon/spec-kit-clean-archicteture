/**
 * Input parameters for SendWelcomeEmailUseCase
 */
export type SendWelcomeEmailInput = {
  userId: string
  email: string
  firstName: string
}

/**
 * Output type for SendWelcomeEmailUseCase
 */
export type SendWelcomeEmailOutput = {
  emailId: string
  sentAt: Date
  status: 'sent' | 'queued' | 'failed'
}

/**
 * SendWelcomeEmailUseCase interface
 * @description Sends a welcome email to newly registered users
 */
export interface SendWelcomeEmailUseCase {
  /**
   * Execute the send welcome email operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   */
  execute: (input: SendWelcomeEmailInput) => Promise<SendWelcomeEmailOutput>
}
