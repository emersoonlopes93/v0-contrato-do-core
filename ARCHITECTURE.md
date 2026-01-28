# Arquitetura do Core - SaaS Multi-Tenant

## Visão Geral

A arquitetura segue estritamente o **Contrato do Core**. O sistema é organizado em três camadas independentes:

1. **Core** - Infraestrutura neutra e imutável
2. **SaaS Admin** - Gerenciamento da plataforma (separado)
3. **Módulos** - Funcionalidades plugáveis

---

## 📁 Estrutura de Pastas

```
src/
├── core/                                 # Core neutro (imutável)
│   ├── types/                           # Tipos e contratos fundamentais
│   │   └── index.ts                    # UUIDs, Tokens, Entities, Config
│   │
│   ├── auth/                            # Sistema de autenticação
│   │   └── contracts.ts                # Interfaces: AuthService, AuthGuard, AuthRepository
│   │
│   ├── tenant/                          # Gerenciamento de tenants
│   │   └── contracts.ts                # Interfaces: TenantService, TenantUserService
│   │
│   ├── modules/                         # Sistema de módulos
│   │   ├── contracts.ts                # Interfaces: Module, ModuleRegistry
│   │   └── registry.ts                 # Implementação in-memory do registry
│   │
│   ├── rbac/                            # Role-Based Access Control
│   │   └── contracts.ts                # Interfaces: RBACService
│   │
│   ├── plan/                            # Planos e limites
│   │   └── contracts.ts                # Interfaces: PlanService
│   │
│   ├── events/                          # Sistema de eventos e auditoria
│   │   ├── contracts.ts                # Interfaces: EventBus, AuditLogger
│   │   └── event-bus.ts                # Implementação in-memory
│   │
│   ├── whitebrand/                      # White-label
│   │   └── contracts.ts                # Interfaces: WhiteBrandService
│   │
│   └── db/                              # Database layer
│       └── database.ts                 # Client Supabase e schemas
│
├── saas-admin/                           # SaaS Admin Context
│   ├── pages/                           # Páginas admin (tenant management, etc)
│   ├── components/                      # Componentes admin
│   └── services/                        # Serviços SaaS admin
│
├── tenant/                               # Tenant User Context
│   ├── pages/                           # Páginas tenant
│   ├── components/                      # Componentes tenant
│   └── services/                        # Serviços tenant
│
├── modules/                              # Módulos plugáveis
│   └── [module-name]/                   # Exemplo: delivery, payments
│       ├── types/                       # Tipos específicos do módulo
│       ├── routes/                      # Rotas/handlers do módulo
│       ├── permissions/                 # Permissões do módulo
│       ├── events/                      # Eventos emitidos pelo módulo
│       └── index.ts                     # Registro e exportação
│
└── shared/                               # Utilitários compartilhados
    ├── components/                      # Componentes UI reutilizáveis
    ├── hooks/                           # React hooks
    └── utils/                           # Funções utilitárias
```

---

## 🏛️ Core - Regras Obrigatórias

### ✅ O que o Core PODE fazer

- Gerenciar **autenticação e autorização** (separada para Admin e Tenant)
- Gerenciar **tenants e usuários** (com isolamento completo)
- Fornecer **sistema de módulos** plugável
- Gerenciar **planos e permissões**
- Emitir **eventos de auditoria**
- Fornecer **white-label** para cada tenant
- Expor **abstrações (interfaces)** para ser implementado

### ❌ O que o Core NÃO PODE fazer

- ❌ Conhecer regras de delivery
- ❌ Conhecer conceitos de pedidos, motoboys, etc
- ❌ Conter lógica de negócio específica
- ❌ Acessar banco de dados de módulos
- ❌ Ter dependências de módulos

---

## 🔐 Autenticação - Separação Absoluta

### SaaS Admin Token

```typescript
{
  context: UserContext.SAAS_ADMIN,
  userId: "uuid",
  role: "admin" | "moderator"
}
```

**Acesso:**
- Gerenciar tenants
- Gerenciar planos
- Gerenciar módulos globais
- Ver relatórios da plataforma

### Tenant User Token

```typescript
{
  context: UserContext.TENANT_USER,
  userId: "uuid",
  tenantId: "uuid",
  role: "string",
  permissions: ["permission.id"],
  activeModules: ["module.id"]
}
```

**Acesso:**
- Dados do próprio tenant (tenant_id obrigatório)
- Apenas módulos ativos para o tenant
- Apenas permissões atribuídas

---

## 📦 Sistema de Módulos

### Registro de Módulo

Um módulo se registra no Core fornecendo:

```typescript
{
  id: "module.id",
  name: "Module Name",
  version: "1.0.0",
  permissions: [
    { id: "module.read", name: "Read", description: "..." },
    { id: "module.write", name: "Write", description: "..." }
  ],
  eventTypes: [
    { id: "module.event", name: "Event Name", description: "..." }
  ],
  requiredPlan: "premium" // opcional
}
```

