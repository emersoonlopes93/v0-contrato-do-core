import type {
  DeliverySettlementDTO,
  DeliverySettlementSettingsDTO,
  DeliverySettlementSettingsCreateRequest,
  DeliverySettlementSettingsUpdateRequest,
  SettlementCalculationRequest,
  SettlementSplitResult,
  DeliverySettlementListRequest,
  DeliverySettlementListResponse,
  DeliverySettlementServiceContract,
} from '@/src/types/delivery-settlement';
import { DeliverySettlementRepository } from '../repositories/deliverySettlementRepository';
import { calculateSettlementSplit } from '../rules/settlementRules';

export class DeliverySettlementService implements DeliverySettlementServiceContract {
  private repository = new DeliverySettlementRepository();

  async getSettings(tenantId: string): Promise<DeliverySettlementSettingsDTO | null> {
    return this.repository.getSettings(tenantId);
  }

  async upsertSettings(
    tenantId: string,
    input: DeliverySettlementSettingsCreateRequest,
  ): Promise<DeliverySettlementSettingsDTO> {
    return this.repository.upsertSettings(tenantId, input);
  }

  async updateSettings(
    tenantId: string,
    input: DeliverySettlementSettingsUpdateRequest,
  ): Promise<DeliverySettlementSettingsDTO | null> {
    return this.repository.updateSettings(tenantId, input);
  }

  async calculateSplit(
    tenantId: string,
    request: SettlementCalculationRequest,
  ): Promise<SettlementSplitResult> {
    const settings = await this.getSettings(tenantId);
    
    if (!settings) {
      throw new Error('Configurações de repasse não encontradas para este tenant');
    }

    return calculateSettlementSplit(settings, request);
  }

  async createSettlement(
    tenantId: string,
    orderId: string,
    distanceKm: number,
    deliveryFee: number,
  ): Promise<DeliverySettlementDTO> {
    const existingSettlement = await this.getSettlementByOrderId(tenantId, orderId);
    
    if (existingSettlement) {
      throw new Error('Já existe um repasse para este pedido');
    }

    const split = await this.calculateSplit(tenantId, {
      tenantId,
      orderId,
      distanceKm,
      deliveryFee,
    });

    return this.repository.createSettlement(
      tenantId,
      orderId,
      distanceKm,
      deliveryFee,
      split.driverAmount,
      split.storeAmount,
      split.platformAmount,
    );
  }

  async getSettlementByOrderId(
    tenantId: string,
    orderId: string,
  ): Promise<DeliverySettlementDTO | null> {
    return this.repository.getSettlementByOrderId(tenantId, orderId);
  }

  async listSettlements(
    request: DeliverySettlementListRequest,
  ): Promise<DeliverySettlementListResponse> {
    return this.repository.listSettlements(request);
  }

  async processOrderSettlement(
    tenantId: string,
    orderId: string,
    distanceKm: number,
    deliveryFee: number,
  ): Promise<DeliverySettlementDTO | null> {
    try {
      return await this.createSettlement(tenantId, orderId, distanceKm, deliveryFee);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Já existe um repasse')) {
        return await this.getSettlementByOrderId(tenantId, orderId);
      }
      throw error;
    }
  }
}
