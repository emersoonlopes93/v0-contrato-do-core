import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { SoundNotificationsListener } from './listeners/sound-notifications.listener';
import { SoundNotificationsService } from './services/sound-notifications.service';

export async function register(context: ModuleContext): Promise<void> {
  const service = new SoundNotificationsService(context);
  context.registerService(asModuleId('sound-notifications'), 'SoundNotificationsService', service);
  const listener = new SoundNotificationsListener(context.eventBus, service);
  listener.register();
}
