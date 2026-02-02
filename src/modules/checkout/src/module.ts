import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { CheckoutService } from './checkout.service';

export async function register(context: ModuleContext): Promise<void> {
  const service = new CheckoutService(context);
  context.registerService(asModuleId('checkout'), 'CheckoutService', service);
}

