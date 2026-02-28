Visão geral da arquitetura

1 Core + N módulos

Core = espinha dorsal do sistema (obrigatório pra tudo)

Módulos = ativados/desativados por tenant (plano, licença, feature flag)

Core (obrigatório)
 ├─ Auth & Tenant
 ├─ SARG (Super Admin)
 ├─ White-label
 ├─ Billing & Planos
 ├─ Permissões & RBAC
 ├─ Feature Flags
 └─ Infra base (logs, auditoria, eventos)

Módulos (opcionais)
 ├─ Gestor de pedidos
 ├─ Cardápio online
 ├─ PDV
 ├─ KDS
 ├─ Motoboy / logística
 ├─ CRM
 ├─ Dashboard
 ├─ Cupons / promoções
 └─ Integrações

🔑 CORE – O que não pode faltar

Esse core você faz uma vez só e nunca mais quebra.

1️⃣ Multi-Tenant (o coração)

Modelo recomendado: Tenant isolado por ID + RBAC

Entidades principais

tenants

users

tenant_users

roles

permissions

Cada request:

→ identifica tenant
→ valida plano
→ valida módulos ativos
→ valida permissões


💡 Dica: sempre tenha tenant_id em TODAS as tabelas.

2️⃣ Autenticação e Autorização

Login por:

Email/senha

WhatsApp (futuro)

SSO (futuro)

JWT + Refresh Token

RBAC por tenant

Exemplo de roles

Owner

Gerente

Atendente

Motoboy

Financeiro

3️⃣ SARG – Super Admin (global)

Esse é fora dos tenants.

Ele controla:

Tenants

Planos

Módulos

White-label

Bloqueios

Logs globais

📌 O SARG não entra como usuário comum.

Funções do SARG

Criar tenant

Suspender tenant

Ativar/desativar módulos

Alterar plano

Ver métricas globais

Forçar logout

Ver auditoria

4️⃣ White-Label (nativo no core)

Desde o início, não deixe isso pra depois.

Por tenant:

Nome do sistema

Logo

Cores (primary, secondary)

Domínio próprio

Email sender

WhatsApp sender

Splash screen (app)

Tabela exemplo:

tenant_branding
- tenant_id
- logo_url
- primary_color
- secondary_color
- domain

5️⃣ Sistema de Módulos (plugável)

Esse ponto é chave.

Tabela base:

modules
tenant_modules


Cada módulo:

Tem slug

Tem dependências

Pode ser ativado/desativado

Tem cobrança associada

Exemplo

pedido
pdv
kds
motoboy
crm


No backend:

if (!tenant.hasModule("pdv")) {
  return 403
}

6️⃣ Billing & Planos

Mesmo que você não cobre agora, prepare o core.

Planos:

Básico

Pro

Enterprise

Limites:

pedidos/mês

usuários

módulos

Cobrança:

mensal

por pedido

por entregador

💡 Você já comentou sobre separar valores → isso entra aqui depois.

7️⃣ Feature Flags

Pra liberar recursos aos poucos:

por tenant

por plano

por usuário

Exemplo:

enable_new_dashboard = true

8️⃣ Eventos & Auditoria

Tudo importante vira evento:

login

pedido criado

pagamento

atraso

alteração de plano

Isso ajuda MUITO no futuro (analytics + bugs).

🧩 MÓDULOS – Estrutura padrão

Todo módulo segue o mesmo padrão:

/modules/pedidos
 ├─ controllers
 ├─ services
 ├─ routes
 ├─ permissions
 └─ events


E cada módulo:

se registra no core

define permissões

define eventos

define dependências

🚀 Ordem certa pra construir (MVP inteligente)

Eu faria assim:

Fase 1 – Core puro

✔ Multi-tenant
✔ Auth
✔ SARG
✔ White-label
✔ Módulos
✔ Planos

👉 Sem delivery ainda

Fase 2 – Primeiro módulo real

✔ Cadastro de loja
✔ Cardápio online
✔ Produtos + complementos

👉 Aqui você já consegue vender.

Fase 3 – Delivery de verdade

✔ Pedidos
✔ Kanban
✔ Notificações
✔ Motoboy

🛠 Stack (pensando no que você já citou)

Backend: Node + NestJS ou Fastify

DB: Postgres

Auth: Supabase / Auth próprio

Realtime: WebSocket / Supabase Realtime

