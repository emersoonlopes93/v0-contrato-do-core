import type { TenantUserToken } from '../contracts';
import { PasswordService } from '../password';
import { JWTService } from '../jwt';
import { AuthRepository } from '../../../adapters/prisma/repositories/auth-repository';
import { asModuleId, asUUID, UserContext } from '../../types';

export interface TenantUserLoginRequest {
  tenantId: string;
  email: string;
  password: string;
}

export interface TenantUserLoginResponse {
  accessToken: string;
  refreshToken: string;
  activeModules: string[];
  user: {
    id: string;
    email: string;
    name: string | null;
    tenantId: string;
    role: string;
    permissions: string[];
  };
}

export interface TenantUserRegisterRequest {
  tenantId: string;
  email: string;
  password: string;
  name?: string;
}

export class TenantAuthService {
  private authRepo = new AuthRepository();

  // ==========================================
  // LOGIN
  // ==========================================

  async login(request: TenantUserLoginRequest): Promise<TenantUserLoginResponse> {
    const { tenantId, email, password } = request;

    // 1. Find user
    const user = await this.authRepo.findTenantUserByEmail(tenantId, email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Check status
    if (user.status !== 'active') {
      throw new Error('User is not active');
    }

    // 3. Verify password
    const isPasswordValid = await PasswordService.verify(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 4. Load RBAC permissions
    const permissions = await this.authRepo.getTenantUserPermissions(user.id, tenantId);
    const userRoles = await this.authRepo.getTenantUserRoles(user.id, tenantId);
    const activeModules = await this.authRepo.getTenantActiveModules(tenantId);
    
    // Get first role name (simplified - can be enhanced)
    const primaryRole = userRoles[0]?.role.name ?? 'user';

    // 5. Generate tokens
    const tokenPayload: TenantUserToken = {
      context: UserContext.TENANT_USER,
      userId: asUUID(user.id),
      tenantId: asUUID(tenantId),
      role: primaryRole,
      permissions,
      activeModules: activeModules.map(asModuleId),
    };

    const accessToken = JWTService.generateTenantUserToken(tokenPayload);
    const refreshToken = JWTService.generateRefreshToken(user.id, 'tenant_user');

    // 6. Save refresh token with tenant_id
    await this.authRepo.saveRefreshToken({
      userId: user.id,
      userType: 'tenant_user',
      tenantId,
      token: refreshToken,
      expiresAt: JWTService.getRefreshTokenExpiration(),
    });

    return {
      accessToken,
      refreshToken,
      activeModules,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId,
        role: primaryRole,
        permissions,
      },
    };
  }

  // ==========================================
  // REGISTER
  // ==========================================

  async register(request: TenantUserRegisterRequest): Promise<TenantUserLoginResponse> {
    const { tenantId, email, password, name } = request;

    // 1. Check if user exists
    const existingUser = await this.authRepo.findTenantUserByEmail(tenantId, email);
    if (existingUser) {
      throw new Error('Email already in use in this tenant');
    }

    // 2. Validate password strength
    const passwordValidation = PasswordService.validateStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // 3. Hash password
    const passwordHash = await PasswordService.hash(password);

    // 4. Create user
    const user = await this.authRepo.createTenantUser({
      tenant_id: tenantId,
      email,
      password_hash: passwordHash,
      name,
    });

    // 5. Load RBAC permissions (empty for new users until roles are assigned)
    const permissions: string[] = [];
    const role = 'user'; // Default role

    // 6. Generate tokens
    const tokenPayload: TenantUserToken = {
      context: UserContext.TENANT_USER,
      userId: asUUID(user.id),
      tenantId: asUUID(user.tenant_id),
      role,
      permissions,
      activeModules: [],
    };

    const accessToken = JWTService.generateTenantUserToken(tokenPayload);
    const refreshToken = JWTService.generateRefreshToken(user.id, 'tenant_user');

    // 7. Save refresh token
    await this.authRepo.saveRefreshToken({
      userId: user.id,
      userType: 'tenant_user',
      tenantId: user.tenant_id,
      token: refreshToken,
      expiresAt: JWTService.getRefreshTokenExpiration(),
    });

    return {
      accessToken,
      refreshToken,
      activeModules: [],
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenant_id,
        role,
        permissions,
      },
    };
  }

  // ==========================================
  // REFRESH TOKEN
  // ==========================================

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // 1. Verify refresh token
    const decoded = JWTService.verifyRefreshToken(refreshToken);

    if (decoded.userType !== 'tenant_user') {
      throw new Error('Invalid token type');
    }

    // 2. Check if refresh token exists and is not revoked
    const storedToken = await this.authRepo.findRefreshToken(refreshToken);
    if (!storedToken || storedToken.revoked) {
      throw new Error('Refresh token is invalid or revoked');
    }

    // 3. Check expiration
    if (storedToken.expires_at < new Date()) {
      throw new Error('Refresh token expired');
    }

    // 4. Get user
    const user = await this.authRepo.findTenantUserById(decoded.userId);
    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }

    // IMPORTANTE: tenant_id vem do token armazenado (precedência do token)
    const tenantId = storedToken.tenant_id!;

    // 5. Reload RBAC permissions (pode ter mudado)
    const permissions = await this.authRepo.getTenantUserPermissions(user.id, tenantId);
    const userRoles = await this.authRepo.getTenantUserRoles(user.id, tenantId);
    const activeModules = await this.authRepo.getTenantActiveModules(tenantId);
    const primaryRole = userRoles[0]?.role.name ?? 'user';

    // 6. Generate new access token
    const tokenPayload: TenantUserToken = {
      context: UserContext.TENANT_USER,
      userId: asUUID(user.id),
      tenantId: asUUID(tenantId),
      role: primaryRole,
      permissions,
      activeModules: activeModules.map(asModuleId),
    };

    const accessToken = JWTService.generateTenantUserToken(tokenPayload);

    return { accessToken };
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async logout(refreshToken: string): Promise<void> {
    await this.authRepo.revokeRefreshToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.authRepo.revokeAllUserRefreshTokens(userId);
  }
}
