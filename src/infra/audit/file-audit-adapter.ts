import { type AuditRepository } from '@/data/protocols/audit/audit-repository'
import { type AuditLogEntry } from '@/domain/models/audit-log'
import { type FileSystem } from '@/data/protocols/fs/file-system'

export class FileAuditAdapter implements AuditRepository {
  private entries: AuditLogEntry[] = []

  constructor (
    private readonly fileSystem: FileSystem,
    private readonly logPath: string
  ) {}

  async log (entry: AuditLogEntry): Promise<void> {
    this.entries.push(entry)

    if (this.entries.length > 100) {
      this.entries = this.entries.slice(-100)
    }

    try {
      const content = JSON.stringify(this.entries, null, 2)
      await this.fileSystem.writeFile(this.logPath, content)
    } catch {
      // Ignore write errors
    }
  }

  async getRecent (limit: number): Promise<AuditLogEntry[]> {
    return this.entries.slice(-limit)
  }
}
