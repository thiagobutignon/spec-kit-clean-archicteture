import { type AuditLogEntry } from '@/domain/models/audit-log'

export interface AuditRepository {
  log: (entry: AuditLogEntry) => Promise<void>
  getRecent: (limit: number) => Promise<AuditLogEntry[]>
}
