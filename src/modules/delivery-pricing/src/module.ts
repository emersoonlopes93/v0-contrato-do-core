import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { DeliveryPricingService } from './services/deliveryPricingService';

export async function register(context: ModuleContext): Promise<void> {
  const service = new DeliveryPricingService();
  context.registerService(asModuleId('delivery-pricing'), 'DeliveryPricingService', service);
}
