import { redisClient } from '@/src/infrastructure/redis/redis-client'
import { recordRateLimitMetric } from '@/src/api/v1/stats/metrics'

const LOGIN_WINDOW_MS = Number(process.env.LOGIN_WINDOW_MS ?? '60000')
const LOGIN_MAX_ATTEMPTS = Number(process.env.LOGIN_MAX_ATTEMPTS ?? '10')

export function getLoginKey(ip: string, email: string): string {
  const e = email.toLowerCase()
  return `rl:login:${ip}:${e}`
}

export async function isLoginRateLimited(key: string): Promise<boolean> {
  const client = await redisClient()
  const attemptsRaw = await client.get(key)
  const attempts = attemptsRaw ? Number(attemptsRaw) : 0
  if (attempts >= LOGIN_MAX_ATTEMPTS) {
    recordRateLimitMetric()
    return true
  }
  if (!attemptsRaw) {
    await client.set(key, '0')
    await client.expire(key, Math.ceil(LOGIN_WINDOW_MS / 1000))
  }
  return false
}

export async function recordLoginFailure(key: string): Promise<void> {
  const client = await redisClient()
  const v = await client.incr(key)
  if (v === 1) {
    await client.expire(key, Math.ceil(LOGIN_WINDOW_MS / 1000))
  }
}

export async function recordLoginSuccess(key: string): Promise<void> {
  const client = await redisClient()
  await client.del(key)
}
