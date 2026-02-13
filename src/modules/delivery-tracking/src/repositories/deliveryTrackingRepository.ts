import type { DeliveryDriverDTO } from '@/src/types/delivery-drivers';
import type { DeliveryRouteDTO } from '@/src/types/delivery-routes';
import { listDeliveryDrivers } from '@/src/modules/delivery-drivers/src/services/deliveryDriversService';
import { listAllRoutes } from '@/src/modules/delivery-routes/src/services/deliveryRoutesService';

export type DeliveryTrackingRawData = {
  drivers: DeliveryDriverDTO[];
  routes: DeliveryRouteDTO[];
};

export async function loadDeliveryTrackingData(tenantSlug: string): Promise<DeliveryTrackingRawData> {
  const drivers = await listDeliveryDrivers(tenantSlug);
  const routes = await listAllRoutes(tenantSlug);
  return {
    drivers,
    routes,
  };
}
