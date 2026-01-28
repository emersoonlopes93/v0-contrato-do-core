import type { ModuleContext } from '../../../core/modules/contracts';
import { HelloService } from './services/hello.service';
import { HelloListener } from './listeners/hello.listener';

/**
 * Hello Module Bootstrap
 * 
 * REGRAS:
 * - Recebe apenas ModuleContext
 * - Registra listeners e services
 * - NÃO contém lógica de negócio
 * - NÃO faz chamadas diretas a outros módulos
 */
export async function register(context: ModuleContext): Promise<void> {
  console.log('[HelloModule] Registering module...');

  // 1. Instanciar serviços
  const helloService = new HelloService(context);

  // 2. Registrar no ModuleServiceRegistry (se necessário)
  context.registerService('hello-module', 'HelloService', helloService);

  // 3. Registrar listeners
  const helloListener = new HelloListener(context.eventBus);
  helloListener.register();

  console.log('[HelloModule] Module registered successfully');
}
