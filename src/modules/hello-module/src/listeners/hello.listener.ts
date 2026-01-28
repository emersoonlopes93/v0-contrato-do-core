import type { IEventBus } from '../../../../core/events/contracts';
import type { HelloCreatedPayload, HelloGreetedPayload } from '../events';
import { EVENTS } from '../events';

/**
 * Hello Listener
 * 
 * Reage aos eventos do próprio módulo
 * NÃO faz chamadas diretas a outros módulos
 */
export class HelloListener {
  constructor(private eventBus: IEventBus) {}

  register(): void {
    // Listen to hello.created
    this.eventBus.on(EVENTS.HELLO_CREATED, async (payload: HelloCreatedPayload) => {
      console.log('[HelloModule] Event received: hello.created', {
        tenantId: payload.tenantId,
        userId: payload.userId,
        message: payload.message,
      });

      // Aqui você poderia emitir outro evento ou fazer logging adicional
    });

    // Listen to hello.greeted
    this.eventBus.on(EVENTS.HELLO_GREETED, async (payload: HelloGreetedPayload) => {
      console.log('[HelloModule] Event received: hello.greeted', {
        tenantId: payload.tenantId,
        userId: payload.userId,
        greeting: payload.greeting,
      });
    });
  }
}
