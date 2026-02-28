import jwt, { type Algorithm } from 'jsonwebtoken';
import type { SaaSAdminToken, TenantUserToken } from './contracts';

const JWT_ALGORITHM: Algorithm = 'HS256';
const envSecret = process.env.JWT_SECRET;
if (!envSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}
const JWT_SECRET = envSecret ?? 'dev-only-secret';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export class JWTService {
  static generateSaaSAdminToken(payload: SaaSAdminToken): string {
    return jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'saas-core',
      audience: 'saas-admin',
    });
  }

  static generateTenantUserToken(payload: TenantUserToken): string {
    return jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'saas-core',
      audience: 'tenant-user',
      subject: payload.userId,
    });
  }

  static generateRefreshToken(userId: string, userType: 'saas_admin' | 'tenant_user'): string {
    return jwt.sign({ userId, userType }, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'saas-core',
      audience: 'refresh',
    });
  }

  static verifySaaSAdminToken(token: string): SaaSAdminToken {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: 'saas-core',
        audience: 'saas-admin',
      }) as SaaSAdminToken;
      return decoded;
    } catch {
      throw new Error('Invalid or expired SaaS Admin token');
    }
  }

  static verifyTenantUserToken(token: string): TenantUserToken {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: 'saas-core',
        audience: 'tenant-user',
      }) as TenantUserToken;
      return decoded;
    } catch {
      throw new Error('Invalid or expired Tenant User token');
    }
  }

  static verifyRefreshToken(token: string): { userId: string; userType: 'saas_admin' | 'tenant_user' } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM],
        issuer: 'saas-core',
        audience: 'refresh',
      }) as { userId: string; userType: 'saas_admin' | 'tenant_user' };
      return decoded;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static decode(token: string): unknown {
    return jwt.decode(token);
  }

  static getRefreshTokenExpiration(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
  }
}
