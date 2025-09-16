/**
 * Input parameters for RegisterUserUseCase
 */
export type RegisterUserInput = {
  email: string
  password: string
  firstName: string
  lastName: string
}

/**
 * Output type for RegisterUserUseCase
 */
export type RegisterUserOutput = {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: Date
}

/**
 * RegisterUserUseCase interface
 * @description Registers a new user in the system
 */
export interface RegisterUserUseCase {
  /**
   * Execute the register user operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   */
  execute: (input: RegisterUserInput) => Promise<RegisterUserOutput>
}
