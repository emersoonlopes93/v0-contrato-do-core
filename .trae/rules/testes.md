---
alwaysApply: false
---
# 🌱 PROMPT OFICIAL — PRISMA SEED (DESENVOLVIMENTO)

## OBJETIVO

Criar dados mínimos e previsíveis para desenvolvimento e testes, respeitando
rigorosamente o contrato do Core SaaS (multi-tenant, neutro, modular).

Este seed existe **apenas para ambiente de desenvolvimento**.

---

## CONTEXTO DO PROJETO

- SaaS multi-tenant
- Core neutro (sem regras de negócio)
- Autenticação separada:
  - SaaS Admin
  - Tenant User
- Módulos ativáveis por tenant
- Sistema de Plan & Billing Enforcement
- Prisma como adapter de banco de dados

---

## REGRAS OBRIGATÓRIAS

### O SEED DEVE

- Usar Prisma Client diretamente
- Ser idempotente (pode rodar várias vezes sem quebrar)
- Criar entidades completas e válidas
- Usar hash real de senha (bcrypt)
- Respeitar isolamento multi-tenant
- Ativar módulos via tabela `tenant_modules`
- Definir plano inicial do tenant
- Não depender de UI
- Não depender de endpoints

---

### O SEED NÃO PODE

- Criar lógica de negócio
- Criar regras fora do Core
- Burlar RBAC ou Plan Enforcement
- Criar dados parciais ou inconsistentes
- Misturar SaaS Admin com Tenant User

---

## DADOS A SEREM CRIADOS

### 1️⃣ SaaS ADMIN (OPCIONAL, MAS RECOMENDADO)

- Email: `admin@saas.local`
- Senha: `admin123`
- Role: `admin`

---

### 2️⃣ TENANT DEMO

- Name: `Demo Tenant`
- Slug: `demo`
- Status: `active`

---

### 3️⃣ TENANT USER (ADMIN DO TENANT)

- Email: `demo@tenant.local`
- Senha: `demo123`
- Role: `admin`
- Associado ao tenant `demo`

---

### 4️⃣ PLANO DO TENANT

- Plano: `pro`
- Fonte: `CorePlanService`
- Persistido conforme contrato

---

### 5️⃣ MÓDULOS ATIVOS

Ativar para o tenant:
- `hello-module`

A ativação deve:
- Validar o módulo no ModuleRegistry
- Criar registro em `tenant_modules`
- Evitar duplicação

---

## ESTRUTURA ESPERADA

```text
/prisma
  └── seed.ts
ORDEM CORRETA DE EXECUÇÃO NO SEED

Inicializar Prisma Client

Criar SaaS Admin (se não existir)

Criar Tenant Demo

Criar Tenant User com senha hash

Associar usuário ao tenant

Definir plano do tenant

Ativar módulos permitidos

Logar resumo no console

Finalizar conexão com o banco

COMPORTAMENTO ESPERADO

Após executar:

pnpm prisma db seed

Deve ser possível:

Abrir a Tenant App

Fazer login com:

Email: demo@tenant.local

Senha: demo123

Acessar o painel

Ver o hello-module ativo

Testar guards de módulo e plano

SAÍDA ESPERADA NO CONSOLE
✅ Seed completed successfully
Tenant: demo
Tenant User: demo@tenant.local / demo123

COMANDO DE EXECUÇÃO
pnpm prisma db seed