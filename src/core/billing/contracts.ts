import type { TenantId } from "../types/index";

export type BillingProviderId = string;

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "void"
  | "uncollectible";

export interface TenantSubscription {
  id: string;
  tenantId: TenantId;
  planId: string;
  providerId: BillingProviderId;
  externalCustomerId: string;
  externalSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  tenantId: TenantId;
  subscriptionId: string;
  providerId: BillingProviderId;
  externalInvoiceId: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingRepository {
  getTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null>;
  saveTenantSubscription(subscription: TenantSubscription): Promise<void>;
  listTenantInvoices(tenantId: TenantId): Promise<Invoice[]>;
  saveInvoice(invoice: Invoice): Promise<void>;
}

export interface BillingService {
  getTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null>;
  syncTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null>;
  listTenantInvoices(tenantId: TenantId): Promise<Invoice[]>;
}

