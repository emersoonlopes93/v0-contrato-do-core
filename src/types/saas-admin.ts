export type SaaSAdminTenantStatus = 'active' | 'suspended' | 'pending' | 'deleted';

export type SaaSAdminTenantPlanDTO = {
  id: string;
  name: string;
};

export type SaaSAdminTenantDTO = {
  id: string;
  name: string;
  slug: string;
  status: SaaSAdminTenantStatus;
  created_at?: string;
  onboarded?: boolean;
  last_access_at?: string | null;
  plan?: SaaSAdminTenantPlanDTO | null;
};

export type SaaSAdminPlanDTO = {
  id: string;
  name: string;
  slug?: string;
};

export type SaaSAdminModulePermissionDTO = {
  id: string;
  name: string;
  description: string;
};

export type SaaSAdminModuleEventDTO = {
  id: string;
  name: string;
  description: string;
};

export type SaaSAdminModuleDTO = {
  id: string;
  name: string;
  version: string;
  description?: string;
  permissions?: SaaSAdminModulePermissionDTO[] | string[];
  eventTypes?: SaaSAdminModuleEventDTO[] | string[];
  requiredPlan?: string;
  slug: string;
  isActiveForTenant: boolean;
  type?: string;
  scope?: string;
  mobileFirst?: boolean;
  canDisable?: boolean;
  uiEntry?: {
    tenantBasePath: string;
    homeLabel: string;
    icon: string;
    category: string;
  };
};

export type SaaSAdminModuleCategory =
  | 'essential'
  | 'sales'
  | 'marketing'
  | 'operations'
  | 'automation'
  | 'integrations'
  | 'advanced';

export type SaaSAdminModuleStatus = 'active' | 'inactive' | 'premium' | 'beta';

export type SaaSAdminModuleViewDTO = {
  id: string;
  name: string;
  version: string;
  description?: string;
  category: SaaSAdminModuleCategory;
  status: SaaSAdminModuleStatus;
  permissions: SaaSAdminModulePermissionDTO[] | string[] | undefined;
  eventTypes: SaaSAdminModuleEventDTO[] | string[] | undefined;
  slug: string;
  isActiveForTenant: boolean;
  hasPreview?: boolean;
  price?: string;
  typeLabel: 'Core' | 'Feature' | 'Experimental';
  globalEnabled: boolean;
  dependencies: string[];
};

export type SaaSAdminAuditEventDTO = {
  id: string;
  userId: string;
  action: string;
  resource: string;
  status: string;
  timestamp: string;
  tenantId?: string | null;
};

export type SaaSAdminGlobalFlags = {
  checkoutEnabled: boolean;
  onboardingRequired: boolean;
  maintenanceMode: boolean;
};

export type SaaSAdminGlobalLimits = {
  maxUsersPerTenant: number | null;
  maxOrdersPerMonth: number | null;
  maxLocations: number | null;
};

export type SaaSAdminGlobalSettingsDTO = {
  defaultTheme: 'light' | 'dark';
  defaultModules: string[];
  flags: SaaSAdminGlobalFlags;
  limits: SaaSAdminGlobalLimits;
  applyToExisting: boolean;
};
