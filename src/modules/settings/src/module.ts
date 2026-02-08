import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { TenantSettingsService } from './tenant-settings.service';
import { PrintingService } from './printing.service';
import { PrintingListener } from './printing.listener';

export async function register(context: ModuleContext): Promise<void> {
  const service = new TenantSettingsService(context);
  context.registerService(asModuleId('settings'), 'TenantSettingsService', service);

  const printingService = new PrintingService(context);
  context.registerService(asModuleId('settings'), 'PrintingService', printingService);

  const printingListener = new PrintingListener(context.eventBus, printingService);
  printingListener.register();
}
