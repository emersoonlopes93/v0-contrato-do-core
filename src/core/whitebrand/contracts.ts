import type { TenantId, WhiteBrandConfig, GlobalWhiteBrandConfig } from "../types/index";

export interface GlobalWhiteBrandService {
  getConfig(): Promise<GlobalWhiteBrandConfig>;
  updateConfig(data: Partial<GlobalWhiteBrandConfig>): Promise<GlobalWhiteBrandConfig>;
}

export interface TenantWhiteBrandService {
  getConfig(tenantId: TenantId): Promise<WhiteBrandConfig>;
  updateConfig(tenantId: TenantId, data: Partial<WhiteBrandConfig>): Promise<WhiteBrandConfig>;
  resetToGlobal(tenantId: TenantId): Promise<void>;
}

export interface WhiteBrandRepository {
  getGlobalConfig(): Promise<GlobalWhiteBrandConfig | null>;
  saveGlobalConfig(config: GlobalWhiteBrandConfig): Promise<void>;

  getTenantConfig(tenantId: TenantId): Promise<WhiteBrandConfig | null>;
  saveTenantConfig(config: WhiteBrandConfig): Promise<void>;
  deleteTenantConfig(tenantId: TenantId): Promise<void>;
}
