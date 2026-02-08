ROADMAP DE IMPLEMENTAÇÃO — TENANT ADMIN

Premissas

Sprint = 1 a 2 semanas

Cada sprint fecha módulos usáveis em produção

Ordem baseada em dependência operacional (restaurante real)

🔒 SPRINT 0 — Base Técnica (obrigatória)

📌 Objetivo: garantir que tudo que vier depois não vire gambiarra.

Entregas

Padronizar:

Page / Hook / Service / Repository

Auth + Permissões por papel (admin, gerente, etc)

Contexto do tenant carregado globalmente

Estados globais: loading / empty / error

Layout final do tenant-admin (menu, header, mobile)

✅ Resultado

Qualquer módulo novo entra sem quebrar nada.

⚡ SPRINT 1 — Pedidos (Core Absoluto)

📌 Objetivo: sistema funcionar na prática.

Módulos

Pedidos (tempo real)

Detalhe do pedido

Atualização de status

Integração com cardápio público

Extras

WebSocket ou polling

Estados visuais claros (novo, preparo, pronto)

✅ Resultado

Restaurante consegue operar pedidos.

🍳 SPRINT 2 — KDS (Cozinha)

📌 Objetivo: tirar o caos da cozinha.

Módulos

KDS por estação

Fila de preparo

Tempo de preparo

Atualização em tempo real

Integrações

Pedidos

Funcionários (perfil cozinha)

✅ Resultado

Cozinha organizada e rastreável.

💰 SPRINT 3 — Caixa / PDV

📌 Objetivo: controle financeiro diário.

Módulos

Abertura e fechamento de caixa

Caixa único e multi-caixa

Sangria

Entradas e saídas

Integração com pedidos

Extras

Relatório do dia

Diferença de caixa

✅ Resultado

Restaurante sabe quanto ganhou (de verdade).

🧾 SPRINT 4 — Financeiro Básico

📌 Objetivo: visão financeira clara.

Módulos

Faturamento

Formas de pagamento

Histórico

Exportação CSV

Integrações

Caixa

Pedidos

✅ Resultado

Dono consegue analisar números.

🚚 SPRINT 5 — Entregas + Roteirização

📌 Objetivo: logística eficiente.

Módulos

Cadastro de entregadores

Status de entrega

Roteirização

Google Distance Matrix API

Extras

Tempo estimado

Histórico por entregador

✅ Resultado

Menos atraso, menos reclamação.

👥 SPRINT 6 — Funcionários + Permissões

📌 Objetivo: controle de acesso real.

Módulos

Cadastro de funcionários

Perfis:

Admin

Gerente

Cozinha

Balconista

Garçom

Permissões por módulo

✅ Resultado

Cada um vê só o que precisa.

🎨 SPRINT 7 — Cardápio + Designer

📌 Objetivo: autonomia visual para o tenant.

Módulos

Gestão de cardápio

Designer visual

Preview em tempo real

Publicação instantânea

✅ Resultado

Tenant mexe no cardápio sem chamar suporte.

👤 SPRINT 8 — Clientes (CRM)

📌 Objetivo: começar inteligência de negócio.

Módulos

Histórico de pedidos

Ticket médio

Frequência

Observações internas

Segmentação simples

✅ Resultado

Restaurante começa a reter clientes.

🧾 SPRINT 9 — Fiscal

📌 Objetivo: compliance.

Módulos

Emissão de notas

Status fiscal

Histórico

Integração com serviço fiscal

⚠️ Sprint isolada por complexidade legal.

✅ Resultado

Operação legalizada.

🔧 SPRINT 10 — Hardening & Produção

📌 Objetivo: fechar com chave de ouro.

Ajustes

Performance

UX refinements

Logs e auditoria

Testes críticos

Documentação final

✅ Resultado

Produto sólido, escalável e vendável.