import type { SaaSAdminToken } from '../contracts';
import { PasswordService } from '../password';
import { JWTService } from '../jwt';
import { AuthRepository } from '../../../adapters/prisma/repositories/auth-repository';

export interface SaaSAdminLoginRequest {
  email: string;
  password: string;
}

export interface SaaSAdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export interface SaaSAdminRegisterRequest {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export class SaaSAdminAuthService {
  private authRepo = new AuthRepository();

  // ==========================================
  // LOGIN
  // ==========================================

  async login(request: SaaSAdminLoginRequest): Promise<SaaSAdminLoginResponse> {
    const { email, password } = request;

    // 1. Find user
    const user = await this.authRepo.findSaaSAdminByEmail(email);
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

    // 4. Generate tokens
    const tokenPayload: SaaSAdminToken = {
      context: 'saas_admin',
      userId: user.id,
      role: user.role as 'admin' | 'moderator',
    };

    const accessToken = JWTService.generateSaaSAdminToken(tokenPayload);
    const refreshToken = JWTService.generateRefreshToken(user.id, 'saas_admin');

    // 5. Save refresh token
    await this.authRepo.saveRefreshToken({
      userId: user.id,
      userType: 'saas_admin',
      token: refreshToken,
      expiresAt: JWTService.getRefreshTokenExpiration(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // ==========================================
  // REGISTER
  // ==========================================

  async register(request: SaaSAdminRegisterRequest): Promise<SaaSAdminLoginResponse> {
    const { email, password, name, role = 'admin' } = request;

    // 1. Check if user exists
    const existingUser = await this.authRepo.findSaaSAdminByEmail(email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // 2. Validate password strength
    const passwordValidation = PasswordService.validateStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // 3. Hash password
    const passwordHash = await PasswordService.hash(password);

    // 4. Create user
    const user = await this.authRepo.createSaaSAdmin({
      email,
      password_hash: passwordHash,
      name,
      role,
    });

    // 5. Generate tokens
    const tokenPayload: SaaSAdminToken = {
      context: 'saas_admin',
      userId: user.id,
      role: user.role as 'admin' | 'moderator',
    };

    const accessToken = JWTService.generateSaaSAdminToken(tokenPayload);
    const refreshToken = JWTService.generateRefreshToken(user.id, 'saas_admin');

    // 6. Save refresh token
    await this.authRepo.saveRefreshToken({
      userId: user.id,
      userType: 'saas_admin',
      token: refreshToken,
      expiresAt: JWTService.getRefreshTokenExpiration(),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  // ==========================================
  // REFRESH TOKEN
  // ==========================================

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    // 1. Verify refresh token
    const decoded = JWTService.verifyRefreshToken(refreshToken);

    if (decoded.userType !== 'saas_admin') {
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
    const user = await this.authRepo.findSaaSAdminById(decoded.userId);
    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }

    // 5. Generate new access token
    const tokenPayload: SaaSAdminToken = {
      context: 'saas_admin',
      userId: user.id,
      role: user.role as 'admin' | 'moderator',
    };

    const accessToken = JWTService.generateSaaSAdminToken(tokenPayload);

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
