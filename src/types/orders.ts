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
  optionName?: string | null;
};

export type OrdersCreateOrderItemInput = {
  productId?: string | null;
  name: string;
  basePrice?: number;
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

export type OrdersUpdateStatusRequest = {
  status: string;
};

export type OrdersCancelOrderRequest = {
  reason?: string | null;
};

export type OrdersKanbanColumnKey =
  | 'created'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type OrdersKanbanColumnDTO = {
  key: OrdersKanbanColumnKey;
  title: string;
  orders: OrdersOrderSummaryDTO[];
};

export type OrdersKanbanDTO = {
  columns: OrdersKanbanColumnDTO[];
};

export const ORDERS_OPERATIONAL_STATUS = {
  NEW: 'created',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  DISPATCHED: 'delivering',
  COMPLETED: 'completed',
  CANCELED: 'cancelled',
} as const;

export type OrdersOperationalStatusKey = keyof typeof ORDERS_OPERATIONAL_STATUS;

export type OrdersOperationalStatus = (typeof ORDERS_OPERATIONAL_STATUS)[OrdersOperationalStatusKey];

export const ORDERS_STATUS_LABELS: Record<string, string> = {
  created: 'Novo',
  accepted: 'Aceito',
  preparing: 'Em preparo',
  ready: 'Pronto',
  delivering: 'Despachado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  pending: 'Pendente',
  confirmed: 'Confirmado',
  pending_payment: 'Aguardando Pgto',
  delivered: 'Entregue',
  expired: 'Expirado',
};

export type OrdersServiceContract = {
  createOrder(request: {
    tenantId: string;
    userId: string | null;
    input: OrdersCreateOrderRequest;
  }): Promise<OrdersOrderDTO>;
  listOrdersByTenant(tenantId: string): Promise<OrdersOrderSummaryDTO[]>;
  getOrderById(tenantId: string, orderId: string): Promise<OrdersOrderDTO | null>;
  updateOrderStatus(request: {
    tenantId: string;
    orderId: string;
    userId: string | null;
    status: string;
  }): Promise<OrdersOrderDTO>;
  getKanbanByTenant(tenantId: string): Promise<OrdersKanbanDTO>;
};
