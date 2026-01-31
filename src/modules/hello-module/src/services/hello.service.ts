import type { ModuleContext } from '../../../../core/modules/contracts';
import type { EventBus, DomainEvent } from '../../../../core/events/contracts';
import type { TenantId, UserId } from '../../../../core/types';
import { HelloRepository } from '../repositories/hello.repository';
import { EVENTS } from '../events';
import type { HelloCreatedPayload, HelloGreetedPayload } from '../events';

export interface CreateHelloRequest {
  tenantId: string;
  userId: string;
  message: string;
}

export interface GreetRequest {
  tenantId: string;
  userId: string;
  name: string;
}

export class HelloService {
  private repository: HelloRepository;
  private eventBus: EventBus;

  constructor(context: ModuleContext) {
    this.repository = new HelloRepository(context.database);
    this.eventBus = context.eventBus;
  }

  async createHello(request: CreateHelloRequest): Promise<void> {
    const { tenantId, userId, message } = request;

    // Business logic
    await this.repository.saveHello({
      tenantId,
      userId,
      message,
      createdAt: new Date(),
    });

    const payload: HelloCreatedPayload = {
      tenantId,
      userId,
      message,
      timestamp: new Date(),
    };

    const event: DomainEvent = {
      id: `hello.created:${Date.now()}`,
      type: EVENTS.HELLO_CREATED,
      tenantId: tenantId as TenantId,
      userId: userId as UserId,
      timestamp: payload.timestamp,
      data: payload as unknown as Record<string, unknown>,
    };

    await this.eventBus.publish(event);
  }

  async greet(request: GreetRequest): Promise<string> {
    const { tenantId, userId, name } = request;

    const greeting = `Hello, ${name}! Welcome to the module system.`;

    const payload: HelloGreetedPayload = {
      tenantId,
      userId,
      greeting,
      timestamp: new Date(),
    };

    const event: DomainEvent = {
      id: `hello.greeted:${Date.now()}`,
      type: EVENTS.HELLO_GREETED,
      tenantId: tenantId as TenantId,
      userId: userId as UserId,
      timestamp: payload.timestamp,
      data: payload as unknown as Record<string, unknown>,
    };

    await this.eventBus.publish(event);

    return greeting;
  }

  async getHellosByTenant(tenantId: string): Promise<unknown[]> {
    return this.repository.findByTenant(tenantId);
  }
}
