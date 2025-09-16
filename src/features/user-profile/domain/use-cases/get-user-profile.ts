/**
 * Input parameters for GetUserProfileUseCase
 */
export type GetUserProfileInput = {
  userId: string
}

/**
 * Output type for GetUserProfileUseCase
 */
export type GetUserProfileOutput = {
  id: string
  email: string
  firstName: string
  lastName: string
}

/**
 * GetUserProfileUseCase interface
 * @description Retrieves a user's profile information
 */
export interface GetUserProfileUseCase {
  /**
   * Execute the get user profile operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   */
  execute: (input: GetUserProfileInput) => Promise<GetUserProfileOutput>
}
