import type { Middleware, Request, Response, NextFunction } from '@/src/api/v1/middleware'
import { captureException, initSentry } from './sentry'

initSentry()

export const sentryErrorHandler: Middleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await next()
  } catch (err) {
    captureException(err as unknown, { url: req.url, method: req.method })
    throw err
  }
}
