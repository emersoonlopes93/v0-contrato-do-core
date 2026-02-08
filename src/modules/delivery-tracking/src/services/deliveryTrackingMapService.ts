import type { DeliveryTrackingMapConfig } from '@/src/types/delivery-tracking';
import { fetchDeliveryTrackingMapConfig } from '../repositories/deliveryTrackingMapRepository';

export async function getDeliveryTrackingMapConfig(
  accessToken: string,
): Promise<DeliveryTrackingMapConfig> {
  return fetchDeliveryTrackingMapConfig(accessToken);
}
