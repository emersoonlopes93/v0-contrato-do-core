export interface SaaSAdminMfaVerifyRequest {
  code: string;
}

export interface SaaSAdminMfaInitResponse {
  mfaRequired: true;
}

export interface SaaSAdminMfaVerifyResponse {
  ok: true;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}
