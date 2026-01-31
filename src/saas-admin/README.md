# 🏛️ SaaS Admin Context

Este contexto é responsável por **administração da plataforma inteira**. Está **completamente separado** de tenant users.

## 📋 Responsabilidades

- Criar e gerenciar tenants
- Atribuir planos a tenants
- Ativar/desativar módulos por tenant
- Gerenciar usuários SaaS Admin
- Ver logs de auditoria
- Configurar white-brand global

## 🚫 Proibições Absolutas

- ❌ Acessar dados operacionais de tenant
- ❌ Ver dados de pedidos, clientes, etc
- ❌ Modificar dados dentro de tenant
- ❌ Bypassar isolamento multi-tenant
- ❌ Executar ações de tenant user

## 🔐 Autenticação

SaaS Admin usa token diferente:

\`\`\`typescript
{
  context: UserContext.SAAS_ADMIN,
  userId: "uuid",
  role: "admin" | "moderator"
}
\`\`\`

Sem `tenantId` - isso é a separação.

## 📁 Estrutura

\`\`\`
saas-admin/
├── pages/
│   ├── TenantManagement.tsx
│   ├── ModuleManagement.tsx
│   ├── PlanManagement.tsx
│   └── AuditLogs.tsx
├── components/
│   ├── TenantForm.tsx
│   ├── ModuleToggle.tsx
│   └── PlanSelector.tsx
└── services/
    ├── tenantService.ts
    ├── moduleService.ts
    └── auditService.ts
\`\`\`

## 💡 Padrão de Serviço

\`\`\`typescript
// services/tenantService.ts
import { TenantService } from "@/core";

export async function createTenant(name: string, planId: string) {
  // Auth guard verifica: é SaaS Admin?
  const tenant = await tenantService.createTenant(name, planId);

  // Auditoria
  await auditLogger.log({
    userId: currentUserId,
    action: "tenant_created",
    resource: "tenant",
    newValue: { tenantId: tenant.id },
    status: "success"
  });

  return tenant;
}
\`\`\`

## 🔑 Nunca Compartilhe Dados

\`\`\`typescript
// ❌ ERRADO - Expor tenant data ao SaaS Admin
export async function getTenantOrders(tenantId: string) {
  return supabase
    .from('modules.delivery_orders')
    .select()
    .eq('tenant_id', tenantId);
}

// ✅ CORRETO - Apenas gerenciar plano/módulo
export async function activateModuleForTenant(tenantId: string, moduleId: string) {
  return moduleRegistry.activateModuleForTenant(moduleId, tenantId);
}
\`\`\`

## 📝 Próximos Passos

- [ ] Criar páginas de SaaS Admin
- [ ] Implementar tenant management
- [ ] Implementar module management
- [ ] Implementar audit logs viewer
