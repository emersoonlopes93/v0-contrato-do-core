import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { MenuOnlineService } from './services/menu-online.service';

export async function register(context: ModuleContext): Promise<void> {
  const service = new MenuOnlineService(context);
  context.registerService(asModuleId('menu-online'), 'MenuOnlineService', service);
}
