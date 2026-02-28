import type { Middleware, Request, Response, NextFunction } from '@/src/api/v1/middleware'

export const securityHeaders: Middleware = async (req: Request, res: Response, next: NextFunction) => {
  res.headers = {
    ...(res.headers ?? {}),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'",
  }
  await next()
}
