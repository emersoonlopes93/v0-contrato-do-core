import { getPrismaClient } from '../../adapters/prisma/client';

export interface TenantContextRequest {
  subdomain?: string;
  headers?: Record<string, string>;
  pathParams?: Record<string, string>;
  token?: string; // JWT token (já decodificado)
}

export interface TenantContextResult {
  tenantId: string;
  strategy: 'token' | 'subdomain' | 'header' | 'path';
}

export class TenantContextResolver {
  private prisma = getPrismaClient();

  /**
   * Resolve tenant_id por diferentes estratégias
   * Ordem de precedência:
   * 1. JWT Token (se autenticado)
   * 2. Header X-Tenant-ID
   * 3. Subdomain
   * 4. Path param
   */
  async resolve(request: TenantContextRequest): Promise<TenantContextResult> {
    // 1. JWT Token (maior precedência)
    if (request.token) {
      const tenantId = this.extractTenantIdFromToken(request.token);
      if (tenantId) {
        return {
          tenantId,
          strategy: 'token',
        };
      }
    }

    // 2. Header X-Tenant-ID
    if (request.headers?.['x-tenant-id']) {
      const tenantId = request.headers['x-tenant-id'];
      await this.validateTenantExists(tenantId);
      return {
        tenantId,
        strategy: 'header',
      };
    }

    // 3. Subdomain
    if (request.subdomain) {
      const tenantId = await this.resolveTenantBySubdomain(request.subdomain);
      return {
        tenantId,
        strategy: 'subdomain',
      };
    }

    // 4. Path param
    if (request.pathParams?.tenantId) {
      const tenantId = request.pathParams.tenantId;
      await this.validateTenantExists(tenantId);
      return {
        tenantId,
        strategy: 'path',
      };
    }

    throw new Error('Tenant context could not be resolved');
  }

  /**
   * Extrai tenant_id do JWT decodificado
   */
  private extractTenantIdFromToken(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload));
      return decoded.tenantId || null;
    } catch {
      return null;
    }
  }

  /**
   * Resolve tenant por subdomain
   * Exemplo: tenant1.app.com -> busca tenant com slug "tenant1"
   */
  private async resolveTenantBySubdomain(subdomain: string): Promise<string> {
    // Extrai apenas o primeiro segmento (tenant1.app.com -> tenant1)
    const slug = subdomain.split('.')[0];

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, status: true },
    });

    if (!tenant) {
      throw new Error(`Tenant not found for subdomain: ${subdomain}`);
    }

    if (tenant.status !== 'active') {
      throw new Error(`Tenant is not active: ${tenant.status}`);
    }

    return tenant.id;
  }

  /**
   * Valida se tenant existe e está ativo
   */
  private async validateTenantExists(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    if (tenant.status !== 'active') {
      throw new Error(`Tenant is not active: ${tenant.status}`);
    }
  }
}
