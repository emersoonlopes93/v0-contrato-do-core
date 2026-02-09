import crypto from 'crypto';
import {
  createToken,
  findActiveTokenForOrder,
  findValidToken,
  touchToken,
  type PublicTrackingTokenRecord,
} from '../repositories/publicTrackingRepository';

const DEFAULT_TOKEN_TTL_HOURS = 24;

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function getOrCreateTrackingToken(
  tenantId: string,
  orderId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const now = new Date();
  const existing = await findActiveTokenForOrder(tenantId, orderId, now);
  if (existing) {
    return { token: existing.token, expiresAt: existing.expiresAt };
  }
  const token = generateToken();
  const expiresAt = addHours(now, DEFAULT_TOKEN_TTL_HOURS);
  const created = await createToken(tenantId, orderId, token, expiresAt);
  return { token: created.token, expiresAt: created.expiresAt };
}

export async function resolveTrackingToken(
  token: string,
): Promise<PublicTrackingTokenRecord | null> {
  const now = new Date();
  const record = await findValidToken(token, now);
  if (!record) return null;
  await touchToken(record.id, now);
  return record;
}
