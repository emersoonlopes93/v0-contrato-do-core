import type { Middleware, Request, Response, NextFunction } from '@/src/api/v1/middleware'

function parseAllowedOrigins(): ReadonlySet<string> {
  const raw = process.env.ALLOWED_ORIGINS ?? ''
  const items = raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0)
  return new Set(items)
}

export const corsRestrictive: Middleware = async (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers['origin']
  const allowed = parseAllowedOrigins()
  const isProd = process.env.NODE_ENV === 'production'
  if (typeof origin === 'string' && origin.length > 0) {
    if (isProd && (allowed.size === 0 || !allowed.has(origin))) {
      res.status = 403
      res.body = { error: 'Forbidden', message: 'Origin not allowed' }
      return
    }
    res.headers = { ...(res.headers ?? {}), 'Access-Control-Allow-Origin': allowed.has(origin) ? origin : 'null' }
  }
  await next()
}
