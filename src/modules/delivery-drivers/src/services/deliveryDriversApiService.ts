import type {
  DeliveryDriverDTO,
  DeliveryDriverHistoryEntryDTO,
  DeliveryDriverStatus,
} from '@/src/types/delivery-drivers';
import { DeliveryDriversDbRepository } from '../repositories/deliveryDriversDbRepository';

export class DeliveryDriversApiService {
  private repository = new DeliveryDriversDbRepository();

  async listDrivers(tenantId: string): Promise<DeliveryDriverDTO[]> {
    return this.repository.listByTenantId(tenantId);
  }

  async listHistory(tenantId: string): Promise<DeliveryDriverHistoryEntryDTO[]> {
    return this.repository.listHistoryByTenantId(tenantId);
  }

  async createDriver(tenantId: string, input: { name: string; phone: string | null }): Promise<DeliveryDriverDTO> {
    return this.repository.createDriver(tenantId, input);
  }

  async updateDriver(
    tenantId: string,
    driverId: string,
    input: Partial<{
      name: string;
      phone: string | null;
      status: DeliveryDriverStatus;
      activeOrderId: string | null;
      latitude: number | null;
      longitude: number | null;
      lastLocationAt: string | null;
      lastDeliveryAt: string | null;
    }>,
  ): Promise<DeliveryDriverDTO> {
    return this.repository.updateDriver(tenantId, driverId, input);
  }

  async appendHistoryEntry(
    tenantId: string,
    input: { driverId: string; orderId: string; status: DeliveryDriverStatus },
  ): Promise<DeliveryDriverHistoryEntryDTO> {
    return this.repository.appendHistoryEntry(tenantId, input);
  }
}
