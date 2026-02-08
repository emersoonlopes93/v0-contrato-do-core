export type PrintJobType = 'kitchen' | 'cashier';

export type PrintOrderItemSnapshot = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  modifiers: Array<{
    name: string;
    optionName: string | null;
    priceDelta: number;
  }>;
};

export type PrintOrderSnapshot = {
  orderId: string;
  orderNumber: number;
  status: string;
  total: number;
  createdAt: string;
  items: PrintOrderItemSnapshot[];
};

export type PrintJobPayload = {
  order: PrintOrderSnapshot;
  source: string | null;
};

export type PrintJob = {
  id: string;
  tenantId: string;
  type: PrintJobType;
  payload: PrintJobPayload;
  status: 'queued';
  createdAt: string;
};

export type PrintingServiceContract = {
  queueKitchenPrint(tenantId: string, payload: PrintJobPayload): Promise<PrintJob | null>;
  queueCashierReceipt(tenantId: string, payload: PrintJobPayload): Promise<PrintJob | null>;
  listJobs(tenantId: string, limit?: number): Promise<PrintJob[]>;
};
