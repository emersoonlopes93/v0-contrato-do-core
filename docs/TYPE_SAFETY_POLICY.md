# Type Safety Policy

## Visão Geral

Esta política estabelece as regras e diretrizes para Type Safety no projeto, garantindo segurança de tipos em áreas críticas enquanto permite flexibilidade em contextos apropriados.

## 🚨 ÁREAS CRÍTICAS - ZERO ANY TOLERANCE

### Core Financeiro
- **Módulos**: `src/modules/finance*`, `src/modules/caixa*`, `src/modules/pdv*`
- **Regra**: **ZERO** usos de `any` permitidos
- **Justificativa**: Valores monetários, cálculos de taxa, split e repasse exigem tipagem explícita

### Autenticação e Autorização
- **Módulos**: `src/modules/auth*`, `src/core/auth*`
- **Regra**: **ZERO** usos de `any` permitidos
- **Justificativa**: Segurança de dados sensíveis e controle de acesso

### Split e Settlement
- **Módulos**: `src/modules/delivery-settlement*`, `src/modules/*split*`
- **Regra**: **ZERO** usos de `any` permitidos
- **Justificativa**: Cálculos de repasse monetário exigem precisão

### Pricing e Taxas
- **Módulos**: `src/modules/delivery-pricing*`, `src/modules/*pricing*`
- **Regra**: **ZERO** usos de `any` permitidos
- **Justificativa**: Cálculo de taxas de entrega e preços

## ⚠️ ÁREAS DE WARNING - USO CONTROLADO

### Infraestrutura e Adapters
- **Módulos**: `src/adapters/*`, `src/infrastructure/*`
- **Permitido**: `unknown as`, `Record<string, unknown>`
- **Proibido**: `any`, `as any`, `Promise<any>`
- **Justificativa**: Casts técnicos controlados para integração externa

### UI e Componentes
- **Módulos**: `src/components/*`, `src/ui/*`
- **Permitido**: `unknown` com type guards
- **Proibido**: `any` em props de componente
- **Justificativa**: Props de componente devem ser tipadas

## 🧪 ÁREAS EXPERIMENTAIS - ANY TEMPORÁRIO

### Módulos Experimentais
- **Módulos**: `src/modules/logistics-ai`
- **Permitido**: `any` temporário com documentação
- **Requisito**: Issue de follow-up aberta para tipagem
- **Justificativa**: Prototipação rápida com dívida técnica controlada

### Scripts e Utilitários
- **Módulos**: `scripts/*`, `tools/*`
- **Permitido**: `any` em scripts de manutenção
- **Requisito**: Comentário explicando necessidade
- **Justificativa**: Scripts de infraestrutura e migração

## 📋 REGRAS ESPECÍFICAS

### 1. Parâmetros de Função
```typescript
// ❌ PROIBIDO
function processData(data: any) { }

// ✅ OBRIGATÓRIO
interface ProcessData {
  id: string;
  value: number;
}
function processData(data: ProcessData) { }
```

### 2. Promise Types
```typescript
// ❌ PROIBIDO
async function fetchData(): Promise<any> { }

// ✅ OBRIGATÓRIO
interface ApiResponse {
  success: boolean;
  data: unknown;
}
async function fetchData(): Promise<ApiResponse> { }
```

### 3. Arrays e Records
```typescript
// ❌ PROIBIDO
const items: any[] = [];
const config: Record<string, any> = {};

// ✅ OBRIGATÓRIO
interface Item {
  id: string;
}
const items: Item[] = [];
const config: Record<string, unknown> = {};
```

### 4. Type Guards para Unknown
```typescript
// ✅ OBRIGATÓRIO
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}
```

## 🔧 IMPLEMENTAÇÃO

### TypeScript Config
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### ESLint Rules
```javascript
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### Auditoria Automática
- **Script**: `scripts/audit-any.ts`
- **Classificação**: CRITICAL, WARNING, EXPERIMENTAL
- **Build Block**: Apenas CRITICAL bloqueia build

## 🚨 VIOLAÇÕES

### Critical (Bloqueia Build)
- `any` em áreas críticas
- `as any` em qualquer lugar
- `Promise<any>` em serviços

### Warning (Não bloqueia)
- `unknown as` sem type guard
- `Record<string, unknown>` sem validação

### Experimental (Permitido)
- `any` em `logistics-ai` com issue aberta

## 📊 MÉTRICAS E MONITORAMENTO

### KPIs
- Zero `any` em áreas críticas
- Redução gradual de `unknown as`
- Coverage de tipo > 95%

### Relatórios
- Diário: `scripts/audit-any.ts`
- Semanal: Relatório de regressão
- Mensal: Revisão de dívida técnica

## 🔄 EVOLUÇÃO

1. **Fase 1**: Eliminar `any` crítico (✅)
2. **Fase 2**: Tipar `logistics-ai` (✅)
3. **Fase 3**: Bloquear novo `any` (✅)
4. **Fase 4**: Governança formal (✅)
5. **Fase 5**: Otimização contínua (🔄)

## 📞 CONTATO E ESCALAÇÃO

- **Dúvidas**: Tech Lead
- **Violações**: Architecture Team
- **Emergências**: CTO

---

**Última atualização**: 2026-02-11
**Versão**: 1.0.0
**Status**: Ativo
