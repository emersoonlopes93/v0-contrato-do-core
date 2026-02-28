type LogLevel = 'info' | 'error' | 'warn'

type LogEntry = {
  level: LogLevel
  message: string
  timestamp: string
  request_id?: string
  actor_id?: string
  tenant_id?: string
  ip?: string
  user_agent?: string
  context?: Record<string, unknown>
}

function write(entry: LogEntry): void {
  console.log(JSON.stringify(entry))
}

export const logger = {
  info(message: string, ctx?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    write({ level: 'info', message, timestamp: new Date().toISOString(), ...ctx })
  },
  error(message: string, ctx?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    write({ level: 'error', message, timestamp: new Date().toISOString(), ...ctx })
  },
  warn(message: string, ctx?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>): void {
    write({ level: 'warn', message, timestamp: new Date().toISOString(), ...ctx })
  },
}
