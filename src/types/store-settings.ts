export type StoreSettingsAddress = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
};

export type StoreSettingsOpeningHoursDay = {
  isOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
};

export type StoreSettingsOpeningHours = {
  mon: StoreSettingsOpeningHoursDay;
  tue: StoreSettingsOpeningHoursDay;
  wed: StoreSettingsOpeningHoursDay;
  thu: StoreSettingsOpeningHoursDay;
  fri: StoreSettingsOpeningHoursDay;
  sat: StoreSettingsOpeningHoursDay;
  sun: StoreSettingsOpeningHoursDay;
  holidays?: Array<{
    date: string;
    name?: string | null;
    isOpen: boolean;
    opensAt: string | null;
    closesAt: string | null;
  }>;
};

export type StoreSettingsPaymentMethods = {
  cash: boolean;
  pix: boolean;
  card: {
    enabled: boolean;
    flags: string[];
  };
};

export type StoreSettingsDTO = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  address: StoreSettingsAddress;
  openingHours: StoreSettingsOpeningHours;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
  minimumOrder: number;
  deliveryFee: number;
  averagePrepTimeMinutes: number;
  paymentMethods: StoreSettingsPaymentMethods;
  createdAt: string;
  updatedAt: string;
};

export type StoreSettingsCreateRequest = {
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  address: StoreSettingsAddress;
  openingHours: StoreSettingsOpeningHours;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  dineInEnabled: boolean;
  minimumOrder: number;
  deliveryFee: number;
  averagePrepTimeMinutes: number;
  paymentMethods: StoreSettingsPaymentMethods;
};

export type StoreSettingsUpdateRequest = Partial<StoreSettingsCreateRequest>;

export type StoreSettingsServiceContract = {
  getByTenantId(tenantId: string): Promise<StoreSettingsDTO | null>;
  create(tenantId: string, input: StoreSettingsCreateRequest): Promise<StoreSettingsDTO>;
  update(tenantId: string, input: StoreSettingsUpdateRequest): Promise<StoreSettingsDTO | null>;
  isComplete(tenantId: string): Promise<boolean>;
};
