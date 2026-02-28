type RedisAPI = {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  setex(key: string, seconds: number, value: string): Promise<void>
  del(key: string): Promise<void>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<void>
  exists(key: string): Promise<boolean>
}

class MemoryRedis implements RedisAPI {
  private store = new Map<string, { v: string; exp?: number }>()
  async get(key: string): Promise<string | null> {
    const now = Date.now()
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.exp && entry.exp <= now) {
      this.store.delete(key)
      return null
    }
    return entry.v
  }
  async set(key: string, value: string): Promise<void> {
    this.store.set(key, { v: value })
  }
  async setex(key: string, seconds: number, value: string): Promise<void> {
    const exp = Date.now() + seconds * 1000
    this.store.set(key, { v: value, exp })
  }
  async del(key: string): Promise<void> {
    this.store.delete(key)
  }
  async incr(key: string): Promise<number> {
    const current = await this.get(key)
    const n = current ? Number(current) : 0
    const next = Number.isFinite(n) ? n + 1 : 1
    await this.set(key, String(next))
    return next
  }
  async expire(key: string, seconds: number): Promise<void> {
    const entry = this.store.get(key)
    if (!entry) return
    entry.exp = Date.now() + seconds * 1000
    this.store.set(key, entry)
  }
  async exists(key: string): Promise<boolean> {
    const v = await this.get(key)
    return v !== null
  }
}

class UpstashRedis implements RedisAPI {
  constructor(private baseUrl: string, private token: string) {}
  private async req<T>(path: string, method: 'GET'|'POST', body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/${path}`
    const res = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
    })
    if (!res.ok) throw new Error(`Upstash error ${res.status}`)
    const data = await res.json() as { result: T }
    return data.result
  }
  async get(key: string): Promise<string | null> {
    return await this.req<string | null>(`get/${encodeURIComponent(key)}`, 'GET')
  }
  async set(key: string, value: string): Promise<void> {
    await this.req<unknown>('set', 'POST', { key, value })
  }
  async setex(key: string, seconds: number, value: string): Promise<void> {
    await this.req<unknown>('set', 'POST', { key, value, ex: seconds })
  }
  async del(key: string): Promise<void> {
    await this.req<unknown>('del', 'POST', { key })
  }
  async incr(key: string): Promise<number> {
    return await this.req<number>('incr', 'POST', { key })
  }
  async expire(key: string, seconds: number): Promise<void> {
    await this.req<unknown>('expire', 'POST', { key, seconds })
  }
  async exists(key: string): Promise<boolean> {
    const r = await this.req<number>('exists', 'POST', { key })
    return r === 1
  }
}

let instance: RedisAPI | null = null

async function createClient(): Promise<RedisAPI> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || ''
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  if (upstashUrl && upstashToken) {
    return new UpstashRedis(upstashUrl, upstashToken)
  }
  return new MemoryRedis()
}

export async function redisClient(): Promise<RedisAPI> {
  if (instance) return instance
  instance = await createClient()
  return instance
}
