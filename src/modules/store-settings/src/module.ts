import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { StoreSettingsService } from './store-settings.service';

export async function register(context: ModuleContext): Promise<void> {
  const service = new StoreSettingsService(context);
  context.registerService(asModuleId('store-settings'), 'StoreSettingsService', service);
}

