type RequestOptions = RequestInit & {
  params?: Record<string, string>;
  tenantSlug?: string;
};

function buildUrl(path: string, params?: Record<string, string>) {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url;
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    console.debug('[tenantApi] Attempting token refresh');
    const res = await fetch('/api/v1/auth/tenant/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      console.warn('[tenantApi] Token refresh failed:', res.status);
      return false;
    }
    console.debug('[tenantApi] Token refresh success');
    return true;
  } catch (e) {
    console.error('[tenantApi] Token refresh error:', e);
    return false;
  }
}

async function doFetch<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { params, tenantSlug, ...init } = options;
  const url = buildUrl(path, params);
  const headers: Record<string, string> = {
    'X-Auth-Context': 'tenant_user',
    ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
    ...(init.headers as Record<string, string> || {}),
  };
  const config: RequestInit = {
    ...init,
    method,
    credentials: 'include',
    headers,
  };

  console.debug('[tenantApi] Request:', method, url.toString());
  let res = await fetch(url.toString(), config);

  // Auto refresh on 401
  if (res.status === 401) {
    console.warn('[tenantApi] 401 Unauthorized. Trying refresh...');
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(url.toString(), config);
    }
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in (data as Record<string, unknown>) &&
      typeof (data as Record<string, unknown>).message === 'string'
        ? String((data as Record<string, unknown>).message)
        : `Falha na requisição (${res.status})`;
    console.error('[tenantApi] Error:', message);
    if (res.status === 401) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    throw new Error(message);
  }

  return data as T;
}

export const tenantApi = {
  get<T>(path: string, options?: RequestOptions) {
    return doFetch<T>('GET', path, options);
  },
  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return doFetch<T>('POST', path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string> || {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return doFetch<T>('PUT', path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string> || {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return doFetch<T>('PATCH', path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string> || {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(path: string, options?: RequestOptions) {
    return doFetch<T>('DELETE', path, options);
  },
};
