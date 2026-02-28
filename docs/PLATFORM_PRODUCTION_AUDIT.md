# PLATFORM PRODUCTION AUDIT

Data: 2026-02-13  
Modo: leitura

---

# ETAPA 1 — INTEGRIDADE MULTI-TENANT

Classificação: RISK

Evidências: 
- Contexto de tenant aplicado em middleware de autenticação e módulo/permissão, envolvendo AsyncLocalStorage.
- PrismaClient padrão é estendido com proxy de tenant_id.
- Validação de tenant no namespace de socket.
- APIs públicas usam tenantSlug/token para escopo.

Riscos:
- Existe PrismaAdapterFactory criando PrismaClient sem proxy de tenant.
- Há uso de filtros manuais de tenant_id em rotas públicas, pois não há contexto de tenant nesse fluxo.

Referências:
- src/api/v1/middleware.ts
- src/adapters/prisma/client.ts
- src/adapters/prisma/prisma-tenant-proxy.ts
- src/realtime/socketio.server.ts
- src/api/v1/tenant/menu-online.routes.ts
- src/modules/client-tracking/src/client-tracking.routes.ts

---

# ETAPA 2 — CONSISTÊNCIA DE EVENTOS

Classificação: RISK

Evidências:
- Todo publish tenta persistir em event_store.
- Dispatcher marca processing/processed/failed e aplica retry com backoff.
- event_consumer impede duplicação por consumidor.

Riscos:
- Fila fallback é em memória; crash antes de persistir perde eventos.
- Eventos em status "processing" não são reprocessados em restart.
- Concorrência entre nós pode processar o mesmo evento antes de registrar consumo.

Simulação (criar pedido → crash → voltar → finalizar entrega):
- Se o append no event_store ocorreu antes do crash, o dispatcher retoma e finaliza.
- Se o append falhar e cair na fila em memória, o evento se perde no crash.

Referências:
- src/core/events/reliable-event-bus.ts
- src/core/events/event-dispatcher.ts
- src/core/events/event-store.repository.ts

---

# ETAPA 3 — CONTRATOS ENTRE MÓDULOS

Violação encontrada:
- delivery-pricing → orders-module (service direto via registry).
- delivery-driver-app → delivery-routes e delivery-drivers (services diretos).
- delivery-tracking → delivery-routes e delivery-drivers (services diretos).

Referências:
- src/modules/delivery-pricing/src/services/deliveryPricingService.ts
- src/modules/delivery-driver-app/src/services/deliveryDriverAppService.ts
- src/modules/delivery-tracking/src/repositories/deliveryTrackingRepository.ts

---

# ETAPA 4 — SEGURANÇA

Classificação: SAFE

Evidências:
- JWT_SECRET validado no boot em produção.
- Tokens com expiração e validação por audience/issuer.
- Refresh token validado por tipo e persistência.
- Tenant mismatch bloqueado por guard.
- Rotas admin protegidas por middleware de SaaS Admin.

Referências:
- src/server.ts
- src/core/auth/jwt.ts
- src/core/auth/guards.ts
- src/api/v1/index.ts

---

# ETAPA 5 — PERSISTÊNCIA OPERACIONAL

Classificação: RISK

Evidências:
- Pedidos, rotas, motoristas e eventos persistidos em banco.
- Tracking deriva de dados persistidos.

Riscos:
- Repositórios de rotas/motoristas usam fallback em localStorage.
- Fila de eventos em memória em caso de falha de persistência.
- Planos e billing usam memória no SaaS Admin.

Referências:
- src/modules/orders-module/src/repositories/order.repository.ts
- src/modules/delivery-routes/src/repositories/deliveryRoutesDbRepository.ts
- src/modules/delivery-drivers/src/repositories/deliveryDriversDbRepository.ts
- src/core/events/event-store.repository.ts
- src/modules/delivery-routes/src/repositories/deliveryRoutesRepository.ts
- src/modules/delivery-drivers/src/repositories/deliveryDriversRepository.ts
- src/core/plan/memory-plan.repository.ts
- src/core/billing/memory-billing.service.ts

---

# ETAPA 6 — ESCALABILIDADE HORIZONTAL

Classificação: RISK

Evidências:
- Idempotência por consumidor no event_consumer.

Riscos:
- getPendingBatch não bloqueia eventos por nó.
- status "processing" não é retomado no restart.
- Possível duplicação de processamento entre nós antes do registro do consumo.

Referências:
- src/core/events/event-dispatcher.ts
- src/core/events/event-store.repository.ts

---

# ETAPA 7 — UX OPERACIONAL

Classificação: SAFE

Evidências:
- Pedidos e status atualizam via realtime no painel.
- Rotas, motoristas e tracking recarregam via eventos realtime.

Referências:
- src/tenant/pages/Orders.tsx
- src/modules/delivery-routes/src/hooks/useDeliveryRoutes.ts
- src/modules/delivery-drivers/src/hooks/useDeliveryDrivers.ts
- src/modules/delivery-tracking/src/hooks/useDeliveryTracking.ts

---

# ETAPA 8 — CLASSIFICAÇÃO FINAL

Platform Readiness Score: 78

Classificação: PILOTOS PAGOS

Top riscos restantes:
- Perda ou duplicação de eventos em falhas/crashes.
- Acoplamento direto entre módulos críticos.
- Fallback em memória/localStorage para dados operacionais.
- Possível bypass do proxy de tenant em adapters.

Impacto financeiro potencial:
- Alto: pedidos e entregas inconsistentes podem gerar perda de receita e reembolso.

Chance de suporte alto:
- Média-alta.

Conclusão executiva:  
Pode iniciar aquisição de clientes?  
Somente pilotos pagos e controlados.
