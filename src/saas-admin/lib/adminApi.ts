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
  private getAccessToken(): string {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    return token;
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

    const config: RequestInit = {
      ...customConfig,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    };

    const response = await fetch(url.toString(), config);
    const data = await response.json();

    if (!response.ok) {
      // Se for 401, a sessão provavelmente expirou ou é inválida
      if (response.status === 401) {
        // Opção: Redirecionar para login ou apenas lançar erro
        // window.location.href = '/login/admin'; // Descomentar se desejar redirect automático
      }
      throw new Error(data.message || data.error || 'Erro na requisição');
    }

    return data.data !== undefined ? data.data : data; // Suporte para { success: true, data: ... } ou retorno direto
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
