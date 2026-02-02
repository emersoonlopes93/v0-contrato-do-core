# Sistema de Cards Padronizados

Sistema completo de cards reutilizáveis para o Tenant App, seguindo as especificações do prompt oficial de padronização visual.

## Componentes Disponíveis

### 1. BaseCard

Card base reutilizável com visual padronizado.

**Características:**
- Border radius médio (12px)
- Sombra suave com elevação no hover
- Mobile-first e responsivo
- Composição modular (Header, Content, Footer)

**Uso:**
```tsx
import { BaseCard } from '@/src/tenant/components/cards';

<BaseCard onClick={() => {}}>
  <BaseCard.Header 
    title="Título do card"
    description="Descrição opcional"
    action={<Button>Ação</Button>}
  />
  <BaseCard.Content>
    Conteúdo do card
  </BaseCard.Content>
  <BaseCard.Footer>
    Rodapé com ações
  </BaseCard.Footer>
</BaseCard>
```

### 2. StatusBadge

Badge colorido por status de pedido com cores padronizadas.

**Cores por Status:**
- `created` → Cinza
- `accepted` → Verde
- `preparing` → Azul
- `ready` → Roxo
- `completed` → Verde escuro
- `cancelled` → Vermelho
- `pending_payment` → Amarelo
- `confirmed` → Verde
- `delivering` → Laranja
- `delivered` → Verde escuro
- `expired` → Cinza

**Uso:**
```tsx
import { StatusBadge } from '@/src/tenant/components/cards';

<StatusBadge status="preparing" />
<StatusBadge status="confirmed" label="Pedido confirmado" />
```

### 3. OrderCard

Card padronizado para pedidos com duas variantes.

**Variantes:**
- `compact`: Para Kanban (compacto, informações essenciais)
- `full`: Para lista (completo, todas as informações)

**Uso:**
```tsx
import { OrderCard } from '@/src/tenant/components/cards';

// Versão compacta (Kanban)
<OrderCard
  variant="compact"
  orderNumber={123}
  status="preparing"
  total={45.90}
  itemsCount={3}
  createdAt="2024-01-20T10:30:00Z"
  source="app"
  currency="BRL"
  onClick={() => {}}
/>

// Versão completa (Lista)
<OrderCard
  variant="full"
  orderNumber={123}
  status="preparing"
  customerName="João Silva"
  total={45.90}
  itemsCount={3}
  createdAt="2024-01-20T10:30:00Z"
  paymentMethod="pix"
  deliveryType="delivery"
  source="app"
  currency="BRL"
  timezone="America/Sao_Paulo"
  onClick={() => {}}
/>
```

### 4. ProductCard

Card padronizado para produtos do cardápio com três variantes.

**Variantes:**
- `public`: Para cardápio público (botão "Adicionar")
- `admin`: Para gestão (botões "Editar" e "Visualizar")
- `preview`: Para preview interno (botão "Ver detalhes")

**Uso:**
```tsx
import { ProductCard } from '@/src/tenant/components/cards';

// Cardápio público
<ProductCard
  variant="public"
  name="Pizza Margherita"
  description="Molho de tomate, mussarela e manjericão fresco"
  price={45.90}
  imageUrl="https://..."
  currency="BRL"
  onClick={() => {}}
/>

// Área administrativa
<ProductCard
  variant="admin"
  name="Pizza Margherita"
  description="Molho de tomate, mussarela e manjericão fresco"
  price={45.90}
  imageUrl="https://..."
  status="active"
  categoryName="Pizzas"
  currency="BRL"
  onEdit={() => {}}
  onClick={() => {}}
/>

// Com promoção
<ProductCard
  variant="public"
  name="Pizza Margherita"
  description="Molho de tomate, mussarela e manjericão fresco"
  price={45.90}
  promoPrice={39.90}
  imageUrl="https://..."
  currency="BRL"
  onClick={() => {}}
/>
```

## Design System

### Cores

Todas as cores seguem o sistema de design tokens do projeto:
- Backgrounds: `bg-card`, `bg-muted`, `bg-background`
- Text: `text-foreground`, `text-muted-foreground`
- Borders: `border`
- Status colors: Aplicadas apenas em badges e barras laterais

### Tipografia

- Títulos de card: `text-base` a `text-lg`, `font-semibold`
- Descrições: `text-sm`, `text-muted-foreground`
- Preços: `text-2xl`, `font-bold`
- Metadados: `text-xs`, `text-muted-foreground`

### Espaçamento

- Padding interno: `p-6` (desktop), `p-4` (mobile)
- Gap entre cards: `gap-3` (lista), `gap-4` (grid)
- Espaçamento interno: `space-y-2` a `space-y-3`

### Animações

- Transições: `transition-all duration-200`
- Hover elevação: `hover:shadow-md hover:-translate-y-0.5`
- Hover imagem: `hover:scale-105`

## Responsividade

### Mobile (< 768px)
- Cards empilados verticalmente
- Largura total (`w-full`)
- Fonte legível e botões grandes
- Padding reduzido

### Desktop (>= 768px)
- Grid responsivo (`md:grid-cols-2`, `lg:grid-cols-3`)
- Mais densidade visual
- Hover states ativos

## Exemplos de Uso

### Kanban de Pedidos

```tsx
<div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
  {columns.map((column) => (
    <div key={column.key} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{column.title}</div>
        <StatusBadge status={column.key} label="" />
      </div>
      <div className="space-y-2">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            variant="compact"
            {...order}
            onClick={() => navigate(order.id)}
          />
        ))}
      </div>
    </div>
  ))}
</div>
```

### Lista de Pedidos

```tsx
<div className="grid gap-3">
  {orders.map((order) => (
    <OrderCard
      key={order.id}
      variant="full"
      {...order}
      onClick={() => navigate(order.id)}
    />
  ))}
</div>
```

### Grid de Produtos

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {products.map((product) => (
    <ProductCard
      key={product.id}
      variant="public"
      {...product}
      onClick={() => openProductModal(product)}
    />
  ))}
</div>
```

## Critérios de Aceite

- Visual consistente em todo o sistema
- Cards mais bonitos sem mudar lógica de negócio
- Mobile-first preservado
- Desktop mais denso e profissional
- Kanban mais legível e agradável
- Cardápio público bonito e vendável
- Zero breaking changes
- TypeScript strict sem `any`
- Imports via `@/*`

## Arquivos do Sistema

- `/src/tenant/components/cards/BaseCard.tsx` - Card base
- `/src/tenant/components/cards/StatusBadge.tsx` - Badge de status
- `/src/tenant/components/cards/OrderCard.tsx` - Card de pedido
- `/src/tenant/components/cards/ProductCard.tsx` - Card de produto
- `/src/tenant/components/cards/index.tsx` - Exports centralizados
- `/src/tenant/components/cards/README.md` - Esta documentação

## Páginas Atualizadas

- `/src/tenant/pages/OrdersKanban.tsx` - Kanban com OrderCard compact
- `/src/tenant/pages/Orders.tsx` - Lista com OrderCard full
- `/src/tenant/pages/MenuOnlinePreview.tsx` - Preview com ProductCard
