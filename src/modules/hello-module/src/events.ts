/**
 * Hello Module Events
 * 
 * Definição centralizada de eventos emitidos pelo módulo
 */

export const EVENTS = {
  HELLO_CREATED: 'hello.created',
  HELLO_GREETED: 'hello.greeted',
} as const;

export type HelloEvent = (typeof EVENTS)[keyof typeof EVENTS];

// Event Payloads
export interface HelloCreatedPayload {
  tenantId: string;
  userId: string;
  message: string;
  timestamp: Date;
}

export interface HelloGreetedPayload {
  tenantId: string;
  userId: string;
  greeting: string;
  timestamp: Date;
}
