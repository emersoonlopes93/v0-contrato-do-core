---
name: Tenant-Admin — Mapa Oficial v1
description: use para decidir prioridade sempre que executar um prompt
---

CONTEXTO FIXO — TENANT-ADMIN (OFICIAL)

Este projeto é um SaaS multi-tenant para restaurante e delivery.
O Tenant-Admin segue estritamente o MAPA OFICIAL v1.

REGRAS GERAIS:
- Tenant-Admin é o painel operacional do restaurante
- Billing, planos e módulos pertencem ao SaaS-Admin
- Mobile-first obrigatório
- Nada de dados mockados
- Nada fora do mapa oficial
- Cada módulo deve respeitar camadas: Page → Hook → Service → Repository

MAPA OFICIAL TENANT-ADMIN:

Sistema SaaS de Restaurante & Delivery (estilo Anota Aí / Blendi)

🎯 OBJETIVO DO TENANT-ADMIN

Painel operacional do restaurante (tenant), responsável por:

Operação diária

Vendas

Cozinha

Caixa / Financeiro

Pessoas

Entregas

Integrações

📌 Regra de ouro:
Tenant-Admin NUNCA cuida de billing SaaS, planos ou módulos → isso é SaaS-Admin.

🧱 CAMADAS DO TENANT-ADMIN
1️⃣ CORE OPERACIONAL (obrigatório)

Esses módulos sempre existem, mesmo no plano básico.

🧩 1. Pedidos

Fonte da verdade dos pedidos

Responsabilidades:

Criar pedidos (cardápio público, PDV, WhatsApp)

Estados:
novo → confirmado → em preparo → pronto → saiu → entregue / cancelado

Pagamento vinculado

Tipo: balcão / mesa / delivery / retirada

Eventos:

Emite eventos para → KDS, Caixa, Entregas

🧩 2. Cardápio (Interno)

Gestão do cardápio

Produtos

Categorias

Complementos

Preços

Disponibilidade

Horários

🔗 Usado por:

Cardápio público

PDV

Pedidos

🧩 3. Clientes (CRM básico)

Clientes finais

Nome

Telefone

Endereços

Histórico de pedidos

Observações

📌 Base para CRM avançado futuro.

🧩 4. Funcionários & Permissões (RBAC)

Controle de acesso

Perfis:

Admin

Gerente

Cozinha

Balconista

Garçom

Entregador

Permissões:

Por módulo

Por ação

⚙️ OPERAÇÃO DIÁRIA
🧩 5. KDS (Kitchen Display System)

Tela de cozinha

Recebe pedidos do módulo Pedidos

Atualiza status (em preparo / pronto)

Multi-telas (opcional)

Filtros por estação

📌 NÃO cria pedidos. Apenas executa.

🧩 6. PDV (Ponto de Venda)

Venda local

Venda balcão / mesa

Integra pedidos

Integra caixa

Pagamentos locais

📌 Depende de:

Cardápio

Caixa

Funcionários

🧩 7. Caixa

Controle financeiro operacional

Funcionalidades:

Abertura / fechamento

Entradas / saídas

Sangrias

Caixa único ou multi-caixa

Relatório diário

📌 Fonte de dados para Financeiro.

🚚 ENTREGA & LOGÍSTICA
🧩 8. Entregas

Gestão de delivery

Entregadores próprios

Status da entrega

Vinculado ao pedido

🧩 9. Roteirização (Premium)

Otimização de rotas

Integra Google Distance Matrix API

Sugere rota ideal

Tempo estimado

💰 FINANCEIRO & FISCAL
🧩 10. Financeiro

Visão consolidada

Faturamento

Taxas

Formas de pagamento

Relatórios por período

📌 NÃO substitui Caixa. Ele consome o Caixa.

🧩 11. Fiscal / NF-e (Premium)

Notas fiscais

Emissão automática/manual

Integra SEFAZ

Configurações fiscais

🎨 EXPERIÊNCIA & MARKETING
🧩 12. Designer da Loja

Visual do cardápio público

Cores

Layout

Estilo de imagens

Botões

Preview em tempo real

📌 Nunca quebra o core (blindagem).

🧩 13. CRM Avançado (Premium)

Relacionamento

Segmentação

Cupons

Campanhas

Histórico detalhado

🔌 INTEGRAÇÕES
🧩 14. Integrações

WhatsApp

Pagamentos

Mapas

Fiscal

Marketing

🧠 REGRAS ARQUITETURAIS (IMPORTANTÍSSIMO)
✅ O que é OBRIGATÓRIO

Cada módulo:

Página

Context/Hook

Service

Repository

Comunicação via eventos ou serviços

Mobile-first sempre

❌ O que é PROIBIDO

Lógica duplicada entre módulos

Módulo acessando DB de outro

UI acoplada à regra de negócio

Mock em produção

🏷️ CLASSIFICAÇÃO DE MÓDULOS
Tipo	Descrição
CORE	Sempre ativo
OPCIONAL	Ativável
PREMIUM	Plano avançado
🧩 STATUS DO SEU PROJETO (REALISTA)

Você já tem:

Cardápio

Pedidos

Parte do Admin

Designer da Loja

Checkout público

REGRAS ABSOLUTAS:
- Não criar módulos fora do mapa sem autorização explícita
- Não alterar módulos existentes sem pedido explícito
- Não usar mocks
- Não refatorar arquitetura sem prompt específico