/**
 * SaaS Admin API Client
 * 
 * Cliente HTTP dedicado para o SaaS Admin.
 * Injeta automaticamente o token de autenticação (Bearer) do localStorage.
 * Garante tipagem e tratamento de erros padronizado.
 */

const BASE_URL = '/api/v1/admin';
const ADMIN_ACCESS_TOKEN_KEY = 'saas_admin_access_token';
const ADMIN_REFRESH_TOKEN_KEY = 'saas_admin_refresh_token';
const LEGACY_ACCESS_TOKEN_KEY = 'auth_token';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class AdminApiClient {
  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private getAccessToken(): string {
    const token =
      localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) ??
      localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    return token;
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const res = await fetch('/api/v1/auth/saas-admin/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const raw: unknown = await res.json().catch(() => null);
    if (!res.ok || !raw || typeof raw !== 'object') return null;
    const candidate = raw as { accessToken?: unknown };
    if (typeof candidate.accessToken !== 'string' || candidate.accessToken.trim().length === 0) return null;
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, candidate.accessToken);
    return candidate.accessToken;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...customConfig } = options;
    const token = this.getAccessToken();

    const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const doFetch = async (accessToken: string) => {
      const config: RequestInit = {
        ...customConfig,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...headers,
        },
      };
      const response = await fetch(url.toString(), config);
      const data: unknown = await response.json().catch(() => ({}));
      return { response, data };
    };

    let { response, data } = await doFetch(token);

    if (!response.ok) {
      if (response.status === 401) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          ({ response, data } = await doFetch(refreshed));
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
