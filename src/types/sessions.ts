export interface ListSessionsResponse {
  sessions: Array<{
    id: string;
    createdAt: string;
    expiresAt: string;
    revoked: boolean;
  }>;
}

export interface RevokeSessionRequest {
  id: string;
}

export interface GenericOkResponse {
  ok: true;
}