### Ciclo de Vida de um Módulo

```
1. Módulo registra no Core
2. SaaS Admin ativa módulo para um tenant (se no plano)
3. Core adiciona módulo ao token do tenant
4. Tenant user pode acessar funcionalidades do módulo
5. Módulo emite eventos via Core EventBus
6. Módulo pode ser desativado
```

### Isolamento entre Módulos

- Módulos **não compartilham banco de dados**
- Módulos **não acessam dados um do outro**
- Comunicação **apenas via eventos do Core**
- Cada módulo tem seu próprio schema no banco

---

## 🔑 RBAC - Role-Based Access Control

### Fluxo

```
User → Tenant → Roles → Permissions
```

### Estrutura

- **Role** pertence a um tenant
- **Permissão** é registrada por um módulo
- **User** recebe role + permissions do Core

### Verificação

```typescript
// Guard verifica: user → tenant → roles → permissions
const canAccess = await guard.requirePermission(token, "module.write");
```

---

## 🎯 Multi-Tenancy - Regra de Ouro

> **Toda tabela operacional DEVE ter tenant_id**

### Exceções (dados globais)

- `saas_admin_users` - SaaS Admin users
- `plans` - Planos globais
- `modules` - Definições de módulos
- `audit_events` - Pode ter `tenant_id` NULL se ação SaaS Admin

### Isolamento

```sql
-- Exemplo: SaaS Admin vê todos os tenants
SELECT * FROM tenants;

-- Exemplo: Tenant user vê APENAS seu tenant
SELECT * FROM tenants WHERE id = current_tenant_id;
```

---

## 🎨 White-Label

### Global (SaaS)

```typescript
{
  systemName: "My SaaS",
  supportEmail: "support@saas.com",
  primaryColor: "#1a1a1a",
  secondaryColor: "#ffffff"
}
```

### Por Tenant

```typescript
{
  tenantId: "uuid",
  logo: "https://...",
  primaryColor: "#custom",
  secondaryColor: "#custom",
  domain: "custom.domain.com"
}
```

---

## 📊 Eventos e Auditoria

### Eventos Críticos do Core

```typescript
enum CoreEvents {
  TENANT_CREATED = "core.tenant.created",
  TENANT_USER_CREATED = "core.tenant_user.created",
  PLAN_CHANGED = "core.plan.changed",
  MODULE_ACTIVATED = "core.module.activated",
  PERMISSION_GRANTED = "core.permission.granted",
  SAAS_ADMIN_LOGIN = "core.saas_admin.login",
  TENANT_USER_LOGIN = "core.tenant_user.login"
}
```

### Audit Log

Cada ação cria evento:
- Action (login, change, activate)
- Resource (tenant, user, module)
- Old/New values
- Status (success/failure)
- Timestamp

---

## 🔗 Boundaries - O que cada camada pode fazer

### Core

| Ação | Pode? | Por quê? |
|------|-------|---------|
| Gerenciar auth | ✅ | É infraestrutura neutra |
| Gerenciar tenants | ✅ | É responsabilidade central |
| Emitir eventos | ✅ | Outros precisam saber |
| Acessar módulos | ❌ | Módulos são independentes |
| Conhecer delivery | ❌ | Regra de negócio |

### SaaS Admin

| Ação | Pode? | Por quê? |
|------|-------|---------|
| Criar tenants | ✅ | É função SaaS Admin |
| Ativar módulos | ✅ | Controla disponibilidade |
| Ver tenant data | ❌ | Violaria isolamento |
| Acessar módulos do tenant | ❌ | Dados operacionais |

### Módulos

| Ação | Pode? | Por quê? |
|------|-------|---------|
| Registrar permissões | ✅ | Define suas permissões |
| Emitir eventos | ✅ | Comunica com sistema |
| Acessar outro módulo | ❌ | Devem ser isolados |
| Acessar Core database | ❌ | Devem ter schema próprio |

### Tenant Users

| Ação | Pode? | Por quê? |
|------|-------|---------|
| Acessar dados do tenant | ✅ | Pertencem ao tenant |
| Trocar de tenant | ❌ | Violaria isolamento |
| Ver dados de outro tenant | ❌ | Violaria isolamento |

---

## 🧪 Verificação de Compliance

Antes de adicionar código, verificar:

1. ✅ Toda tabela operacional tem `tenant_id`?
2. ✅ Auth está separada (Admin vs Tenant)?
3. ✅ Módulo não acessa banco de outro módulo?
4. ✅ Não há hardcoded de regras de negócio?
5. ✅ Eventos são emitidos para auditoria?
6. ✅ RBAC é verificado em toda ação sensível?
7. ✅ White-label é configurável, não hardcoded?

---

## 📝 Próximos Passos

1. Implementar migrações Supabase (schema Core)
2. Implementar repositórios (Core services)
3. Implementar React context para Auth e Tenant
4. Criar exemplo de módulo plugável
5. Implementar validação de boundaries
