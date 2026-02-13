import type { DeliveryRouteDTO } from '@/src/types/delivery-routes';
import { DeliveryRoutesDbRepository } from '../repositories/deliveryRoutesDbRepository';

export class DeliveryRoutesApiService {
  private repository = new DeliveryRoutesDbRepository();

  async listRoutes(tenantId: string): Promise<DeliveryRouteDTO[]> {
    return this.repository.listByTenantId(tenantId);
  }

  async upsertRoute(tenantId: string, route: DeliveryRouteDTO): Promise<DeliveryRouteDTO> {
    return this.repository.upsertRoute(tenantId, route);
  }

  async deleteRoute(tenantId: string, routeId: string): Promise<boolean> {
    return this.repository.deleteRoute(tenantId, routeId);
  }
}
