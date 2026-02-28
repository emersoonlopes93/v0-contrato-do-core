# Visão Geral do Sistema

Este documento descreve a arquitetura de alto nível e os conceitos fundamentais do sistema v0-contrato-do-core.

## 🏛️ Filosofia Arquitetural

O sistema baseia-se em quatro pilares principais:

1.  **Neutralidade do Core**: O Core não possui conhecimento sobre regras de negócio específicas de delivery. Ele fornece apenas a infraestrutura necessária para que os módulos funcionem.
2.  **Isolamento por Design**: Cada tenant deve ter seus dados isolados. Nenhum vazamento de dados entre tenants é permitido.
3.  **Modularidade Extensível**: Novos recursos são adicionados como módulos independentes que se acoplam ao Core via contratos.
4.  **Auditabilidade**: Todas as ações críticas no sistema devem ser registradas para fins de auditoria.

## 🧩 Componentes Principais

### 1. Core (Infraestrutura)
Localizado em `./src/core`, é o coração do sistema.
- **Auth**: Autenticação JWT com múltiplos contextos.
- **Tenant Context**: Resolução automática do tenant atual.
- **RBAC**: Gerenciamento de papéis e permissões.
- **Module Registry**: Registro e ciclo de vida de módulos.
- **Event Bus**: Comunicação assíncrona entre módulos e Core.
- **Billing/Plan**: Controle de planos e limites de uso.

### 2. Módulos (Negócio)
Localizados em `./src/modules`. Cada módulo é uma unidade independente que contém:
- **Manifesto**: Identificação, versão e permissões necessárias.
- **Controllers/Routes**: Handlers de API.
- **Services**: Lógica de negócio.
- **Schema**: Tabelas específicas no banco de dados (gerenciadas via Prisma).

### 3. API Layer
Localizada em `./src/api`.
- **Custom Router**: Um roteador HTTP leve que aplica middlewares de segurança e contexto antes de delegar para os controllers.
- **Middlewares**: Logger, Error Handler, Auth Guards e Module Guards.

## 💻 Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Linguagem** | TypeScript |
| **Runtime** | Node.js |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Prisma |
| **API Framework** | Custom (HTTP nativo + tsx) |
| **Realtime** | Socket.io |
| **Frontend** | React + Vite |
| **Estilização** | Tailwind CSS + Radix UI |
| **Testes** | Vitest |

## 🛡️ Segurança e Isolamento

- **Tokens JWT**: Contêm informações de contexto (`saas_admin` ou `tenant_user`).
- **Tenant Isolation**: Toda consulta ao banco de dados deve filtrar por `tenant_id`.
- **Module Activation**: Um módulo só é acessível se estiver explicitamente ativado para o tenant.
