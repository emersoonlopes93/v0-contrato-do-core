# Tenant Module Activation System

Sistema de ativação de módulos por tenant seguindo o Contrato do Core.

## Princípios Fundamentais

1. **Core é NEUTRO**: Core não sabe o que um módulo faz, apenas conhece module IDs
2. **Ativação tenant-scoped**: Cada tenant pode ter módulos diferentes ativos
3. **Runtime checks**: Ativação verificada em tempo de execução via guards
4. **Sem hardcoding**: Módulos NÃO são embedados em JWT tokens
5. **Validação contra registry**: Só módulos registrados podem ser ativados

## Arquitetura

### 1. Database Schema

```sql
-- Tabela: tenant_modules
CREATE TABLE tenant_modules (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  module_id VARCHAR NOT NULL REFERENCES modules(id),
  status VARCHAR DEFAULT 'active', -- 'active' | 'inactive'
  activated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deactivated_at TIMESTAMP NULL,
  UNIQUE(tenant_id, module_id)
);
```

### 2. Core Contracts

**Interface:** `ITenantModuleService`

```typescript
interface ITenantModuleService {
  enable(tenantId: string, moduleId: string): Promise<void>;
  disable(tenantId: string, moduleId: string): Promise<void>;
  isEnabled(tenantId: string, moduleId: string): Promise<boolean>;
  listEnabled(tenantId: string): Promise<string[]>;
}
```

### 3. Prisma Adapter

**Implementação:** `/src/adapters/prisma/modules/tenant-module.service.ts`

- Valida module_id contra `ModuleRegistry` antes de ativar
- Todas as queries incluem `tenant_id` (obrigatório)
- Soft delete via `deactivated_at` timestamp
- Type-safe usando Prisma Client

### 4. Guards

**Guard:** `requireModule(moduleId)`

```typescript
// Resolve tenant_id do contexto
// Verifica se módulo está ativo
// Lança Forbidden se não estiver ativo
await authGuards.requireModule(context, 'hello-module');
```

**Composição com outros guards:**

```typescript
// Requer autenticação + módulo ativo
const result = await authGuards.requireModule(context, 'orders-module');

// Requer autenticação + permissão + módulo
await authGuards.requirePermission(context, 'orders.create');
await authGuards.requireModule(context, 'orders-module');
```

## Uso

### Ativar módulo para tenant

```typescript
import { tenantModuleService } from '@/adapters/prisma/modules';

// Ativa módulo (valida se existe no registry)
await tenantModuleService.enable('tenant-123', 'hello-module');
```

### Desativar módulo

```typescript
// Soft disable (seta deactivated_at)
await tenantModuleService.disable('tenant-123', 'hello-module');
```

### Verificar se módulo está ativo

```typescript
const isActive = await tenantModuleService.isEnabled('tenant-123', 'hello-module');

if (!isActive) {
  throw new Error('Module not enabled');
}
```

### Listar módulos ativos

```typescript
const activeModules = await tenantModuleService.listEnabled('tenant-123');
// ['hello-module', 'orders-module', 'payments-module']
```

### Proteger rotas com guard

```typescript
import { AuthGuards } from '@/core/auth/guards';

const guards = new AuthGuards();

// Endpoint que requer módulo ativo
async function handleRequest(request) {
  const context = {
    token: request.headers.authorization,
    headers: request.headers,
  };

  // Valida tenant + módulo ativo
  const result = await guards.requireModule(context, 'hello-module');

  // tenant_id está disponível em result.tenantId
  // Executar lógica do módulo...
}
```

## Fluxo de Ativação

```
1. SaaS Admin registra módulo no ModuleRegistry
   ↓
2. Módulo disponível no catálogo global
   ↓
3. SaaS Admin ativa módulo para Tenant X
   → tenantModuleService.enable('tenant-x', 'module-id')
   ↓
4. Validação: module existe no registry?
   → SIM: cria registro em tenant_modules
   → NÃO: throw Error
   ↓
5. Tenant User tenta acessar feature do módulo
   ↓
6. Guard verifica: módulo ativo para tenant?
   → SIM: permite acesso
   → NÃO: throw Forbidden
```

