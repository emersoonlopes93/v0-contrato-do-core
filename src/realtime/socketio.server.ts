import type http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/src/adapters/prisma/client';
import { JWTService, setRealtimeEmitter } from '@/src/core';
import type { RealtimeEmitter, RealtimeEnvelope, RealtimeEventName } from '@/src/core';
import { isRecord } from '@/src/core/utils/type-guards';

function getBearerToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) return null;
  const token = trimmed.slice(7).trim();
  return token.length > 0 ? token : null;
}

function getHandshakeToken(socket: { handshake: { auth?: unknown; headers: Record<string, unknown> } }): string | null {
  const auth = socket.handshake.auth;
  if (isRecord(auth) && typeof auth.token === 'string' && auth.token.trim().length > 0) {
    return auth.token.trim();
  }
  const headerToken = getBearerToken(socket.handshake.headers.authorization);
  if (headerToken) return headerToken;
  return null;
}

function getTenantIdFromNamespace(namespaceName: string): string | null {
  const prefix = '/ws/tenant/';
  if (!namespaceName.startsWith(prefix)) return null;
  const tenantId = namespaceName.slice(prefix.length);
  return tenantId.length > 0 ? tenantId : null;
}

function toEnvelope(
  tenantId: string,
  event: RealtimeEventName,
  payload: Record<string, unknown>,
  eventId?: string,
): RealtimeEnvelope<Record<string, unknown>> {
  return {
    eventId: eventId ?? `${event}:${tenantId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
    event,
    tenantId,
    payload,
    timestamp: new Date().toISOString(),
  };
}

export function initRealtimeServer(httpServer: http.Server): void {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  const nsp = io.of(/^\/ws\/tenant\/[0-9a-fA-F-]{36}$/);

  nsp.use(async (
    socket: { handshake: { auth?: unknown; headers: Record<string, unknown> }; nsp: { name: string } },
    next: (err?: Error) => void,
  ) => {
    const token = getHandshakeToken(socket);
    if (!token) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    const namespaceTenantId = getTenantIdFromNamespace(socket.nsp.name);
    if (!namespaceTenantId) {
      next(new Error('INVALID_NAMESPACE'));
      return;
    }

    let payload: { tenantId?: string } | null = null;
    try {
      const decoded = JWTService.verifyTenantUserToken(token);
      payload = { tenantId: decoded.tenantId };
    } catch {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    if (!payload.tenantId || payload.tenantId !== namespaceTenantId) {
      next(new Error('FORBIDDEN'));
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: namespaceTenantId },
      select: { status: true },
    });

    if (!tenant || tenant.status !== 'active') {
      next(new Error('TENANT_INACTIVE'));
      return;
    }

    next();
  });

  setRealtimeEmitter({
    emitToTenant<TPayload extends Record<string, unknown>>(
      tenantId: string,
      event: RealtimeEventName,
      payload: TPayload,
      eventId?: string,
    ): void {
      const envelope = toEnvelope(tenantId, event, payload, eventId);
      io.of(`/ws/tenant/${tenantId}`).emit(event, envelope);
    },
  } satisfies RealtimeEmitter);
}
