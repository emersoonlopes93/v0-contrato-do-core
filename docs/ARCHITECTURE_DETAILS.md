# Detalhes de Arquitetura

Este documento aprofunda-se nos mecanismos internos que garantem a segurança e a modularidade do sistema.

## 🔑 Fluxo de Autenticação

O sistema utiliza dois tipos de tokens JWT distintos:

1.  **SaaS Admin Context**:
    - Payload: `{ "userId": string, "role": "admin", "context": "saas_admin" }`
    - Uso: Acesso a rotas `/api/v1/admin/*`.
2.  **Tenant User Context**:
    - Payload: `{ "userId": string, "tenantId": string, "role": string, "permissions": string[], "activeModules": string[], "context": "tenant_user" }`
    - Uso: Acesso a rotas `/api/v1/tenant/*`.

### Resolução de Contexto
O `TenantContextResolver` identifica o tenant atual através de uma ordem de prioridade:
1.  `tenant_id` presente no token JWT.
2.  Header `X-Tenant-ID`.
3.  Header `X-Tenant-Subdomain` (lookup via slug).
4.  Path Parameter `:tenantId` ou `:tenantSlug`.

## 🛡️ RBAC (Role-Based Access Control)

As permissões são verificadas em dois níveis:
1.  **Nível de Token**: O token contém as permissões básicas para evitar consultas excessivas ao banco em rotas de leitura.
2.  **Nível de Banco**: Em ações críticas (escrita), o middleware `requirePermission` consulta o `AuthRepository` para validar se o usuário ainda possui aquela permissão.

## 📦 Sistema de Módulos Plugáveis

### Como um Módulo é Registrado
No arquivo `./src/api/v1/index.ts`, os módulos são instanciados e registrados no `globalModuleRegistry`.

```typescript
// Exemplo de registro
void globalModuleRegistry.register(menuOnlineModule.manifest);
void menuOnlineModule.register(moduleContext);
```

### O que é o `ModuleContext`?
É o objeto que o Core passa para o módulo durante o registro, fornecendo acesso controlado à infraestrutura:
- `database`: Adaptador de banco de dados.
- `eventBus`: Barramento de eventos global.
- `registerService`: Permite que o módulo exponha seus serviços internos para o Core ou outros módulos.

## 🎯 Isolamento de Dados (Multi-Tenancy)

O isolamento é aplicado na camada de aplicação e reforçado por convenções no banco de dados.

### Regras de Ouro:
1.  **Toda tabela operacional** (pedidos, produtos, clientes) deve ter uma coluna `tenant_id`.
2.  **Middlewares de Guard** garantem que o usuário autenticado só possa acessar dados cujo `tenant_id` coincida com o do seu token.
3.  **Audit Logs** capturam o `tenant_id` para permitir rastreamento individualizado.

## 🔊 Comunicação em Tempo Real

Utilizamos Socket.io para notificações instantâneas. O servidor de realtime é inicializado junto com o servidor de API em `./src/server.ts`.
- **Salas (Rooms)**: Usuários são agrupados em salas baseadas em seu `tenant_id` para garantir que um tenant não receba notificações de outro.
