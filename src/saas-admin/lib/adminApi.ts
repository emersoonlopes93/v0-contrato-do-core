/**
 * SaaS Admin API Client
 * 
 * Cliente HTTP dedicado para o SaaS Admin.
 * Injeta automaticamente o token de autenticação (Bearer) do localStorage.
 * Garante tipagem e tratamento de erros padronizado.
 */

const BASE_URL = '/api/v1/admin';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class AdminApiClient {
  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private async refreshSession(): Promise<boolean> {
    const res = await fetch('/api/v1/auth/saas-admin/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return res.ok;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...customConfig } = options;

    const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const doFetch = async () => {
      const config: RequestInit = {
        ...customConfig,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Context': 'saas_admin',
          ...headers,
        },
      };
      const response = await fetch(url.toString(), config);
      const data: unknown = await response.json().catch(() => ({}));
      return { response, data };
    };

    let { response, data } = await doFetch();

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await this.refreshSession();
        if (refreshed) {
          ({ response, data } = await doFetch());
        }
      }
      if (!response.ok) {
        const parsed = this.isRecord(data) ? data : {};
        const message =
          typeof parsed.message === 'string'
            ? parsed.message
            : typeof parsed.error === 'string'
              ? parsed.error
              : 'Erro na requisição';
        throw new Error(message);
      }
    }

    if (this.isRecord(data) && data.data !== undefined) {
      return data.data as T;
    }
    return data as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  async patch<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const adminApi = new AdminApiClient();
