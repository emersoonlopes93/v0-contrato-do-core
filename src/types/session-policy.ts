export interface SessionMetadata {
  userId: string
  tokenHash: string
  device?: string | null
  ip?: string | null
  userAgent?: string | null
  createdAt: string
}

export interface SessionPolicyConfig {
  maxSessions: number
}
