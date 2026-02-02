import type {
  GlobalTenantLoginRequest,
  GlobalTenantLoginResponse,
} from '@/src/types/auth';

export interface PublicSignupRequest {
  email: string;
  password: string;
  tenantName: string;
  tenantSlug: string;
}

export interface PublicSignupTenantDTO {
  id: string;
  slug: string;
  name: string;
}

export interface PublicSignupUserDTO {
  id: string;
  email: string;
  role: string;
}

export interface PublicSignupResponse {
  success: boolean;
  tenant: PublicSignupTenantDTO;
  user: PublicSignupUserDTO;
}

export type PublicLoginRequest = GlobalTenantLoginRequest;

export type PublicLoginResponse = GlobalTenantLoginResponse;

