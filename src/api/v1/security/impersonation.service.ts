import crypto from 'crypto'
import { redisClient } from '@/src/infrastructure/redis/redis-client'
import type { TenantId, UserId } from '@/src/core/types'
import { prismaAuditLogger } from '@/src/adapters/prisma/audit-logger'

export type ImpersonationPayload = {
  adminUserId: UserId
  tenantId: TenantId
  createdAt: string
}

const TTL_SEC = Number(process.env.IMPERSONATION_TTL_SEC ?? '600')

export async function issueImpersonationToken(adminUserId: UserId, tenantId: TenantId): Promise<string> {
  const id = crypto.randomUUID()
  const key = `imp:${id}`
  const payload: ImpersonationPayload = { adminUserId, tenantId, createdAt: new Date().toISOString() }
  const client = await redisClient()
  await client.setex(key, TTL_SEC, JSON.stringify(payload))
  await prismaAuditLogger.log({
    id: id as unknown as UserId,
    tenantId,
    userId: adminUserId,
    action: 'IMPERSONATION_ISSUED',
    resource: 'IMPERSONATION',
    oldValue: undefined,
    newValue: { tenantId },
    status: 'success',
    metadata: { details: 'Impersonation token emitido' },
    timestamp: new Date(),
  })
  return id
}
