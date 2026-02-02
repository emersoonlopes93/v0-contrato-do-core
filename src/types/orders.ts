export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};

export type OrdersOrderItemModifierDTO = {
  id: string;
  name: string;
  priceDelta: number;
};

export type OrdersOrderItemDTO = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  modifiers: OrdersOrderItemModifierDTO[];
};

export type OrdersOrderTimelineEventDTO = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  userId: string | null;
  timestamp: string;
};

export type OrdersOrderDTO = {
  id: string;
  orderNumber: number;
  source: string;
  status: string;
  total: number;
  paymentMethod: string | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryType: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrdersOrderItemDTO[];
  timelineEvents: OrdersOrderTimelineEventDTO[];
};

export type OrdersOrderSummaryDTO = {
  id: string;
  orderNumber: number;
  source: string;
  status: string;
  total: number;
  itemsCount: number;
  createdAt: string;
};

export type OrdersCreateOrderItemModifierInput = {
  name: string;
  priceDelta?: number;
};

export type OrdersCreateOrderItemInput = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
  modifiers?: OrdersCreateOrderItemModifierInput[];
};

export type OrdersCreateOrderRequest = {
  source?: string;
  status?: string;
  total: number;
  paymentMethod?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryType?: string | null;
  items: OrdersCreateOrderItemInput[];
};

export type OrdersServiceContract = {
  createOrder(request: {
    tenantId: string;
    userId: string | null;
    input: OrdersCreateOrderRequest;
  }): Promise<OrdersOrderDTO>;
  listOrdersByTenant(tenantId: string): Promise<OrdersOrderSummaryDTO[]>;
  getOrderById(tenantId: string, orderId: string): Promise<OrdersOrderDTO | null>;
};
