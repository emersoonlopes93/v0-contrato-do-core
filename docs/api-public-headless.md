# API Pública Headless

**Contrato obrigatório**: Esta camada segue rigorosamente as regras do Contrato do Core.

---

## 📐 Arquitetura

```
/src/api/v1
  /tenant
    /<module-id>
      <resource>.controller.ts
  /saas-admin
    <resource>.controller.ts
  middleware.ts
  index.ts
```

---

## 🎯 Princípios

### ✅ Controllers DEVEM

- Ser **thin** (finos, sem lógica de negócio)
- Validar entrada (schema-based)
- Chamar serviços de módulos
- Retornar resposta HTTP
- Emitir NO MÁXIMO logs/debug

### ❌ Controllers NÃO DEVEM

- Conter lógica de negócio
- Acessar banco diretamente
- Bypassar serviços
- Conhecer Prisma
- Conhecer outros módulos
- Mutar tenant context

---

## 🔐 Autenticação

### Tenant User Routes

**Requisitos obrigatórios:**
1. `requireTenantAuth` - Valida JWT
2. `requireModule(moduleId)` - Verifica módulo ativo
3. `requirePermission(permission)` - Verifica RBAC
4. `requireFeatureFlag(flagId)` - (Opcional) trava rota por feature flag

**Exemplo (Hello Module):**
```typescript
{
  method: 'POST',
  path: '/api/v1/tenant/hello/create',
  middlewares: [
    requireTenantAuth,
    requireModule('hello'),
    requirePermission('hello.create'),
    requireFeatureFlag('hello.v2'),
  ],
  handler: helloController.createHello,
}
```

### SaaS Admin Routes

**Requisitos obrigatórios:**
1. `requireSaaSAdminAuth` - Valida JWT SaaS Admin

**Exemplo:**
```typescript
{
  method: 'GET',
  path: '/api/v1/saas-admin/tenants',
  middlewares: [requireSaaSAdminAuth],
  handler: tenantsController.listTenants,
}
```

---

## 🛡️ Middleware Chain

**Ordem recomendada:**
1. `requestLogger` - Log da request
2. `errorHandler` - Captura erros
3. `requireAuth` - Autenticação
4. `requireModule` - Verificação de módulo
5. `requirePermission` - Verificação RBAC
6. `requireFeatureFlag` - (Opcional) verificação de feature flag
7. Handler (controller)

**Padrão de erro para feature flag desabilitada:**

```json
{
  "error": "Forbidden",
  "message": "Feature flag '<flagId>' is disabled",
  "code": "FEATURE_FLAG_DISABLED"
}
```

---

## 🎚️ Feature Flags no Core

### Contratos

No Core, feature flags seguem contratos neutros:

```typescript
export type FeatureFlagId = string;

export interface FeatureFlagContext {
  tenantId?: string;
  userId?: string;
  role?: string;
  planId?: string;
}

export interface FeatureFlagRule {
  id: FeatureFlagId;
  tenantId?: string;
  userId?: string;
  role?: string;
  planId?: string;
  enabled: boolean;
}

export interface FeatureFlagProvider {
  isEnabled(flagId: FeatureFlagId, context: FeatureFlagContext): Promise<boolean>;
}
```

### Provider global (MVP em memória)

Implementação mínima em memória:

```typescript
export class MemoryFeatureFlagProvider implements FeatureFlagProvider {
  private rules: FeatureFlagRule[];

  constructor(initialRules?: FeatureFlagRule[]) {
    this.rules = initialRules ?? [];
  }

  setRules(rules: FeatureFlagRule[]): void {
    this.rules = [...rules];
  }

  async isEnabled(flagId: FeatureFlagId, context: FeatureFlagContext): Promise<boolean> {
    const relevantRules = this.rules.filter((rule) => rule.id === flagId);

    if (relevantRules.length === 0) {
      return false;
    }

    return relevantRules.some((rule) => {
      if (rule.tenantId && rule.tenantId !== context.tenantId) {
        return false;
      }

      if (rule.userId && rule.userId !== context.userId) {
        return false;
      }

      if (rule.role && rule.role !== context.role) {
        return false;
      }

      if (rule.planId && rule.planId !== context.planId) {
        return false;
      }

      return rule.enabled;
    });
  }
}
```

O middleware `requireFeatureFlag` usa o provider global:

