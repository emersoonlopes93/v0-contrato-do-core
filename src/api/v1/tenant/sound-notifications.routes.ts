import {
  errorHandler,
  requireModule,
  requirePermission,
  requireTenantAuth,
  requestLogger,
  type AuthenticatedRequest,
  type Request,
  type Response,
  type Route,
} from '@/src/api/v1/middleware';
import { globalModuleServiceRegistry } from '@/src/core';
import { asModuleId } from '@/src/core/types';
import {
  SOUND_NOTIFICATION_EVENTS,
  SOUND_NOTIFICATION_USER_ROLES,
  type SoundNotificationEventId,
  type SoundNotificationUpsertSettingsRequest,
  type SoundNotificationUpdateSettingRequest,
  type SoundNotificationsServiceContract,
  type SoundNotificationUserRole,
} from '@/src/types/sound-notifications';

import { isRecord } from '@/src/core/utils/type-guards';

function getAuthOrFail(req: Request, res: Response): { tenantId: string; userId: string } | null {
  const authReq = req as AuthenticatedRequest;
  const auth = authReq.auth;
  if (!auth || !auth.tenantId) {
    res.status = 401;
    res.body = { error: 'Unauthorized', message: 'Authentication context is missing' };
    return null;
  }
  return { tenantId: auth.tenantId, userId: auth.userId };
}

function getService(): SoundNotificationsServiceContract | null {
  return globalModuleServiceRegistry.get<SoundNotificationsServiceContract>(
    asModuleId('sound-notifications'),
    'SoundNotificationsService',
  );
}

function isSoundNotificationEventId(value: unknown): value is SoundNotificationEventId {
  return typeof value === 'string' && Object.values(SOUND_NOTIFICATION_EVENTS).some((v) => v === value);
}

function isSoundNotificationUserRole(value: unknown): value is SoundNotificationUserRole {
  return typeof value === 'string' && Object.values(SOUND_NOTIFICATION_USER_ROLES).some((v) => v === value);
}

function parseUpsertSettings(body: unknown): { data: SoundNotificationUpsertSettingsRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const rawSettings = body.settings;
  if (!Array.isArray(rawSettings)) return { error: 'Field "settings" é obrigatório' };

  const settings: SoundNotificationUpsertSettingsRequest['settings'] = [];
  for (const item of rawSettings) {
    if (!isRecord(item)) return { error: 'Item de "settings" inválido' };
    const userRole = item.userRole;
    const event = item.event;
    const enabled = item.enabled;
    const soundKey = item.soundKey;
    const volume = item.volume;

    if (!isSoundNotificationUserRole(userRole)) return { error: 'Field "userRole" inválido' };
    if (!isSoundNotificationEventId(event)) return { error: 'Field "event" inválido' };
    if (typeof enabled !== 'boolean') return { error: 'Field "enabled" inválido' };
    if (typeof soundKey !== 'string' || soundKey.trim() === '') return { error: 'Field "soundKey" inválido' };
    if (typeof volume !== 'number' || Number.isNaN(volume)) return { error: 'Field "volume" inválido' };

    settings.push({
      userRole,
      event,
      enabled,
      soundKey,
      volume,
    });
  }

  return { data: { settings } };
}

function parseUpdateSetting(body: unknown): { data: SoundNotificationUpdateSettingRequest } | { error: string } {
  if (!isRecord(body)) return { error: 'Body inválido' };
  const enabled = body.enabled;
  const soundKey = body.soundKey;
  const volume = body.volume;

  const data: SoundNotificationUpdateSettingRequest = {};

  if (enabled !== undefined) {
    if (typeof enabled !== 'boolean') return { error: 'Field "enabled" inválido' };
    data.enabled = enabled;
  }
  if (soundKey !== undefined) {
    if (typeof soundKey !== 'string' || soundKey.trim() === '') return { error: 'Field "soundKey" inválido' };
    data.soundKey = soundKey;
  }
  if (volume !== undefined) {
    if (typeof volume !== 'number' || Number.isNaN(volume)) return { error: 'Field "volume" inválido' };
    data.volume = volume;
  }

  return { data };
}

async function handleListSettings(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Sound Notifications service not found' };
    return;
  }

  try {
    const data = await service.listSettings(auth.tenantId);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to list settings' };
  }
}

async function handleUpsertSettings(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Sound Notifications service not found' };
    return;
  }

  const parsed = parseUpsertSettings(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.upsertSettings(auth.tenantId, parsed.data);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to upsert settings' };
  }
}

async function handleUpdateSetting(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const id = req.params?.id;
  if (!id) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Missing id' };
    return;
  }

  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Sound Notifications service not found' };
    return;
  }

  const parsed = parseUpdateSetting(req.body);
  if ('error' in parsed) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: parsed.error };
    return;
  }

  try {
    const data = await service.updateSetting(auth.tenantId, id, parsed.data);
    if (!data) {
      res.status = 404;
      res.body = { error: 'Not Found', message: 'Setting not found' };
      return;
    }

    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to update setting' };
  }
}

async function handlePollEvents(req: Request, res: Response): Promise<void> {
  const auth = getAuthOrFail(req, res);
  if (!auth) return;
  const service = getService();
  if (!service) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: 'Sound Notifications service not found' };
    return;
  }

  const sinceRaw = req.query?.since ?? null;
  const limitRaw = req.query?.limit ?? null;

  const since = sinceRaw === null ? null : Number(sinceRaw);
  const limit = limitRaw === null ? undefined : Number(limitRaw);

  if (since !== null && Number.isNaN(since)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Query param "since" inválido' };
    return;
  }
  if (limit !== undefined && Number.isNaN(limit)) {
    res.status = 400;
    res.body = { error: 'Bad Request', message: 'Query param "limit" inválido' };
    return;
  }

  try {
    const data = await service.pollEvents(auth.tenantId, since, limit);
    res.status = 200;
    res.body = { success: true, data };
  } catch (error) {
    res.status = 500;
    res.body = { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'Failed to poll events' };
  }
}

export const soundNotificationsTenantRoutes: Route[] = [
  {
    method: 'GET',
    path: '/api/v1/tenant/sound-notifications/settings',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('sound-notifications'),
      requirePermission('notifications.view'),
    ],
    handler: handleListSettings,
  },
  {
    method: 'PUT',
    path: '/api/v1/tenant/sound-notifications/settings',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('sound-notifications'),
      requirePermission('notifications.manage'),
    ],
    handler: handleUpsertSettings,
  },
  {
    method: 'PATCH',
    path: '/api/v1/tenant/sound-notifications/settings/:id',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('sound-notifications'),
      requirePermission('notifications.manage'),
    ],
    handler: handleUpdateSetting,
  },
  {
    method: 'GET',
    path: '/api/v1/tenant/sound-notifications/events',
    middlewares: [
      requestLogger,
      errorHandler,
      requireTenantAuth,
      requireModule('sound-notifications'),
      requirePermission('notifications.view'),
    ],
    handler: handlePollEvents,
  },
];
