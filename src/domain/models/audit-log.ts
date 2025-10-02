export type AuditLogEntry = {
  timestamp: string
  event: string
  details: Record<string, unknown>
}

export type AuditLog = {
  entries: AuditLogEntry[]
}