```typescript
export function requireFeatureFlag(flagId: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.auth || !authReq.auth.tenantId) {
      res.status = 401;
      res.body = { error: 'Unauthorized', message: 'Tenant authentication required' };
      return;
    }

    const enabled = await globalFeatureFlagProvider.isEnabled(flagId, {
      tenantId: authReq.auth.tenantId,
      userId: authReq.auth.userId,
      role: authReq.auth.role,
    });

    if (!enabled) {
      res.status = 403;
      res.body = {
        error: 'Forbidden',
        message: `Feature flag '${flagId}' is disabled`,
        code: 'FEATURE_FLAG_DISABLED',
      };
      return;
    }

    if (next) await next();
  };
}
```

---

## � Billing no Core

### Objetivo

Billing no Core é **neutro**: não conhece Stripe/Paddle/etc.  
Ele define apenas contratos para:

- Assinatura do tenant (plano + status de billing)
- Faturas associadas à assinatura
- Repositório de persistência
- Serviço de leitura/sincronização

### Contratos principais

```typescript
export type BillingProviderId = string;

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "void"
  | "uncollectible";

export interface TenantSubscription {
  id: string;
  tenantId: TenantId;
  planId: string;
  providerId: BillingProviderId;
  externalCustomerId: string;
  externalSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  tenantId: TenantId;
  subscriptionId: string;
  providerId: BillingProviderId;
  externalInvoiceId: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Repositório e Serviço

```typescript
export interface BillingRepository {
  getTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null>;
  saveTenantSubscription(subscription: TenantSubscription): Promise<void>;
  listTenantInvoices(tenantId: TenantId): Promise<Invoice[]>;
  saveInvoice(invoice: Invoice): Promise<void>;
}

export interface BillingService {
  getTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null>;
  syncTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null>;
  listTenantInvoices(tenantId: TenantId): Promise<Invoice[]>;
}
```

### Implementação mínima em memória (operacional)

Para uso em ambientes de desenvolvimento / testes existe um provider em memória:

```typescript
export class MemoryBillingRepository implements BillingRepository {
  private subscriptions: Map<TenantId, TenantSubscription> = new Map();
  private invoices: Map<TenantId, Invoice[]> = new Map();

  async getTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null> {
    return this.subscriptions.get(tenantId) || null;
  }

  async saveTenantSubscription(subscription: TenantSubscription): Promise<void> {
    this.subscriptions.set(subscription.tenantId, subscription);
  }

  async listTenantInvoices(tenantId: TenantId): Promise<Invoice[]> {
    return this.invoices.get(tenantId) || [];
  }

  async saveInvoice(invoice: Invoice): Promise<void> {
    const tenantInvoices = this.invoices.get(invoice.tenantId) || [];
    const existingIndex = tenantInvoices.findIndex((i) => i.id === invoice.id);

    if (existingIndex >= 0) {
      tenantInvoices[existingIndex] = invoice;
    } else {
      tenantInvoices.push(invoice);
    }

    this.invoices.set(invoice.tenantId, tenantInvoices);
  }
}

export class CoreBillingService implements BillingService {
  constructor(private repository: BillingRepository) {}

  async getTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null> {
    return this.repository.getTenantSubscription(tenantId);
  }

  async syncTenantSubscription(tenantId: TenantId): Promise<TenantSubscription | null> {
    return this.repository.getTenantSubscription(tenantId);
  }

  async listTenantInvoices(tenantId: TenantId): Promise<Invoice[]> {
    return this.repository.listTenantInvoices(tenantId);
  }
}
```

**Importante:**

- O Core **não** chama o gateway de pagamento.
- Integrações externas devem ser feitas em adapters (ex.: `adapters/*`), que implementam `BillingRepository` usando Prisma + provider de billing.

---

## �📄 Estrutura de Controller

### Template Obrigatório

```typescript
/**
 * Resource Controller (Tenant | SaaS Admin)
 * 
 * THIN CONTROLLER - No business logic.
 * Validates input, calls service, returns HTTP response.
 */

import type { Request, Response } from '../../middleware';
import { globalModuleServiceRegistry } from '../../../../core';

interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
    tenantId: string; // apenas para tenant routes
    role: string;
    permissions: string[];
  };
}

