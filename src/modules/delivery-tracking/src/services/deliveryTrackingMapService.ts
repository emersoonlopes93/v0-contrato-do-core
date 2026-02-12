import type { DeliveryTrackingMapConfig } from '@/src/types/delivery-tracking';
import { fetchDeliveryTrackingMapConfig } from '../repositories/deliveryTrackingMapRepository';

export async function getDeliveryTrackingMapConfig(
  tenantSlug: string,
): Promise<DeliveryTrackingMapConfig> {
  return fetchDeliveryTrackingMapConfig(tenantSlug);
}