IA: Bolt / v0 / Trae pra gerar telas e serviços

Frontend: Next.js

Apps: Capacitor

Se quiser, no próximo passo eu posso:

desenhar o schema do banco do CORE

criar o fluxo de auth + tenant

montar a estrutura de pastas real

ou te ajudar a transformar isso num produto SaaS vendável desde o mês 1

Me diz: você quer arquitetura, banco, ou fluxo de código agora?

Correção, quiz dizer SaaS e não sarg

Perfeito 😄 entendi total agora.
Então vamos corrigir o conceito e alinhar do jeito certo, sem bagunçar a arquitetura.

👉 Onde você falou SARG, o correto é SaaS Admin / Super Admin do SaaS.
A ideia continua 100% válida, só muda o nome e o papel.

Vou reorganizar tudo já com o termo certo 👇

🧠 Visão corrigida do sistema

Você terá 3 camadas bem claras:

SaaS (Super Admin)
 └─ controla a plataforma inteira

Core (obrigatório)
 └─ base técnica e de negócio

Tenants (clientes)
 └─ usam módulos conforme o plano

👑 SaaS Admin (Super Admin da plataforma)

Esse é o painel do dono do sistema.
Não é tenant. Não é loja. É a empresa dona do SaaS.

O que o SaaS Admin controla

Criar / bloquear / suspender tenants

Gerenciar planos e preços

Ativar / desativar módulos

White-label global e por tenant

Ver métricas gerais

Gerenciar domínios

Logs globais

Auditoria

Suporte e impersonação (entrar como tenant)

📌 Importante:

SaaS Admin NÃO compartilha autenticação com tenants

Idealmente:

URL separada
admin.seusistema.com

Banco lógico separado (ou schema separado)

🧩 CORE – base de tudo

O Core é usado tanto pelo SaaS Admin quanto pelos tenants.

Componentes obrigatórios do Core

✔ Multi-tenant
✔ Autenticação
✔ Autorização (RBAC)
✔ Sistema de módulos
✔ White-label
✔ Billing
✔ Feature flags
✔ Auditoria
✔ Eventos

🔐 Autenticação (separada e limpa)
1️⃣ SaaS Admin

Login próprio

Roles internas:

owner

suporte

financeiro

Não depende de tenant

2️⃣ Tenant

Usuários por tenant

RBAC por loja

Permissões por módulo

🧱 Multi-Tenant (do jeito certo)

Modelo recomendado pra você:

🔹 Single DB + isolamento por tenant_id

Mais simples

Escala bem

Menos custo

Regra de ouro:

Toda tabela operacional tem tenant_id

🎨 White-label (nativo)
Global (SaaS)

Nome da plataforma

Marca default

Emails padrão

Por tenant

Logo

Cores

Domínio próprio

Identidade visual

🧩 Sistema de Módulos (chave do SaaS)

Cada tenant pode ter módulos diferentes.

Exemplo de módulos

cardapio

pedidos

pdv

kds

motoboy

crm

dashboard

Como o core valida
tenant → plano → módulos → permissões

💳 Billing & Planos

Mesmo que você ainda não cobre, isso nasce no core.

Planos:

Free

Start

Pro

Cobrança:

mensal

por pedido

por entregador

Limites por plano:

usuários

pedidos

módulos

🧠 Fluxo geral do sistema
Request
 → Auth
 → Identifica tenant
 → Verifica plano
 → Verifica módulo
 → Verifica permissão
 → Executa ação

🏗 Ordem ideal de construção
Fase 1 – Base SaaS

✔ SaaS Admin
✔ Core
✔ Multi-tenant
✔ Auth
✔ White-label
✔ Billing básico

👉 aqui você já tem um SaaS real, mesmo sem delivery

Fase 2 – Primeiro valor real

✔ Cadastro da loja
✔ Cardápio online
✔ Produtos + adicionais

Fase 3 – Delivery completo

✔ Pedidos
✔ Kanban
✔ Notificações
✔ Motoboy + rastreio

🎯 Agora, próximo passo prático

Posso ir bem mão na massa com você, por exemplo:

1️⃣ Desenhar o schema do banco do CORE (tabelas reais)
2️⃣ Criar fluxo de autenticação SaaS Admin vs Tenant
3️⃣ Definir contrato de módulos (como um módulo nasce)
4️⃣ Montar estrutura de pastas pronta pra Bolt / v0 gerar código