export async function actionName(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  
  // 1. VALIDATE INPUT
  const { field } = req.body as { field?: string };
  
  if (!field || typeof field !== 'string') {
    res.status = 400;
    res.body = {
      error: 'Bad Request',
      message: 'Field "field" is required',
    };
    return;
  }
  
  try {
    // 2. GET MODULE SERVICE
    const service = globalModuleServiceRegistry.get<ServiceType>('module-id');
    
    if (!service) {
      res.status = 500;
      res.body = { error: 'Service not found' };
      return;
    }
    
    // 3. CALL SERVICE
    const result = await service.method({
      tenantId: authReq.auth.tenantId,
      userId: authReq.auth.userId,
      field,
    });
    
    // 4. RETURN HTTP RESPONSE
    res.status = 200;
    res.body = {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[v0] actionName error:', error);
    res.status = 500;
    res.body = {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Operation failed',
    };
  }
}
```

---

## 🔗 Request/Response Interfaces

### Request
```typescript
interface Request {
  headers: Record<string, string>;
  params?: Record<string, string>;  // path params
  query?: Record<string, string>;   // query string
  body?: unknown;                   // request body
  method: string;                   // HTTP method
  url: string;                      // full URL
}
```

### Response
```typescript
interface Response {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}
```

---

## 🚀 Exemplo: Hello Module

### Controller
```typescript
// /src/api/v1/tenant/hello/hello.controller.ts

export async function createHello(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  const { message } = req.body as { message?: string };
  
  if (!message) {
    res.status = 400;
    res.body = { error: 'message required' };
    return;
  }
  
  const service = globalModuleServiceRegistry.get<HelloService>('hello');
  
  await service!.createHello({
    tenantId: authReq.auth.tenantId,
    userId: authReq.auth.userId,
    message,
  });
  
  res.status = 201;
  res.body = { success: true };
}
```

### Route Registration
```typescript
// /src/api/v1/index.ts

{
  method: 'POST',
  path: '/api/v1/tenant/hello/create',
  middlewares: [
    requireTenantAuth,
    requireModule('hello'),
    requirePermission('hello.create'),
  ],
  handler: helloController.createHello,
}
```

---

## 📊 Padrões de Resposta

### Sucesso
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Erro
```json
{
  "error": "Error Type",
  "message": "Human-readable error message"
}
```

### Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validação falhou)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔍 Tenant Context Resolution

O `tenant_id` é **SEMPRE** resolvido do JWT token:

1. Middleware `requireTenantAuth` valida JWT
2. Extrai `tenant_id` do token
3. Injeta em `req.auth.tenantId`
4. Controller usa `authReq.auth.tenantId`

**NUNCA** receber `tenant_id` do body/params/query em rotas tenant.

---

## 🛠️ Adicionando Novo Controller

### 1. Criar Controller
```bash
/src/api/v1/tenant/<module-id>/<resource>.controller.ts
```

### 2. Implementar Actions
```typescript
export async function actionName(req: Request, res: Response): Promise<void> {
  // Seguir template obrigatório
}
```

### 3. Registrar Rotas
```typescript
// /src/api/v1/index.ts

import * as myController from './tenant/my-module/resource.controller';

export const routes: Route[] = [
  {
    method: 'POST',
    path: '/api/v1/tenant/my-module/action',
    middlewares: [
      requireTenantAuth,
      requireModule('my-module'),
      requirePermission('my-module.write'),
    ],
    handler: myController.actionName,
  },
];
```

---

## ⚠️ Restrições

### NUNCA FAZER

❌ Lógica de negócio no controller  
❌ Acesso direto ao banco  
❌ Importar Prisma no controller  
❌ Bypassar serviços de módulos  
❌ Mutar `tenant_id` no contexto  
❌ Acessar outro módulo diretamente  

### SEMPRE FAZER

�� Validar input antes de chamar service  
✅ Usar `globalModuleServiceRegistry` para obter services  
✅ Retornar HTTP response clara  
✅ Log de erros com `console.error('[v0] ...')`  
✅ Tratar erros e retornar status apropriado  

---

## 📝 Checklist de Conformidade

Antes de fazer commit de um controller, verificar:

- [ ] Controller é thin (< 100 linhas)
- [ ] Sem lógica de negócio
- [ ] Validação de input presente
- [ ] Usa `globalModuleServiceRegistry`
- [ ] Não acessa Prisma diretamente
- [ ] Retorna HTTP response padronizada
- [ ] Middlewares de auth aplicados
- [ ] Módulo verificado com `requireModule()`
- [ ] Permissão verificada com `requirePermission()`
- [ ] Tratamento de erros implementado

---

## 🔗 Referências

- [Contrato do Core](./contrato_do_core_saas_delivery_multi_tenant.md)
- [Authentication](./authentication.md)
- [Module Activation](./module-activation.md)
