import type { ModuleContext } from '@/src/core/modules/contracts';
import type { PrintJob, PrintJobPayload, PrintJobType, PrintingServiceContract } from '@/src/types/printing';
import { TenantSettingsRepository } from './tenant-settings.repository';

function createJobId(type: PrintJobType, tenantId: string): string {
  return `${type}:${tenantId}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

export class PrintingService implements PrintingServiceContract {
  private readonly repository: TenantSettingsRepository;
  private readonly queue: PrintJob[] = [];

  constructor(context: ModuleContext) {
    void context;
    this.repository = new TenantSettingsRepository();
  }

  async queueKitchenPrint(tenantId: string, payload: PrintJobPayload): Promise<PrintJob | null> {
    return this.queueJob(tenantId, 'kitchen', payload);
  }

  async queueCashierReceipt(tenantId: string, payload: PrintJobPayload): Promise<PrintJob | null> {
    return this.queueJob(tenantId, 'cashier', payload);
  }

  async listJobs(tenantId: string, limit = 100): Promise<PrintJob[]> {
    return this.queue.filter((job) => job.tenantId === tenantId).slice(0, limit);
  }

  private async queueJob(
    tenantId: string,
    type: PrintJobType,
    payload: PrintJobPayload,
  ): Promise<PrintJob | null> {
    const enabled = await this.isPrintingEnabled(tenantId);
    if (!enabled) return null;
    const job: PrintJob = {
      id: createJobId(type, tenantId),
      tenantId,
      type,
      payload,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    this.queue.unshift(job);
    return job;
  }

  private async isPrintingEnabled(tenantId: string): Promise<boolean> {
    const row = await this.repository.findByTenantId(tenantId);
    return row?.printing_enabled ?? false;
  }
}
