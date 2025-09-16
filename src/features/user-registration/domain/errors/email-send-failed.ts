/**
 * Error thrown when email sending fails
 * @extends Error
 */
export class EmailSendFailedError extends Error {
  constructor() {
    super('Failed to send email notification')
    this.name = 'EmailSendFailedError'
  }
}
