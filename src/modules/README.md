# 📦 Módulos Plugáveis

Este diretório contém todos os módulos da aplicação. Cada módulo é **completamente isolado** e segue o **Contrato do Core**.

## 📋 Regras Obrigatórias

1. **Cada módulo tem seu próprio diretório**
   \`\`\`
   modules/
   ├── [module-name]/
   │   ├── types/
   │   ├── routes/
   │   ├── permissions/
   │   ├── events/
   │   └── index.ts
   \`\`\`

2. **Cada módulo tem seu próprio schema no banco**
   \`\`\`sql
   -- Não usar core.*
   -- Usar modules.[module-name].*
   CREATE TABLE modules.[module-name]_items (
     tenant_id UUID NOT NULL,
     ...
   );
   \`\`\`

3. **Cada módulo registra suas permissões**
   \`\`\`typescript
   const module = {
     id: "module.name",
     permissions: [
       { id: "module.read", name: "Read" },
       { id: "module.write", name: "Write" }
     ],
     events: [
       { id: "module.item.created", name: "Item Created" }
     ]
   };
   \`\`\`

4. **Comunicação apenas via EventBus**
   - Módulos NÃO acessam dados de outros módulos diretamente
   - Módulos emitem eventos
   - Outros módulos se inscrevem no EventBus

5. **Obrigação: tenant_id em toda tabela operacional**
   \`\`\`sql
   -- ✅ Correto
   INSERT INTO modules.delivery_orders (tenant_id, ...) VALUES (?);

   -- ❌ Errado
   INSERT INTO modules.delivery_orders (order_id, ...) VALUES (?);
   \`\`\`

## 🚫 Proibições Absolutas

- ❌ Acessar banco de outro módulo
- ❌ Modificar Core
- ❌ Acessar dados de outro tenant sem verificar tenant_id
- ❌ Comunicar diretamente com outro módulo
- ❌ Hardcoded de regras de negócio global
- ❌ Bypassar RBAC do Core

## ✅ Exemplo de Estrutura

\`\`\`typescript
// modules/delivery/index.ts
import { asModuleId } from "@/core";

const moduleDefinition = {
  id: asModuleId("delivery"),
  name: "Delivery",
  version: "1.0.0",
  permissions: [
    { id: "delivery.order.read", name: "Read Orders", description: "..." },
    { id: "delivery.order.write", name: "Create Orders", description: "..." }
  ],
  events: [
    { id: "delivery.order.created", name: "Order Created", description: "..." },
    { id: "delivery.order.updated", name: "Order Updated", description: "..." }
  ],
  requiredPlan: undefined
};

export async function registerDeliveryModule() {
  await globalModuleRegistry.register(moduleDefinition);
}

// modules/delivery/routes/index.ts
export async function handleCreateOrder(request: Request, token: TenantUserToken) {
  // Guard verifica:
  // 1. Módulo está ativo?
  // 2. Usuário tem permissão?
  const verified = await authGuard.requirePermission(token, "delivery.order.write");

  // Operação (tenant_id vem do token)
  const order = await createOrder(token.tenantId, data);

  // Emitir evento
  await eventBus.publish({
    type: "delivery.order.created",
    tenantId: token.tenantId,
    userId: token.userId,
    data: { orderId: order.id }
  });

  return order;
}
\`\`\`

## 🔄 Fluxo de Inicialização

1. Core inicializa
2. SaaS Admin ativa módulo para tenant
3. Módulo registra no `globalModuleRegistry`
4. Token de tenant inclui módulo ativo
5. Requisição verifica permissão e ativa módulo
6. Módulo executa

## 📝 Próximos Passos

- [ ] Criar primeira módulo exemplo
- [ ] Implementar suportar de multi-tenancy
- [ ] Implementar EventBus subscribers
- [ ] Implementar RLS por tenant
