import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { CustomersCrmService } from './services/customers-crm.service';

export async function register(context: ModuleContext): Promise<void> {
  const service = new CustomersCrmService(context);
  context.registerService(asModuleId('customers-crm'), 'CustomersCrmService', service);
}
