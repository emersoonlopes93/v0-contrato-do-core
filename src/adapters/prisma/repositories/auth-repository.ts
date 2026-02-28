import { getPrismaClient } from '../client';
import crypto from 'crypto';

export interface IAuthRepository {
  findSaaSAdminByEmail(email: string): Promise<unknown>;
  findTenantUserByEmail(tenantId: string, email: string): Promise<unknown>;
  getTenantUserPermissions(userId: string, tenantId: string): Promise<string[]>;
  getTenantActiveModules(tenantId: string): Promise<string[]>;
  saveRefreshToken(data: unknown): Promise<unknown>;
  revokeRefreshToken(token: string): Promise<unknown>;
}

export class AuthRepository {
  private prisma = getPrismaClient();

  // ==========================================
  // SAAS ADMIN
  // ==========================================

  async findSaaSAdminByEmail(email: string) {
    return this.prisma.saaSAdminUser.findUnique({
      where: { email },
    });
  }

  async findSaaSAdminById(id: string) {
    return this.prisma.saaSAdminUser.findUnique({
      where: { id },
    });
  }

  async createSaaSAdmin(data: {
    email: string;
    password_hash: string;
    name?: string;
    role: string;
  }) {
    return this.prisma.saaSAdminUser.create({
      data,
    });
  }

  // ==========================================
  // TENANT USER
  // ==========================================

  async findTenantUserByEmail(tenantId: string, email: string) {
    return this.prisma.tenantUser.findUnique({
      where: {
        tenant_id_email: {
          tenant_id: tenantId,
          email,
        },
      },
    });
  }

  async findAnyTenantUserByEmail(email: string) {
    return this.prisma.tenantUser.findFirst({
      where: { email },
    });
  }

  async findTenantUserById(id: string) {
    return this.prisma.tenantUser.findUnique({
      where: { id },
    });
  }

  async createTenantUser(data: {
    tenant_id: string;
    email: string;
    password_hash: string;
    name?: string;
  }) {
    return this.prisma.tenantUser.create({
      data,
    });
  }

  // ==========================================
  // RBAC - TENANT USER ROLES & PERMISSIONS
  // ==========================================

  async getTenantUserRoles(userId: string, tenantId: string) {
    return this.prisma.userRole.findMany({
      where: {
        user_id: userId,
        tenant_id: tenantId,
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async getTenantUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    const userRoles = await this.getTenantUserRoles(userId, tenantId);

    const permissions = new Set<string>();

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.rolePermissions) {
        permissions.add(rolePermission.permission.slug);
      }
    }

    return Array.from(permissions);
  }

  async getTenantActiveModules(tenantId: string): Promise<string[]> {
    const modules = await this.prisma.tenantModule.findMany({
      where: {
        tenant_id: tenantId,
        status: 'active',
        deactivated_at: null,
      },
      include: {
        module: true,
      },
    });
    return modules.map(m => m.module.slug);
  }

  // ==========================================
  // REFRESH TOKENS
  // ==========================================

  async saveRefreshToken(data: {
    userId: string;
    userType: 'saas_admin' | 'tenant_user';
    tenantId?: string;
    token: string;
    expiresAt: Date;
  }) {
    const tokenHash = this.hashToken(data.token);

    return this.prisma.refreshToken.create({
      data: {
        token_hash: tokenHash,
        user_id: data.userId,
        user_type: data.userType,
        tenant_id: data.tenantId || null,
        expires_at: data.expiresAt,
      },
    });
  }

  async findRefreshToken(token: string) {
    const tokenHash = this.hashToken(token);

    return this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });
  }

  async revokeRefreshToken(token: string) {
    const tokenHash = this.hashToken(token);

    return this.prisma.refreshToken.update({
      where: { token_hash: tokenHash },
      data: { revoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data: { revoked: true },
    });
  }

  async listUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async revokeRefreshTokenById(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revoked: true },
    });
  }

  async cleanExpiredRefreshTokens() {
    return this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expires_at: { lt: new Date() } },
          { revoked: true },
        ],
      },
    });
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
