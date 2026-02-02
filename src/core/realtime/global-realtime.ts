import type { RealtimeEmitter, RealtimeEventName } from './contracts';

class NoopRealtimeEmitter implements RealtimeEmitter {
  emitToTenant<TPayload extends Record<string, unknown>>(
    tenantId: string,
    event: RealtimeEventName,
    payload: TPayload,
    eventId?: string,
  ): void {
    void tenantId;
    void event;
    void payload;
    void eventId;
  }
}

let emitter: RealtimeEmitter = new NoopRealtimeEmitter();

export function setRealtimeEmitter(next: RealtimeEmitter): void {
  emitter = next;
}

export const globalRealtimeEmitter: RealtimeEmitter = {
  emitToTenant<TPayload extends Record<string, unknown>>(
    tenantId: string,
    event: RealtimeEventName,
    payload: TPayload,
    eventId?: string,
  ): void {
    emitter.emitToTenant(tenantId, event, payload, eventId);
  },
};
