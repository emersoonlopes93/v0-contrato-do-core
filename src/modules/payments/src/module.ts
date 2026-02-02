import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { PaymentsService } from './payments.service';

export async function register(context: ModuleContext): Promise<void> {
  const service = new PaymentsService(context);
  context.registerService(asModuleId('payments'), 'PaymentsService', service);
}

