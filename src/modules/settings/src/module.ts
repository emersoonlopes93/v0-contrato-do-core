import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { TenantSettingsService } from './tenant-settings.service';

export async function register(context: ModuleContext): Promise<void> {
  const service = new TenantSettingsService(context);
  context.registerService(asModuleId('settings'), 'TenantSettingsService', service);
}

