import jwt from 'jsonwebtoken';
import type { SaaSAdminToken, TenantUserToken } from './contracts';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m'; // Access token: 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Refresh token: 7 days

export class JWTService {
  // ==========================================
  // ACCESS TOKENS
  // ==========================================

  static generateSaaSAdminToken(payload: SaaSAdminToken): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'saas-core',
      audience: 'saas-admin',
    });
  }

  static generateTenantUserToken(payload: TenantUserToken): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'saas-core',
      audience: 'tenant-user',
    });
  }

  // ==========================================
  // REFRESH TOKENS
  // ==========================================

  static generateRefreshToken(userId: string, userType: 'saas_admin' | 'tenant_user'): string {
    return jwt.sign(
      { userId, userType },
      JWT_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'saas-core',
        audience: 'refresh',
      }
    );
  }

  // ==========================================
  // VERIFICATION
  // ==========================================

  static verifySaaSAdminToken(token: string): SaaSAdminToken {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'saas-core',
        audience: 'saas-admin',
      }) as SaaSAdminToken;

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired SaaS Admin token');
    }
  }

  static verifyTenantUserToken(token: string): TenantUserToken {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'saas-core',
        audience: 'tenant-user',
      }) as TenantUserToken;

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired Tenant User token');
    }
  }

  static verifyRefreshToken(token: string): { userId: string; userType: 'saas_admin' | 'tenant_user' } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'saas-core',
        audience: 'refresh',
      }) as { userId: string; userType: 'saas_admin' | 'tenant_user' };

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  static decode(token: string): any {
    return jwt.decode(token);
  }

  static getRefreshTokenExpiration(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 7); // 7 days
    return now;
  }
}
