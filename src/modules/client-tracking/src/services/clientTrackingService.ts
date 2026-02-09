import type { ClientTrackingSnapshot } from '@/src/types/client-tracking';
import { fetchClientTrackingSnapshot } from '../repositories/clientTrackingRepository';

export async function getClientTrackingSnapshot(
  token: string,
): Promise<ClientTrackingSnapshot> {
  return fetchClientTrackingSnapshot(token);
}
