import type { BillingRepository, BillingService, Invoice, TenantSubscription } from "./contracts";
import type { TenantId } from "../types/index";

export class MemoryBillingRepository implements BillingRepository {
  private subscriptions: Map<TenantId, TenantSubscription> = new Map();
  private invoices: Map<TenantId, Invoice[]> = new Map();

  async getTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null> {
    return this.subscriptions.get(tenantId) || null;
  }

  async saveTenantSubscription(subscription: TenantSubscription): Promise<void> {
    this.subscriptions.set(subscription.tenantId, subscription);
  }

  async listTenantInvoices(tenantId: TenantId): Promise<Invoice[]> {
    return this.invoices.get(tenantId) || [];
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    const tenantInvoices = this.invoices.get(invoice.tenantId) || [];
    const existingIndex = tenantInvoices.findIndex((i) => i.id === invoice.id);

    if (existingIndex >= 0) {
      tenantInvoices[existingIndex] = invoice;
    } else {
      tenantInvoices.push(invoice);
    }

    this.invoices.set(invoice.tenantId, tenantInvoices);
  }
}

export class CoreBillingService implements BillingService {
  constructor(private repository: BillingRepository) {}

  async getTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null> {
    return this.repository.getTenantSubscription(tenantId);
  }

  async syncTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null> {
    return this.repository.getTenantSubscription(tenantId);
  }

  async listTenantInvoices(tenantId: TenantId): Promise<Invoice[]> {
    return this.repository.listTenantInvoices(tenantId);
  }
}

