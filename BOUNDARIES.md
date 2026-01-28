# 🚧 Boundaries - Contrato de Isolamento

Este documento define **exatamente o que cada camada pode e não pode fazer**. Violar é violar o contrato.

---

## 1️⃣ CORE - Boundaries Strictas

### ✅ Core PODE

#### Autenticação
- Gerar tokens SaaS Admin
- Gerar tokens Tenant User
- Verificar validade de tokens
- Separar contextos (Admin ≠ Tenant)

#### Tenants
- Criar/atualizar/deletar tenants
- Atribuir planos a tenants
- Listar todos os tenants (SaaS Admin)
- Listar tenants de um usuário (Tenant User)

#### Usuários
- Criar usuários SaaS Admin
- Criar usuários de tenant
- Atribuir roles a usuários
- Gerenciar status (active/inactive)

#### Módulos
- Registrar módulos
- Ativar/desativar módulos por tenant
- Verificar se módulo está ativo
- Listar módulos ativos de um tenant

#### Permissões (RBAC)
- Criar roles por tenant
- Atribuir permissions a roles
- Verificar se usuário tem permission
- Listar permissions de um usuário

#### Planos
- Criar/atualizar planos
- Atribuir planos a tenants
- Verificar limites de plano
- Listar módulos disponíveis no plano

#### Eventos
- Emitir eventos do Core
- Log de auditoria de ações do Core
- Publicar para subscribers

#### White-Brand
- Definir configuração global
- Definir configuração por tenant
- Retornar configuração (sem lógica)

### ❌ Core NÃO PODE

- ❌ Acessar dados operacionais de módulos
- ❌ Conhecer regras de delivery, pedidos, etc
- ❌ Executar lógica de negócio específica
- ❌ Criar tabelas de módulos
- ❌ Modificar schema de módulos
- ❌ Fazer queries diretas em dados de módulo
- ❌ Conhecer estrutura interna de módulos
- ❌ Emitir eventos de módulo
- ❌ Ter implementações de negócio

---

## 2️⃣ SaaS Admin - Boundaries Strictas

### ✅ SaaS Admin PODE

- Criar/editar/deletar tenants
- Atribuir planos a tenants
- Ativar/desativar módulos
- Criar usuários SaaS Admin
- Ver logs de auditoria
- Configurar global white-brand
- Gerenciar configurações da plataforma

### ❌ SaaS Admin NÃO PODE

- ❌ Acessar dados operacionais de tenant
- ❌ Ver dados de pedidos, clientes, etc
- ❌ Modificar dados dentro de tenant
- ❌ Criar users de tenant (apenas framework)
- ❌ Acessar módulos de tenant
- ❌ Emitir eventos de tenant
- ❌ Bypassar isolamento multi-tenant

---

## 3️⃣ Módulos - Boundaries Strictas

### ✅ Módulo PODE

- Registrar suas permissões no Core
- Registrar seus event types
- Ter seu próprio schema no banco
- Emitir eventos para EventBus
- Ler dados do próprio tenant (tenant_id)
- Consultar Core para:
  - Verificar se está ativo
  - Obter informações de white-brand
  - Verificar limites de plano
  - Emitir eventos

### ❌ Módulo NÃO PODE

- ❌ Acessar dados de outro módulo
- ❌ Acessar banco de outro módulo
- ❌ Acessar dados de outro tenant
- ❌ Registrar permissões globais
- ❌ Modificar token do usuário
- ❌ Acessar chaves secretas de outro módulo
- ❌ Modificar Core contract
- ❌ Fazer queries sem tenant_id
- ❌ Executar sem estar ativo
- ❌ Comunicar diretamente com outro módulo

---

## 4️⃣ Tenant User - Boundaries Strictas

### ✅ Tenant User PODE

- Acessar dados de seu tenant
- Usar módulos ativos para seu tenant
- Ler white-brand de seu tenant
- Emitir eventos dentro de seu tenant
- Acessar permissões do Core

### ❌ Tenant User NÃO PODE

- ❌ Acessar dados de outro tenant
- ❌ Usar módulos não ativos
- ❌ Bypassar verificação RBAC
- ❌ Ver configurações SaaS Admin
- ❌ Criar tenants

---

## 5️⃣ Database - Regras Obrigatórias

### ✅ Tabelas do Core

```sql
-- SEMPRE existem
tenants
tenant_users
saas_admin_users
plans
modules
tenant_modules
roles
permissions
role_permissions
user_roles
whitebrand_configs
audit_events

### ✅ Tabelas de Módulos

Cada módulo tem seu próprio schema:


-- Exemplo: módulo delivery
modules.delivery_orders
modules.delivery_routes
modules.delivery_assignments

### ✅ Obrigação: tenant_id


### ✅ Obrigação: tenant_id

```sql
-- ✅ Correto - Operacional
INSERT INTO modules.delivery_orders (tenant_id, ...) VALUES (?, ...);

-- ❌ Errado - Sem tenant_id
INSERT INTO modules.delivery_orders (order_id, ...) VALUES (?, ...);

### Exceções (SEM tenant_id)

