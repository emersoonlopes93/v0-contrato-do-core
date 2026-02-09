import { getPrismaClient } from '@/src/adapters/prisma/client';

type PublicTrackingTokenRow = {
  id: string;
  tenant_id: string;
  order_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  last_used_at: Date | null;
};

type PublicTrackingTokenDelegate = {
  findFirst(args: {
    where?: {
      tenant_id?: string;
      order_id?: string;
      token?: string;
      expires_at?: { gt: Date };
    };
    orderBy?: { created_at: 'asc' | 'desc' };
  }): Promise<PublicTrackingTokenRow | null>;
  create(args: {
    data: {
      tenant_id: string;
      order_id: string;
      token: string;
      expires_at: Date;
    };
  }): Promise<PublicTrackingTokenRow>;
  update(args: {
    where: { id: string };
    data: { last_used_at: Date };
  }): Promise<PublicTrackingTokenRow>;
};

const prisma = getPrismaClient() as unknown as {
  publicTrackingToken: PublicTrackingTokenDelegate;
};

export type PublicTrackingTokenRecord = {
  id: string;
  tenantId: string;
  orderId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date | null;
};

function toRecord(row: PublicTrackingTokenRow): PublicTrackingTokenRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    orderId: row.order_id,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

export async function findActiveTokenForOrder(
  tenantId: string,
  orderId: string,
  now: Date,
): Promise<PublicTrackingTokenRecord | null> {
  const row = await prisma.publicTrackingToken.findFirst({
    where: {
      tenant_id: tenantId,
      order_id: orderId,
      expires_at: { gt: now },
    },
    orderBy: { created_at: 'desc' },
  });
  return row ? toRecord(row) : null;
}

export async function findValidToken(
  token: string,
  now: Date,
): Promise<PublicTrackingTokenRecord | null> {
  const row = await prisma.publicTrackingToken.findFirst({
    where: {
      token,
      expires_at: { gt: now },
    },
  });
  return row ? toRecord(row) : null;
}

export async function createToken(
  tenantId: string,
  orderId: string,
  token: string,
  expiresAt: Date,
): Promise<PublicTrackingTokenRecord> {
  const row = await prisma.publicTrackingToken.create({
    data: {
      tenant_id: tenantId,
      order_id: orderId,
      token,
      expires_at: expiresAt,
    },
  });
  return toRecord(row);
}

export async function touchToken(tokenId: string, now: Date): Promise<void> {
  await prisma.publicTrackingToken.update({
    where: { id: tokenId },
    data: { last_used_at: now },
  });
}
