import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { SoundNotificationsService } from './services/sound-notifications.service';

export async function register(context: ModuleContext): Promise<void> {
  const service = new SoundNotificationsService(context);
  context.registerService(asModuleId('sound-notifications'), 'SoundNotificationsService', service);
}
