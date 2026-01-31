# Hello Module

Módulo exemplo seguindo o Contrato do Core.

## Descrição

Demonstra a estrutura correta de um módulo plug-and-play:
- Isolado e auto-contido
- Tenant-aware (tenant_id obrigatório)
- Comunicação apenas via EventBus
- Respeita RBAC
- Não modifica o Core

## Estrutura

```
/hello-module
  /src
    index.ts              # Exports + default export
    module.ts             # Bootstrap (register function)
    manifest.ts           # Identidade do módulo
    permissions.ts        # Permissões centralizadas
    events.ts             # Eventos públicos + payloads
    /services
      hello.service.ts    # Lógica de negócio
    /repositories
      hello.repository.ts # Persistência (tenant-aware)
    /listeners
      hello.listener.ts   # Reage a eventos
  README.md               # Documentação
```

## Permissions

- `hello.read` - Ler hellos do tenant
- `hello.create` - Criar novos hellos

## Events Emitted

### `hello.created`

Emitido quando um hello é criado.

**Payload:**
```typescript
{
  tenantId: string;
  userId: string;
  message: string;
  timestamp: Date;
}
```

### `hello.greeted`

Emitido quando um greeting é gerado.

**Payload:**
```typescript
{
  tenantId: string;
  userId: string;
  greeting: string;
  timestamp: Date;
}
```

## Dependencies

Nenhuma dependência externa. Usa apenas Core.

## Usage

### Registrar o módulo

```typescript
import { globalModuleRegistry } from '@/core';
import helloModule from '@/modules/hello-module/src';

await globalModuleRegistry.register(helloModule.manifest, helloModule.register);
```

### Usar o serviço

```typescript
import { globalModuleServiceRegistry } from '@/core';

const helloService = globalModuleServiceRegistry.getService('hello-module', 'HelloService');

await helloService.createHello({
  tenantId: 'tenant-123',
  userId: 'user-456',
  message: 'Hello World!',
});

const greeting = await helloService.greet({
  tenantId: 'tenant-123',
  userId: 'user-456',
  name: 'John',
});

console.log(greeting); // "Hello, John! Welcome to the module system."
```

## Conformidade

- ✅ Plug-and-play (isolado)
- ✅ Tenant-aware (tenant_id obrigatório)
- ✅ Comunicação via EventBus
- ✅ Respeita RBAC
- ✅ Não modifica Core
- ✅ Sem dependências cross-module
- ✅ Sem UI ou routing
- ✅ Sem lógica de auth
