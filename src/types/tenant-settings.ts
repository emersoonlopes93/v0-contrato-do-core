export type TenantSettingsDTO = {
  id: string;
  tenantId: string;
  tradeName: string | null;
  legalName: string | null;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  currency: string | null;
  paymentProviderDefault: string | null;
  paymentPublicKey: string | null;
  paymentPrivateKey: string | null;
  kdsEnabled: boolean;
  pdvEnabled: boolean;
  realtimeEnabled: boolean;
  printingEnabled: boolean;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TenantSettingsUpdateRequest = Partial<{
  tradeName: string | null;
  legalName: string | null;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  currency: string | null;
  kdsEnabled: boolean;
  pdvEnabled: boolean;
  realtimeEnabled: boolean;
  printingEnabled: boolean;
  isOpen: boolean;
}>;

export type TenantSettingsSessionDTO = {
  tradeName: string | null;
  isOpen: boolean;
  city: string | null;
  state: string | null;
  timezone: string | null;
  paymentProviderDefault: string | null;
  paymentPublicKey: string | null;
  paymentPrivateKey: string | null;
  kdsEnabled: boolean;
  pdvEnabled: boolean;
  realtimeEnabled: boolean;
  printingEnabled: boolean;
};

export type TenantSettingsServiceContract = {
  getByTenantId(tenantId: string): Promise<TenantSettingsDTO | null>;
  upsert(tenantId: string, input: TenantSettingsUpdateRequest): Promise<TenantSettingsDTO>;
};
