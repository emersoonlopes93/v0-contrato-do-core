# Auditoria Técnica — Arquitetura SaaS Multi‑Tenant

## ✔ Implementado

### Visão Geral / Core

- Contrato do Core e boundaries:
  - `ARCHITECTURE.md`
  - `docs/contrato_do_core_saas_delivery_multi_tenant.md`
  - `docs/historico.md`
- Multi‑tenant com `tenant_id` nas entidades principais:
  - `Tenant`, `TenantUser`, `TenantModule`, `TenantSubscription`, `Role`, `UserRole`,
    `WhiteBrandConfig`, `AuditEvent`, `RefreshToken` em `prisma/schema.prisma`.

### Autenticação

- Separação SaaS Admin x Tenant User:
  - Tipos de token em `src/core/types/index.ts`.
  - Contratos em `src/core/auth/contracts.ts`.
- SaaS Admin Auth:
  - Service: `src/core/auth/saas-admin/saas-admin-auth.service.ts`.
  - Controller: `src/api/v1/auth/saas-admin-auth.controller.ts`.
- Tenant Auth:
  - Service: `src/core/auth/tenant/tenant-auth.service.ts`.
  - Controller: `src/api/v1/auth/tenant-auth.controller.ts`.
- Sessão:
  - `src/api/v1/auth/session.controller.ts` hidrata sessão (admin/tenant).

### SaaS Admin

- App separado:
  - `src/saas-admin/SaaSAdminApp.tsx`.
  - Layout e guard: `AdminLayout.tsx`, `AdminSessionGuard.tsx`.
  - Login: `src/saas-admin/pages/Login.tsx`.
- Tenants:
  - Controller: `src/api/v1/saas-admin/tenants.controller.ts`
    (`listTenants`, `getTenant`, `onboardTenant`, `updateTenantModules`,
    `activateModule`, `deactivateModule`).
  - UI: `src/saas-admin/pages/Tenants.tsx`.
- Módulos:
  - Registry global: `src/core/modules/contracts.ts`, `src/core/modules/registry.ts`.
  - Controller: `src/api/v1/saas-admin/modules.controller.ts`.
  - UI com toggle por tenant: `src/saas-admin/pages/Modules.tsx`.
- Planos:
  - Modelos `Plan` e `TenantSubscription` em `prisma/schema.prisma`.
  - `CorePlanService` e `MemoryPlanRepository` em `src/core/plan`.
  - Controller: `src/api/v1/saas-admin/plans.controller.ts`.
  - UI: `src/saas-admin/pages/Plans.tsx`.
- White‑label:
  - Modelo `WhiteBrandConfig` em `schema.prisma`.
  - Controller SaaS Admin: `src/api/v1/saas-admin/white-label.controller.ts`.
  - ThemeContext no tenant: `src/tenant/context/ThemeContext.tsx`.

### Core / Módulos / RBAC / Eventos

- Tipos centrais: `TenantId`, `ModuleId`, `TenantUserToken`, `SaaSAdminToken`
  em `src/core/types/index.ts`.
- Contexto de tenant:
  - `src/core/context/tenant-context.ts`.
- Sistema de módulos plugáveis:
  - Contratos: `src/core/modules/contracts.ts`.
  - Registry: `src/core/modules/registry.ts`.
  - Módulo exemplo completo `hello-module` em `src/modules/hello-module`.
- Ativação de módulos por tenant:
  - Contrato `ITenantModuleService`: `src/core/modules/activation.contracts.ts`.
  - Implementação Prisma: `src/adapters/prisma/modules/tenant-module.service.ts`.
  - Documentação: `docs/module-activation.md`.
- RBAC:
  - Modelos `Permission`, `Role`, `RolePermission`, `UserRole` em `schema.prisma`.
  - Contratos: `src/core/rbac/contracts.ts`.
  - AuthRepository com `getTenantUserPermissions` etc:
    `src/adapters/prisma/repositories/auth-repository.ts`.
  - Middleware de API: `src/api/rbac-middleware.ts`.
