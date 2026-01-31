import type { EventBus, DomainEvent, EventHandler } from '../../../../core/events/contracts';
import type { HelloCreatedPayload, HelloGreetedPayload } from '../events';
import { EVENTS } from '../events';

/**
 * Hello Listener
 * 
 * Reage aos eventos do próprio módulo
 * NÃO faz chamadas diretas a outros módulos
 */
export class HelloListener {
  constructor(private eventBus: EventBus) {}

  register(): void {
    const createdHandler: EventHandler = {
      async handle(event: DomainEvent): Promise<void> {
        const payload = event.data as unknown as HelloCreatedPayload;
        console.log('[HelloModule] Event received: hello.created', {
          tenantId: payload.tenantId,
          userId: payload.userId,
          message: payload.message,
        });
      },
    };

    const greetedHandler: EventHandler = {
      async handle(event: DomainEvent): Promise<void> {
        const payload = event.data as unknown as HelloGreetedPayload;
        console.log('[HelloModule] Event received: hello.greeted', {
          tenantId: payload.tenantId,
          userId: payload.userId,
          greeting: payload.greeting,
        });
      },
    };

    this.eventBus.subscribe(EVENTS.HELLO_CREATED, createdHandler);
    this.eventBus.subscribe(EVENTS.HELLO_GREETED, greetedHandler);
  }
}
