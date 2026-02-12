import { LogisticsAiLogger } from './logistics-ai.logger';

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  tenantId: string,
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation ${operation} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } catch (error) {
    if (error instanceof TimeoutError) {
      LogisticsAiLogger.warn(tenantId, `Operation timeout: ${operation}`, {
        decisionType: 'timeout',
        metadata: {
          timeoutMs,
          operation
        }
      });
      throw error;
    }
    throw error;
  }
}

export function createTimeoutWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeoutMs: number,
  operation: string
) {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const tenantId = args[0] as string; // Assume first parameter is always tenantId
    
    try {
      return await withTimeout(fn(...args), timeoutMs, tenantId, operation);
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw error;
      }
      throw error;
    }
  };
}
