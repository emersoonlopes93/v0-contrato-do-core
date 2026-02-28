import crypto from 'crypto'
import { redisClient } from '@/src/infrastructure/redis/redis-client'
import { recordMfaFailureMetric } from '@/src/api/v1/stats/metrics'

type Challenge = {
  userId: string
  code: string
  device?: string | null
}

const DEFAULT_TTL_SEC = Number(process.env.MFA_TTL_SEC ?? '300')

export async function createMfaChallenge(userId: string, device?: string | null, ttlSec: number = DEFAULT_TTL_SEC): Promise<{ challengeId: string; code: string }> {
  const challengeId = crypto.randomUUID()
  const code = String(crypto.randomInt(100000, 1000000))
  const client = await redisClient()
  const key = `mfa:challenge:${challengeId}`
  const payload: Challenge = { userId, code, device: device ?? null }
  await client.setex(key, ttlSec, JSON.stringify(payload))
  return { challengeId, code }
}

export async function verifyMfaChallenge(challengeId: string, code: string, device?: string | null): Promise<string | null> {
  const client = await redisClient()
  const key = `mfa:challenge:${challengeId}`
  const raw = await client.get(key)
  if (!raw) return null
  let parsed: Challenge | null = null
  try {
    parsed = JSON.parse(raw) as Challenge
  } catch {
    parsed = null
  }
  if (!parsed) {
    await client.del(key)
    return null
  }
  if (parsed.code !== code) {
    recordMfaFailureMetric()
    return null
  }
  if (parsed.device && device && parsed.device !== device) {
    recordMfaFailureMetric()
    return null
  }
  await client.del(key)
  return parsed.userId
}

export async function invalidateMfaChallenge(challengeId: string): Promise<void> {
  const client = await redisClient()
  const key = `mfa:challenge:${challengeId}`
  await client.del(key)
}
