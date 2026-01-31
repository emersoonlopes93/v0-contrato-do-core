// Contracts
export type { IAuthService, IAuthGuard, IAuthRepository } from './contracts';
export type { SaaSAdminToken, TenantUserToken, AuthToken, UserContext } from './contracts';

// Services
export { SaaSAdminAuthService } from './saas-admin/saas-admin-auth.service';
export type {
  SaaSAdminLoginRequest,
  SaaSAdminLoginResponse,
  SaaSAdminRegisterRequest,
} from './saas-admin/saas-admin-auth.service';

export { TenantAuthService } from './tenant/tenant-auth.service';
export type {
  TenantUserLoginRequest,
  TenantUserLoginResponse,
  TenantUserRegisterRequest,
} from './tenant/tenant-auth.service';

// Guards
export { AuthGuards } from './guards';
export type {
  GuardContext,
  SaaSAdminGuardResult,
  TenantUserGuardResult,
} from './guards';

// Utilities
export { PasswordService } from './password';
export { JWTService } from './jwt';