- Eventos & auditoria (infra):
  - Contratos: `src/core/events/contracts.ts`.
  - EventBus/AuditLogger in-memory: `src/core/events/event-bus.ts`.
  - Tabela `AuditEvent` em `schema.prisma`.

### Tenant App / Guards / Session

- App tenant separado:
  - `src/tenant/TenantApp.tsx`.
- Sessão:
  - `src/tenant/context/SessionContext.tsx` (token, `activeModules`, `permissions`).
- Guards frontend:
  - `TenantAuthGuard.tsx`, `ModuleGuard.tsx`, `PlanGuard.tsx`.
- HelloModule para tenant:
  - `src/tenant/pages/HelloModule.tsx`.

### Testes

- `src/api/tests/rbac-middleware.test.ts`.
- `src/test/integration/onboarding-e2e.test.ts`.

---

## ⚠️ Parcialmente implementado

### SaaS Admin (escopo esperado)

- Tenants:
  - Já possui listagem, detalhes, onboarding e configuração de módulos.
  - Falta: bloqueio/suspensão avançados, filtros, métricas globais, impersonation,
    domínios.
- Módulos:
  - Registry + UI com toggle por tenant prontos.
  - Catálogo real de módulos ainda mínimo (`hello-module` apenas).
- Planos / Billing:
  - Planos e subscriptions modelados, serviço core e UI básica prontos.
  - Falta engine de cobrança real e ligação de limites com métricas de uso.
111→- White‑label:
112→  - Modelo e APIs SaaS Admin implementados.
113→  - Tenant UI consome white-label do backend via ThemeContext.
115→- Audit Logs:
116→  - Tabela `audit_events` pronta.
117→  - Serviço `PrismaAuditLogger` consolidado (`src/adapters/prisma/audit-logger.ts`).
118→  - Endpoint `/api/v1/admin/audit` lê `audit_events` com filtros.

### Core

- Autenticação:
  - Login/refresh/logout implementados em nível de serviço.
  - SessionController resolve contexto.
  - Falta exposição/uso completo de refresh tokens via API HTTP em fluxo real.
- RBAC:
  - Roles/permissões e carregamento de permissões funcionam.
  - Middleware existe, mas não é aplicado em todas rotas sensíveis.
- Módulos:
  - Registry, contratos e exemplo `hello-module` prontos.
  - Poucos módulos reais de negócio.
132→- White‑label:
133→  - Contratos, schema e APIs prontos.
134→  - Aplicação completa no frontend tenant via ThemeContext.
- Billing:
  - Planos, subscriptions, `limits` e PlanGuard existem.
  - Falta contagem real de uso e cobrança.
- Eventos & auditoria:
  - EventBus/AuditLogger in-memory + tabela `audit_events`.
  - Integração parcial (alguns pontos usam Prisma, outros não).

### Tenant UI

144→- TenantApp, SessionContext, ModuleGuard, PlanGuard e ThemeContext presentes.
145→- Somente exemplo mínimo (`HelloModule`) em produção.
146→- Falta dashboard real, telas de perfil, navegação entre múltiplos módulos e
147→  módulos de domínio consumindo white‑label por tenant.

---

## ❌ Não implementado (ou não encontrado)

- Sistema de Feature Flags dedicado:
  - Sem modelos ou serviços específicos de flags.
  - Apenas conceito em documentos.
- Billing completo:
  - Sem integração com gateway de pagamento, faturas ou histórico.
- Logs globais e métricas avançadas:
  - Apenas `console.*`; não há módulo de métricas/observabilidade.
- Impersonation / suporte (entrar como tenant):
  - Nenhum fluxo ou endpoint encontrado.
- Domínios por tenant:
  - Campo `domain` em `WhiteBrandConfig`, porém sem routing multi‑domínio aplicado.
- Módulos de domínio reais (delivery, pedidos, PDV etc):
  - Apenas `hello-module` implementado.

---

## Checklist Técnico Consolidado

