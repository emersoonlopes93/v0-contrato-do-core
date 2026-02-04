export type WhiteLabelThemeMode = 'light' | 'dark';

export type WhiteLabelThemeTokens = {
  primaryForegroundColor?: string;
  successColor?: string;
  dangerColor?: string;
};

export type WhiteLabelConfigDTO = {
  tenantId: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor?: string;
  theme?: WhiteLabelThemeMode;
  customMetadata?: Record<string, unknown>;
};

export type WhiteLabelAdminFormState = {
  tenantId: string;
  logo?: string;
  primaryColor: string;
  primaryForegroundColor: string;
  secondaryColor: string;
  backgroundColor?: string;
  successColor: string;
  dangerColor: string;
  theme?: WhiteLabelThemeMode;
};

export type WhiteLabelUpdateRequest = {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  logo?: string | null;
  theme?: WhiteLabelThemeMode | null;
  primaryForegroundColor?: string;
  successColor?: string;
  dangerColor?: string;
};

export type SaaSAdminTenantSummaryDTO = {
  id: string;
  name: string;
  slug: string;
  status: string;
};
