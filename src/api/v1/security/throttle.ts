import type { Middleware, Request, Response, NextFunction } from '@/src/api/v1/middleware'
import { redisClient } from '@/src/infrastructure/redis/redis-client'

type ThrottlePolicy = {
  windowSec: number
  max: number
}

function keyFor(ip: string, id: string): string {
  const i = ip.toLowerCase()
  return `throttle:${id}:${i}`
}

export const throttle = (id: string, policy: ThrottlePolicy): Middleware => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ipHeader = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    const ip = typeof ipHeader === 'string' && ipHeader.trim() !== '' ? ipHeader.split(',')[0]!.trim() : 'unknown'
    const key = keyFor(ip, id)
    const client = await redisClient()
    const cRaw = await client.get(key)
    const c = cRaw ? Number(cRaw) : 0
    if (c >= policy.max) {
      res.status = 429
      res.body = { error: 'Too Many Requests' }
      return
    }
    const n = await client.incr(key)
    if (n === 1) {
      await client.expire(key, policy.windowSec)
    }
    await next()
  }
}
