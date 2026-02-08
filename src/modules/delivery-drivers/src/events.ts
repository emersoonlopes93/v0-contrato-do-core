export const DELIVERY_DRIVERS_EVENTS = {
  DRIVER_CREATED: 'delivery-drivers.driver.created',
  DRIVER_STATUS_UPDATED: 'delivery-drivers.driver.status.updated',
  DRIVER_ASSIGNED: 'delivery-drivers.driver.assigned',
} as const;

export type DeliveryDriversEvent =
  (typeof DELIVERY_DRIVERS_EVENTS)[keyof typeof DELIVERY_DRIVERS_EVENTS];
