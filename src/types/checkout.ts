export type CheckoutPaymentMethod = 'cash' | 'pix' | 'card';

export type CheckoutCreateOrderItemModifierInput = {
  id: string;
  name: string;
  priceDelta: number;
  quantity?: number;
};

export type CheckoutCreateOrderItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variation?: {
    id: string;
    name: string;
    price: number;
  } | null;
  modifiers?: CheckoutCreateOrderItemModifierInput[];
};

export type CheckoutCreateOrderRequest = {
  items: CheckoutCreateOrderItemInput[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: CheckoutPaymentMethod;
  customer: {
    name: string;
    phone: string;
  };
};

export type CheckoutOrderStatus = 'pending' | 'confirmed' | 'cancelled';

export type CheckoutOrderItemDTO = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  snapshot: unknown;
};

export type CheckoutOrderDTO = {
  id: string;
  orderNumber: number;
  status: CheckoutOrderStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: CheckoutPaymentMethod;
  customer: {
    name: string;
    phone: string;
  };
  tenantTimezone: string;
  createdAt: string;
  updatedAt: string;
  items: CheckoutOrderItemDTO[];
};

export type CheckoutServiceContract = {
  createOrder(tenantId: string, input: CheckoutCreateOrderRequest): Promise<CheckoutOrderDTO>;
  getOrderById(tenantId: string, orderId: string): Promise<CheckoutOrderDTO | null>;
};
