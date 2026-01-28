# 👥 Tenant Context

Este contexto é responsável pela **experiência do usuário dentro de um tenant**. Cada usuário pertence a **exatamente um tenant**.

## 📋 Responsabilidades

- Interface para usuários do tenant
- Acessar módulos ativos do tenant
- Respeitar RBAC do tenant
- Usar permissões do tenant
- Respeitar white-label do tenant

## 🚫 Proibições Absolutas

- ❌ Acessar dados de outro tenant
- ❌ Ver usuários de outro tenant
- ❌ Usar módulos não ativos
- ❌ Bypassar verificação RBAC
- ❌ Ver configurações SaaS Admin

## 🔐 Autenticação

Tenant user usa token completo:

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

Token carrega:
- `tenantId` - garante isolamento
- `activeModules` - quais módulos estão disponíveis
- `permissions` - quais ações pode fazer

## 📁 Estrutura

```
tenant/
├── pages/
│   ├── Dashboard.tsx
│   ├── Profile.tsx
│   └── [module-pages]/
├── components/
│   ├── TenantNav.tsx
│   ├── ModuleRouter.tsx
│   └── WhiteBrandHeader.tsx
└── services/
    ├── tenantUserService.ts
    ├── whiteblrandService.ts
    └── moduleService.ts
```

## 💡 Padrão de Acesso

```typescript
// pages/Dashboard.tsx
import { TenantUserToken } from "@/core";

export function Dashboard({ token }: { token: TenantUserToken }) {
  // 1. Token contém tenantId
  const { tenantId, activeModules, permissions } = token;

  // 2. Renderizar apenas módulos ativos
  return (
    <div>
      {activeModules.includes("delivery") && <DeliveryModule tenantId={tenantId} />}
      {activeModules.includes("payments") && <PaymentsModule tenantId={tenantId} />}
    </div>
  );
}
```

## 🔒 Segurança

### Obrigação: tenant_id em queries

```typescript
// ✅ CORRETO - Query com tenant_id
const data = await supabase
  .from('modules.delivery_orders')
  .select()
  .eq('tenant_id', token.tenantId) // Token garante isso
  .eq('user_id', token.userId);

// ❌ ERRADO - Query sem verificar tenant_id
const data = await supabase
  .from('modules.delivery_orders')
  .select()
  .eq('order_id', orderId); // Pode acessar outro tenant!
```

### Verificação de RBAC

```typescript
// ✅ CORRETO - Verificar permissão
const canDelete = token.permissions.includes('delivery.order.delete');

// Depois verificar no Core também
const verified = await authGuard.requirePermission(token, 'delivery.order.delete');
```

## 🎨 White-Label

Cada tenant tem sua própria visual identity:

```typescript
// Carregar white-brand do tenant
const config = await whiteblrandService.getConfig(token.tenantId);

return (
  <header style={{ backgroundColor: config.primaryColor }}>
    {config.logo && <img src={config.logo} />}
  </header>
);
```

## 📝 Próximos Passos

- [ ] Criar Dashboard page
- [ ] Implementar routing por módulo ativo
- [ ] Implementar white-brand header
- [ ] Implementar tenant user profile
