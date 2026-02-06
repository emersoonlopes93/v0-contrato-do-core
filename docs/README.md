# v0 - Contrato do Core: SaaS Multi-Tenant Delivery

Este projeto é uma base sólida e modular para um sistema SaaS (Software as a Service) focado em delivery, seguindo princípios de arquitetura limpa, separação de preocupações e multi-tenancy rigoroso.

## 🚀 Visão Geral

O sistema é dividido em um **Core** estável que gerencia a infraestrutura básica e **Módulos** independentes que implementam as regras de negócio.

### 🏗️ Arquitetura

- **Core**: Gerencia autenticação, autorização (RBAC), gerenciamento de tenants, planos, módulos, eventos e auditoria.
- **Módulos**: Unidades funcionais plugáveis (Ex: Pedidos, Cardápio Online, Pagamentos, Financeiro).
- **Multi-Tenancy**: Isolamento completo de dados entre clientes (tenants) garantido via `tenant_id` e contexto de execução.
- **Contract-Driven**: A comunicação entre Core e Módulos é feita através de contratos (interfaces) bem definidos.

## 🛠️ Tecnologias

- **Backend**: Node.js, TypeScript, Prisma (PostgreSQL), Socket.io.
- **Frontend**: React (Vite), Tailwind CSS, Radix UI.
- **Autenticação**: JWT com contextos separados para Admin e Tenant.
- **Testes**: Vitest.

## 📂 Documentação Detalhada

Para entender melhor o sistema, consulte os seguintes documentos:

1. [**Visão Geral do Sistema**](./docs/SYSTEM_OVERVIEW.md): Arquitetura de alto nível e conceitos fundamentais.
2. [**Modelo de Domínio**](./docs/DOMAIN_MODEL.md): Entidades principais e relacionamento de dados.
3. [**Detalhes de Arquitetura**](./docs/ARCHITECTURE_DETAILS.md): Auth flow, RBAC, Multi-tenancy e Sistema de Módulos.
4. [**Guia de Desenvolvimento**](./docs/DEVELOPMENT_GUIDE.md): Como contribuir, criar módulos e executar o projeto.

---

## 🚦 Como Iniciar

### Pré-requisitos
- Node.js 18+
- PostgreSQL

### Instalação
```bash
npm install
```

### Configuração
Crie um arquivo `.env` baseado no `.env.example` e configure sua `DATABASE_URL`.

### Execução
```bash
# Iniciar API e Frontend em paralelo
npm run dev:all

# Apenas API
npm run api

# Apenas Frontend
npm run dev
```

### Banco de Dados
```bash
# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio
```