```sql

-- Global
tenants
saas_admin_users
plans
modules
audit_events (pode ser NULL para SaaS Admin)

## 6️⃣ Authorization - Fluxo Obrigatório

### Request → Auth → Tenant → Module → Permission
1. Request chega com token
2. Auth verifica token (SaaS Admin ou Tenant User)
3. Se Tenant User:
   a. Extrai tenant_id do token
   b. Verifica se módulo está ativo
   c. Verifica se usuário tem permission
4. Se passa, executa
5. Se falha, rejeita com 403/401

### Checklist de Verificação

Para TODA ação sensível:

// 1. Verificar se user é SaaS Admin ou Tenant User
const { context } = token;

// 2. Se SaaS Admin, permitir ações SaaS Admin
if (context === UserContext.SAAS_ADMIN) {
  // SaaS Admin context
}

// 3. Se Tenant User, verificar tenant + permission
if (context === UserContext.TENANT_USER) {
  // Verificar tenant_id obrigatório
  if (!token.tenantId) throw new Error("tenant_id required");

  // Verificar módulo ativo
  if (!token.activeModules.includes(moduleId)) {
    throw new Error("Module not active");
  }

  // Verificar permission
  if (!token.permissions.includes(requiredPermission)) {
    throw new Error("Permission denied");
  }
}

## 7️⃣ Eventos - Quem Emite O Quê

### Core Emite

- `core.tenant.created`
- `core.tenant.updated`
- `core.tenant_user.created`
- `core.plan.changed`
- `core.module.activated`
- `core.permission.granted`
- `core.saas_admin.login`
- `core.tenant_user.login`

### Módulo Emite


// Registra seus eventTypes
{
  id: "delivery.order.created",
  name: "Order Created",
  description: "..."
}

// Emite via EventBus
await eventBus.publish({
  type: "delivery.order.created",
  tenantId,
  userId,
  data: { orderId, ... }
});

### Ninguém Emite

- ❌ Módulo não emite eventos do Core
- ❌ Core não emite eventos de módulo
- ❌ SaaS Admin não emite eventos de tenant

---

## 8️⃣ White-Label - Regras de Aplicação

### SaaS Admin Pode

// Configurar global
await globalWhiteBrandService.updateConfig({
  systemName: "My SaaS",
  primaryColor: "#..."
});

### Tenant User Recebe


// Do seu tenant
const config = await tenantWhiteBrandService.getConfig(tenantId);
// Ou fallback para global se não houver custom


### Nunca Hardcoded


### Tenant User Recebe


// Do seu tenant
const config = await tenantWhiteBrandService.getConfig(tenantId);
// Ou fallback para global se não houver custom


### Nunca Hardcoded

```typescript

// ❌ ERRADO - Hardcoded
const logo = "https://mycompany.com/logo.png";

// ✅ CORRETO - De config
const { logo } = await whiteBrandService.getConfig(tenantId);

---

## 9️⃣ Migração Entre Camadas - PROIBIDO

### ❌ Proibido


// ❌ Core acessando dados de módulo
const orders = await supabase
  .from('modules.delivery_orders')
  .select();

// ❌ Módulo acessando Core sem verificação
const users = await supabase
  .from('tenant_users')
  .select()
  .eq('tenant_id', randomTenantId); // Violaria isolamento

// ❌ SaaS Admin acessando tenant data
const orders = await supabase
  .from('modules.delivery_orders')
  .select()
  .eq('tenant_id', tenantId); // Bypassaria RLS

### ✅ Correto

```typescript
// ✅ Módulo lê dados do próprio tenant
const orders = await supabase
  .from('modules.delivery_orders')
  .select()
  .eq('tenant_id', currentTenantId) // Token garante isso
  .eq('user_id', currentUserId);

// ✅ Core verifica permissão via AuthGuard
const canAccess = await authGuard.requirePermission(token, 'module.read');

---

## 🔟 RLS (Row Level Security) - Obrigatório

### Tabelas do Core

-- tenant_users: Apenas SaaS Admin ou próprio tenant
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SaaS admins can view all"
  ON tenant_users FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM saas_admin_users WHERE id = auth.uid()) IS NOT NULL
  );

CREATE POLICY "Users can view own data"
  ON tenant_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

### Tabelas de Módulo

-- Exemplo: delivery_orders
ALTER TABLE modules.delivery_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can only see own orders"
  ON modules.delivery_orders FOR SELECT
  TO authenticated
  USING (tenant_id = auth.jwt() ->> 'tenant_id');

---

## ✅ Checklist Final

Antes de mergear código:

- [ ] Core não conhece nenhuma regra de negócio?
- [ ] Toda tabela operacional tem tenant_id?
- [ ] Auth está separada (Admin ≠ Tenant)?
- [ ] Módulo não acessa banco de outro módulo?
- [ ] RLS está ativada em todas as tabelas?
- [ ] Eventos são emitidos para auditoria?
- [ ] RBAC é verificado em ações sensíveis?
- [ ] White-label não está hardcoded?
- [ ] Isolamento multi-tenant está garantido?

---

## 📌 Lembre-se

> **O contrato é imutável. Qualquer violação compromete todo o sistema.**

Se tiver dúvida se algo é permitido → **não é permitido**.
