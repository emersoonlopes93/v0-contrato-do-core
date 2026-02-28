import { redisClient } from '@/src/infrastructure/redis/redis-client'
import { recordLockoutMetric } from '@/src/api/v1/stats/metrics'

type LockoutConfig = {
  windowSec: number
  thresholds: { attempts: number; lockSec: number }[]
}

const DEFAULT_CONFIG: LockoutConfig = {
  windowSec: Number(process.env.LOCKOUT_WINDOW_SEC ?? '900'),
  thresholds: [
    { attempts: 5, lockSec: Number(process.env.LOCKOUT_T1_SEC ?? '300') },
    { attempts: 10, lockSec: Number(process.env.LOCKOUT_T2_SEC ?? '1800') },
    { attempts: 15, lockSec: Number(process.env.LOCKOUT_T3_SEC ?? '7200') },
  ],
}

function keyBase(ip: string, identifier: string): string {
  const id = identifier.toLowerCase()
  return `lockout:${ip}:${id}`
}

export async function isLockedOut(ip: string, identifier: string): Promise<boolean> {
  const client = await redisClient()
  const base = keyBase(ip, identifier)
  const lockKey = `${base}:lock`
  return await client.exists(lockKey)
}

export async function recordFailure(ip: string, identifier: string, config: LockoutConfig = DEFAULT_CONFIG): Promise<void> {
  const client = await redisClient()
  const base = keyBase(ip, identifier)
  const failKey = `${base}:fail`
  const lockKey = `${base}:lock`
  const attempts = await client.incr(failKey)
  if (attempts === 1) {
    await client.expire(failKey, config.windowSec)
  }
  for (const t of config.thresholds) {
    if (attempts === t.attempts) {
      await client.setex(lockKey, t.lockSec, '1')
      recordLockoutMetric()
      break
    }
  }
}

export async function recordSuccess(ip: string, identifier: string): Promise<void> {
  const client = await redisClient()
  const base = keyBase(ip, identifier)
  await client.del(`${base}:fail`)
  await client.del(`${base}:lock`)
}
