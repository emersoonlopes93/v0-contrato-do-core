import type { ClientTrackingMapConfig } from '@/src/types/client-tracking';
import { fetchClientTrackingMapConfig } from '../repositories/clientTrackingMapRepository';

export async function getClientTrackingMapConfig(
  token: string,
): Promise<ClientTrackingMapConfig> {
  return fetchClientTrackingMapConfig(token);
}
