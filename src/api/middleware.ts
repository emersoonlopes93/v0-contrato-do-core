export type Request<TBody = unknown, TAuth = unknown> = RequestInit & {
  headers: Record<string, string>;
  body?: TBody;
  params?: Record<string, string>;
  query?: Record<string, string>;
  auth?: TAuth;
}

export type Response<TBody = unknown> = {
  status: number;
  body: TBody;
  headers?: Record<string, string>;
}

export type NextFunction = () => Promise<void>;
