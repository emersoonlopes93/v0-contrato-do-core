import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { FinancialService } from './financial.service';

export async function register(context: ModuleContext): Promise<void> {
  const service = new FinancialService(context);
  context.registerService(asModuleId('financial'), 'FinancialService', service);
}

