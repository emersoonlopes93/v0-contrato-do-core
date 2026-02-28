# Sistema de Autenticação - Core

## Visão Geral

O Core implementa autenticação completa com **separação total** entre SaaS Admin e Tenant Users, conforme o Contrato do Core.

## Características

- ✅ **SaaS Admin e Tenant Users separados** - Tokens não reutilizados
- ✅ **Tenant isolation automático** - tenant_id obrigatório e validado
- ✅ **RBAC integrado** - Permissions carregadas no token
- ✅ **Refresh tokens seguros** - Armazenados com hash (SHA-256)
- ✅ **Precedência do tenant_id** - Token JWT tem prioridade
- ✅ **Password security** - Bcrypt com salt rounds = 10
- ✅ **Token expiration** - Access: 15min, Refresh: 7 dias

## Estrutura

```
/src/core/auth/
  contracts.ts              # Interfaces
  password.ts               # Hash e validação de senha
  jwt.ts                    # Geração e verificação JWT
  guards.ts                 # Middlewares de autenticação
  index.ts                  # Exports centralizados
  /saas-admin/
    saas-admin-auth.service.ts  # Auth SaaS Admin
  /tenant/
    tenant-auth.service.ts      # Auth Tenant User

/src/core/context/
  tenant-context.ts         # Resolver tenant_id
  index.ts

/src/adapters/prisma/repositories/
  auth-repository.ts        # Queries de auth
```

## Fluxos de Autenticação

### 1. SaaS Admin Login

```typescript
import { SaaSAdminAuthService } from '@/core/auth';

const authService = new SaaSAdminAuthService();

const result = await authService.login({
  email: 'admin@saas.com',
  password: 'SecurePassword123',
});

// result = {
//   accessToken: "eyJhbGc...",
//   refreshToken: "eyJhbGc...",
//   user: { id, email, name, role }
// }
```

**Token payload (SaaS Admin):**
```json
{
  "context": "saas_admin",
  "userId": "uuid",
  "role": "admin"
}
```

### 2. Tenant User Login

```typescript
import { TenantAuthService } from '@/core/auth';

const authService = new TenantAuthService();

const result = await authService.login({
  tenantId: 'tenant-uuid',
  email: 'user@tenant.com',
  password: 'SecurePassword123',
});

// result = {
//   accessToken: "eyJhbGc...",
//   refreshToken: "eyJhbGc...",
//   user: { id, email, name, tenantId, role, permissions }
// }
```

**Token payload (Tenant User):**
```json
{
  "context": "tenant_user",
  "userId": "uuid",
  "tenantId": "tenant-uuid",
  "role": "manager",
  "permissions": ["orders.read", "orders.create"]
}
```

## Guards (Middlewares)

### Proteger rotas SaaS Admin

```typescript
import { AuthGuards } from '@/core/auth';

const guards = new AuthGuards();

const result = await guards.requireSaaSAdmin({
  token: 'Bearer eyJhbGc...',
});

// result = {
//   isAuthenticated: true,
//   token: { context, userId, role }
// }
```

### Proteger rotas Tenant

```typescript
const result = await guards.requireTenantUser({
  token: 'Bearer eyJhbGc...',
  headers: { 'x-tenant-id': 'optional' },
});

// result = {
//   isAuthenticated: true,
//   token: { context, userId, tenantId, role, permissions },
//   tenantId: "tenant-uuid" // Validated
// }
```

### Proteger por permissão

```typescript
await guards.requirePermission(
  { token: 'Bearer eyJhbGc...' },
  'orders.create'
);
```

### Proteger por role

```typescript
await guards.requireRole(
  { token: 'Bearer eyJhbGc...' },
  'manager'
);
```

## Tenant Context Resolver

Resolve `tenant_id` por diferentes estratégias:

**Ordem de precedência:**
1. JWT Token (se autenticado) ← **MAIOR PRECEDÊNCIA**
2. Header `X-Tenant-ID`
3. Subdomain (`tenant1.app.com` → busca slug `tenant1`)
4. Path param (`/tenant/:tenantId/...`)

```typescript
import { TenantContextResolver } from '@/core/context';

const resolver = new TenantContextResolver();

const result = await resolver.resolve({
  token: 'eyJhbGc...', // JWT decodificado
  headers: { 'x-tenant-id': 'uuid' },
  subdomain: 'tenant1.app.com',
  pathParams: { tenantId: 'uuid' },
});

// result = {
//   tenantId: "uuid",
//   strategy: "token" | "subdomain" | "header" | "path"
// }
```

## Refresh Token

```typescript
const result = await authService.refreshToken('refresh-token-here');

// result = { accessToken: "new-token" }
```

## Logout

```typescript
// Revoga um refresh token
await authService.logout('refresh-token');

// Revoga TODOS os refresh tokens do user
await authService.logoutAll('user-id');
```

## Refresh Token Storage

Refresh tokens são armazenados na tabela `refresh_tokens`:

- `token_hash` - SHA-256 hash do token (segurança)
- `user_id` - ID do usuário
- `user_type` - `"saas_admin"` ou `"tenant_user"`
- `tenant_id` - NULL para SaaS Admin, preenchido para Tenant User
- `expires_at` - Data de expiração
- `revoked` - Flag de revogação

## Validação de Senha

```typescript
import { PasswordService } from '@/core/auth';

const validation = PasswordService.validateStrength('mypassword');

// validation = {
//   valid: false,
//   errors: [
//     "Password must be at least 8 characters long",
//     "Password must contain at least one uppercase letter",
//     ...
//   ]
// }
```

**Requisitos:**
- Mínimo 8 caracteres
- Pelo menos 1 maiúscula
- Pelo menos 1 minúscula
- Pelo menos 1 número

## Variáveis de Ambiente

```bash
# .env
DATABASE_URL="postgresql://..."
JWT_SECRET="min-32-chars-secret-key"
```

## Conformidade com o Contrato

- ✅ SaaS Admin e Tenant Users **completamente separados**
- ✅ Tokens **não reutilizados** entre contextos
- ✅ Tenant isolation **obrigatório e automático**
- ✅ tenant_id do token tem **precedência**
- ✅ RBAC aplicado **após autenticação**
- ✅ Refresh tokens **armazenados com segurança**
- ✅ Core **neutro** (sem regras de negócio)

## Próximos Passos

- ✅ Sistema de autenticação completo
- 🔲 Criar módulo exemplo (hello-module)
- 🔲 Criar endpoints de API (opcional)
- 🔲 Criar UI de login (opcional)
