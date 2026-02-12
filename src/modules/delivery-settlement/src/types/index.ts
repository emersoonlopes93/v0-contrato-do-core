export type {
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

export interface PrismaSettlement {
  id: string;
  tenant_id: string;
  order_id: string;
  distance_km: number;
  delivery_fee: number;
  driver_amount: number;
  store_amount: number;
  platform_amount: number;
  settled_at: Date;
  created_at: Date;
  updated_at: Date;
}
