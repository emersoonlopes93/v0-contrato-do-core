export const DELIVERY_ROUTES_EVENTS = {
  ROUTE_CREATED: 'delivery-routes.route.created',
  ROUTE_OPTIMIZED: 'delivery-routes.route.optimized',
  ROUTE_ASSIGNED: 'delivery-routes.route.assigned',
} as const;

export type DeliveryRoutesEvent =
  (typeof DELIVERY_ROUTES_EVENTS)[keyof typeof DELIVERY_ROUTES_EVENTS];
