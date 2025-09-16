/**
 * Error thrown when a user tries to access resources from another tenant
 * @extends Error
 */
export class UnauthorizedTenantAccessError extends Error {
  constructor() {
    super('Unauthorized access to tenant resources')
    this.name = 'UnauthorizedTenantAccessError'
  }
}