- SaaS Admin
  - [~] Autenticação (fluxos básicos ok; falta gestão avançada e UI de usuários).
  - [~] Gestão de tenants (CRUD + onboarding + módulos; falta métricas e bloqueios).
  - [~] Gestão de módulos (registry + toggle; catálogo mínimo).
  - [~] Gestão de planos (estrutura + UI; sem cobrança real).
  - [~] White‑label global/tenant (modelo + API; aplicação parcial).
  - [~] Audit logs viewer (UI + endpoint mock; falta integração com `audit_events`).

- Core
  - [x] Multi‑tenant com `tenant_id` nas entidades principais.
  - [x] Autenticação separada (SaaS Admin vs Tenant).
  - [~] Autorização (RBAC presente, mas enforcement parcial).
  - [x] Sistema de módulos plugável + registry + exemplo.
  - [x] Ativação de módulos por tenant (service + schema + guards).
  - [~] White‑label (contratos, schema, API; consumo incompleto).
  - [~] Billing & planos (infra pronta; cobrança/uso real ausentes).
  - [ ] Feature flags dedicadas.
  - [~] Eventos & auditoria (infra pronta; integração parcial).

- Autenticação
  - [x] Fluxo separado por contexto.
  - [x] JWT com payload diferenciado.
  - [x] Tenant context por request.
  - [~] Refresh tokens usados parcialmente.

- Multi‑tenant
  - [x] `tenant_id` nas tabelas core.
  - [x] Queries de auth/módulos filtradas por tenant.
  - [~] Aplicação uniforme em todas rotas de negócio.

201→- White‑label
202→  - [x] Configuração global/por tenant modelada e exposta.
203→  - [x] Aplicação na UI do tenant via ThemeContext.

- Módulos
  - [x] Registry/contratos.
  - [x] TenantModuleService e guards.
  - [~] Conjunto de módulos reais.

- Billing
  - [~] Estrutura de planos/assinaturas/limites.
  - [~] Enforcement parcial via PlanGuard.
  - [ ] Cobrança real.

- Feature flags
  - [ ] Service/tabela/guardas de flags.
  - [~] Uso de planos/módulos como proxy de feature, mas não sistema formal.

219→- Auditoria
220→  - [x] Schema `audit_events` + serviço PrismaAuditLogger + UI lendo do banco.
221→  - [~] Uso consistente em todas ações críticas.

---

## Gaps Críticos

- Auditoria não consolidada:
  - Falta serviço único escrevendo em `audit_events` e leitura real no SaaS Admin.
- Feature flags ausentes:
  - Não há mecanismo formal para ativar/desativar funcionalidades por tenant/plano.
- White‑label incompleto:
  - Tenant UI ainda não consome e aplica white‑label do backend de forma plena.
- Billing apenas conceitual:
  - Sem engine de cobrança ou controle real de uso x limites.
- RBAC não aplicado de forma uniforme:
  - Algumas rotas não usam `requireModule`/`requirePermission`.
- Ausência de módulos de domínio reais:
  - Somente `hello-module`, sem valor de negócio concreto.

---

## Próximos Passos Técnicos

1. Consolidar auditoria:
   - Implementar serviço de auditoria que escreve sempre em `audit_events`.
   - Atualizar rotas críticas para usar esse serviço.
   - Ajustar `/api/v1/admin/audit` para ler do banco com filtros.
2. Completar white‑label end‑to‑end:
   - Expor endpoint seguro para tenant ler seu branding.
   - Integrar TenantApp/ThemeContext com essa API.
3. Fortalecer RBAC e module guards:
   - Garantir uso consistente de `requireModule`/`requirePermission` em rotas sensíveis.
   - Implementar serviço RBAC conforme contratos do Core.
4. Implementar sistema mínimo de feature flags:
   - Modelar flags, criar serviço e guardas básicos.
5. Evoluir billing:
   - Conectar `TenantSubscription` a limites e contadores de uso.
   - Definir mecanismo mínimo de cobrança ou bloqueio pós‑limite.
6. Criar pelo menos um módulo de domínio real:
   - Ex.: módulo de pedidos, seguindo padrão do `hello-module`.
   - Integrar com planos, RBAC, auditoria e módulo de UI do tenant.
