import type { ModuleContext } from '@/src/core/modules/contracts';
import { asModuleId } from '@/src/core/types';
import { OrdersService } from './services/orders.service';
import { OrdersListener } from './listeners/orders.listener';

export async function register(context: ModuleContext): Promise<void> {
  const ordersService = new OrdersService(context);

  context.registerService(asModuleId('orders-module'), 'OrdersService', ordersService);

  const listener = new OrdersListener(context.eventBus);
  listener.register();
}
