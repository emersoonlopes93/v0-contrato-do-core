# Database Setup - Prisma + PostgreSQL

## Configuração Inicial

### 1. Configure a DATABASE_URL

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o `.env` e configure a `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### Exemplos de Connection Strings:

**Neon:**
```
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/dbname"
```

**Supabase:**
```
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"
```

**Local (Docker):**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saas_core"
```

---

## 2. Gerar Prisma Client

Após configurar a `DATABASE_URL`, gere o Prisma Client:

```bash
npm run prisma:generate
```

Isso cria os tipos TypeScript baseados no schema.

---

## 3. Executar Migrations

Para criar as tabelas no banco de dados:

```bash
npm run prisma:migrate
```

Isso executará todas as migrations pendentes.

---

## 4. Registrar o Adapter no Core

No seu arquivo de inicialização (ex: `src/main.tsx` ou `src/index.ts`):

```typescript
import { registerDatabaseAdapterFactory } from './core/db/database';
import { PrismaAdapterFactory } from './adapters/prisma';

// Registrar factory do Prisma
registerDatabaseAdapterFactory(new PrismaAdapterFactory());

// Criar adapter
const db = await createDatabaseAdapter();

// Definir contexto do tenant (em requests autenticadas)
db.setTenantContext({ tenantId: 'tenant-123', userId: 'user-456' });
```

---

## 5. Usar o Database Adapter

### Exemplo básico:

```typescript
import { createDatabaseAdapter } from './core/db/database';
import type { TenantUserTable } from './core/db/database';

const db = await createDatabaseAdapter();
db.setTenantContext({ tenantId: 'tenant-123' });

// Repository
const usersRepo = db.repository<TenantUserTable>('TenantUser');

// Criar usuário
const user = await usersRepo.create({
  email: 'john@example.com',
  password_hash: 'hashed...',
  name: 'John Doe',
});

// Buscar usuários (automaticamente filtrado por tenant_id)
const users = await usersRepo.findMany({
  filters: [{ field: 'status', operator: 'eq', value: 'active' }],
  orderBy: [{ field: 'created_at', direction: 'desc' }],
  limit: 10,
});
```

---

## Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run prisma:generate` | Gera Prisma Client e tipos TypeScript |
| `npm run prisma:migrate` | Executa migrations pendentes |
| `npm run prisma:studio` | Abre Prisma Studio (UI para o banco) |

---

## Arquitetura

```
/src
  /core
    /db
      contracts.ts     ← Interfaces neutras
      database.ts      ← Factory pattern
  /adapters
    /prisma
      client.ts        ← PrismaClient singleton
      prisma-adapter.ts ← Implementação IDatabaseAdapter
      tenant-middleware.ts ← Filtro automático tenant_id
/prisma
  schema.prisma       ← Schema completo
```

---

## Tenant Isolation

O adapter aplica **automaticamente** filtros por `tenant_id` em todas as queries para tabelas que possuem esse campo.

**Tabelas com tenant_id:**
- `tenant_users`
- `tenant_modules`
- `roles`
- `user_roles`
- `white_brand_configs`
- `audit_events`
- `tenant_subscriptions`

**Tabelas globais (sem tenant_id):**
- `saas_admin_users`
- `plans`
- `modules`

---

## Segurança

- Sempre configure `tenantContext` em requests autenticadas
- Nunca exponha `raw()` queries diretamente para o client
- Use transações para operações que modificam múltiplas tabelas
- RLS (Row Level Security) pode ser adicionado no PostgreSQL para camada extra

---

## Próximos Passos

- Implementar módulos de negócio usando o adapter
- Adicionar seeds de dados iniciais (planos, módulos, etc)
- Configurar RLS no PostgreSQL (opcional)
- Implementar cache layer (Redis) se necessário
