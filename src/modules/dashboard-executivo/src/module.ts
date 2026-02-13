import type { ModuleContext } from '@/src/core/modules/contracts';

export function register(context: ModuleContext): void {
  void context;
  // Se futuramente precisarmos registrar serviços no container global para outros módulos usarem:
  // context.registerService(manifest.id, 'DashboardService', new DashboardService(...));
  // Por enquanto, o controller instancia o serviço diretamente ou via injeção local.
  console.log('Dashboard Executivo module registered');
}
