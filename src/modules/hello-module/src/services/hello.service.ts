import type { ModuleContext } from '../../../../core/modules/contracts';
import type { IEventBus } from '../../../../core/events/contracts';
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
  private eventBus: IEventBus;

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

    // Emit event
    const payload: HelloCreatedPayload = {
      tenantId,
      userId,
      message,
      timestamp: new Date(),
    };

    await this.eventBus.emit(EVENTS.HELLO_CREATED, payload);
  }

  async greet(request: GreetRequest): Promise<string> {
    const { tenantId, userId, name } = request;

    const greeting = `Hello, ${name}! Welcome to the module system.`;

    // Emit event
    const payload: HelloGreetedPayload = {
      tenantId,
      userId,
      greeting,
      timestamp: new Date(),
    };

    await this.eventBus.emit(EVENTS.HELLO_GREETED, payload);

    return greeting;
  }

  async getHellosByTenant(tenantId: string): Promise<unknown[]> {
    return this.repository.findByTenant(tenantId);
  }
}
