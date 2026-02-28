import type { Middleware, Request, Response, NextFunction } from '@/src/api/v1/middleware'
import { getPrismaClient } from '@/src/adapters/prisma/client'

const prisma = getPrismaClient()
const OVERDUE_BLOCK_DAYS = Number(process.env.BILLING_OVERDUE_BLOCK_DAYS ?? '15')

export const requireBillingOk: Middleware = async (req: Request, res: Response, next: NextFunction) => {
  const params = req.params ?? {}
  const tenantId = params['tenantId']
  if (!tenantId) {
    await next()
    return
  }
  const now = new Date()
  const threshold = new Date(now.getTime() - OVERDUE_BLOCK_DAYS * 24 * 60 * 60 * 1000)
  const overdue = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    'SELECT id FROM invoices WHERE tenant_id = $1 AND status = $2 AND due_date < $3 LIMIT 1',
    tenantId,
    'overdue',
    threshold
  )
  if (overdue) {
    await prisma.$queryRawUnsafe('UPDATE tenants SET account_status = $1 WHERE id = $2', 'blocked', tenantId)
    res.status = 402
    res.body = { error: 'Payment Required', message: 'Account blocked due to overdue invoices' }
    return
  }
  await next()
}
