# Modelo de Domínio

O modelo de dados é centralizado no arquivo `./prisma/schema.prisma`. Abaixo estão as principais entidades e seus papéis no sistema.

## 👥 Gestão de Usuários e Acesso

### `SaaSAdminUser`
Usuários globais que gerenciam a plataforma. Têm acesso total a tenants, planos e módulos.

### `TenantUser`
Usuários vinculados a um tenant específico. Suas permissões são limitadas ao contexto do tenant.

### `Role` & `Permission`
- `Permission`: Registrada por módulos (ex: `menu.read`, `order.create`).
- `Role`: Coleção de permissões (ex: `Gerente`, `Cozinheiro`). Vinculada ao Tenant.
- `UserRole`: Associação entre usuários e papéis.

## 🏢 Estrutura de Tenant

### `Tenant`
A entidade raiz para todos os dados de um cliente. Identificada por um `slug` (usado para subdomínios ou rotas).

### `TenantSettings` & `StoreSettings`
- `TenantSettings`: Dados legais, fiscais e de contato do cliente.
- `StoreSettings`: Configurações operacionais da loja (horários, taxas de entrega, métodos de pagamento).

### `Plan` & `TenantSubscription`
- `Plan`: Definição global de recursos e preços.
- `TenantSubscription`: Vínculo de um tenant a um plano com período de validade.

### `Module` & `TenantModule`
- `Module`: Definição de uma funcionalidade plugável.
- `TenantModule`: Registro de ativação de um módulo para um tenant específico.

## 🍽️ Módulo de Cardápio (Menu Online)

### `Category`
Categorias de produtos (ex: "Pizzas", "Bebidas").

### `Product`
Itens do cardápio com preço base.

### `PriceVariation`
Variações de tamanho ou tipo para um produto.

### `ModifierGroup` & `ModifierOption`
Adicionais e complementos (ex: "Borda recheada", "Sem cebola").

### `MenuCombo`
Combinações de produtos com preço promocional.

## 📦 Pedidos e Financeiro

### `Order` & `OrderItem`
- `Order`: O pedido principal com status, total e dados do cliente.
- `OrderItem`: Itens individuais do pedido com seus modificadores.

### `Payment`
Registro de transações financeiras vinculadas a pedidos.

### `TenantFinancialSummary`
Resumo consolidado de vendas e taxas para o tenant.

## 📝 Auditoria

### `AuditEvent`
Log detalhado de ações: quem fez o quê, quando e em qual recurso (incluindo valores antigos e novos).