## Regras de Validação

### Ao ativar módulo:

1. ✅ Módulo DEVE existir no `ModuleRegistry`
2. ✅ `tenant_id` DEVE ser válido
3. ✅ Se já ativo, retorna sem erro
4. ✅ Se foi desativado, reativa (limpa `deactivated_at`)

### Ao verificar ativação:

1. ✅ Status DEVE ser `'active'`
2. ✅ `deactivated_at` DEVE ser `null`
3. ✅ Registro DEVE existir em `tenant_modules`

## Separação de Responsabilidades

| Componente | Responsabilidade |
|------------|------------------|
| **Core Contracts** | Define interfaces neutras |
| **Prisma Adapter** | Implementa persistência + validação |
| **ModuleRegistry** | Mantém catálogo global de módulos |
| **Guards** | Enforce ativação em runtime |
| **Módulos** | NÃO sabem de ativação (isolados) |

## Anti-Patterns (PROIBIDO)

❌ Embedar lista de módulos no JWT token  
❌ Verificar ativação no código do módulo  
❌ Hardcodear lista de módulos no banco  
❌ Módulo acessar TenantModuleService diretamente  
❌ Lógica de negócio no Core  
❌ Cross-module imports  

## Best Practices

✅ Sempre usar guards para proteger rotas  
✅ Validar módulo existe antes de ativar  
✅ Soft delete via `deactivated_at`  
✅ Todas queries incluem `tenant_id`  
✅ Type-safe via TypeScript + Prisma  
✅ Core permanece neutro e desacoplado  

## Exemplo Completo

```typescript
// 1. Registrar módulo (SaaS Admin)
import { globalModuleRegistry } from '@/core';

await globalModuleRegistry.register({
  id: 'orders-module',
  name: 'Orders Management',
  version: '1.0.0',
  permissions: ['orders.create', 'orders.read'],
  eventTypes: ['order.created'],
});

// 2. Ativar para tenant (SaaS Admin)
import { tenantModuleService } from '@/adapters/prisma/modules';

await tenantModuleService.enable('tenant-abc', 'orders-module');

// 3. Proteger endpoint (Application)
import { AuthGuards } from '@/core/auth/guards';

const guards = new AuthGuards();

async function createOrder(request) {
  const context = {
    token: request.headers.authorization,
    headers: request.headers,
  };

  // Valida: autenticado + módulo ativo + permissão
  await guards.requireModule(context, 'orders-module');
  await guards.requirePermission(context, 'orders.create');

  // Criar pedido...
}
```

## Migrations

Para aplicar o schema:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Testes

```typescript
import { tenantModuleService } from '@/adapters/prisma/modules';
import { globalModuleRegistry } from '@/core';

describe('Tenant Module Activation', () => {
  it('should enable module for tenant', async () => {
    // Setup
    await globalModuleRegistry.register({
      id: 'test-module',
      name: 'Test',
      version: '1.0.0',
      permissions: [],
      eventTypes: [],
    });

    // Act
    await tenantModuleService.enable('tenant-1', 'test-module');

    // Assert
    const isEnabled = await tenantModuleService.isEnabled('tenant-1', 'test-module');
    expect(isEnabled).toBe(true);
  });

  it('should throw if module not registered', async () => {
    await expect(
      tenantModuleService.enable('tenant-1', 'non-existent-module')
    ).rejects.toThrow('not registered');
  });
});
```

## Conformidade com o Contrato

✅ Core é neutro (apenas module IDs)  
✅ Ativação tenant-scoped  
✅ Verificação runtime via guards  
✅ Sem hardcoding de módulos  
✅ Validação contra ModuleRegistry  
✅ Queries incluem tenant_id  
✅ Soft delete implementado  
✅ Type-safe e compilável  
✅ Separação de responsabilidades clara  
✅ Nenhuma lógica de negócio no Core
