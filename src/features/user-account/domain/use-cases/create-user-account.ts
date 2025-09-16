/**
 * Input parameters for CreateUserAccountUseCase
 */
export type CreateUserAccountInput = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

/**
 * Output type for CreateUserAccountUseCase
 */
export type CreateUserAccountOutput = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

/**
 * CreateUserAccountUseCase interface
 * @description Creates a new user account with email, first name, last name, and password
 */
export interface CreateUserAccountUseCase {
  /**
   * Execute the create user account operation
   * @param input - The input parameters
   * @returns Promise with the operation output
   */
  execute: (input: CreateUserAccountInput) => Promise<CreateUserAccountOutput>
}
