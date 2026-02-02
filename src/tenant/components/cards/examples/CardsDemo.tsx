'use client';

import React from 'react';
import { BaseCard, StatusBadge, OrderCard, ProductCard } from '@/src/tenant/components/cards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * CardsDemo - Página de demonstração dos cards padronizados
 * 
 * Mostra todos os tipos de cards e suas variações.
 * Útil para desenvolvimento e documentação visual.
 */

export function CardsDemo() {
  const mockOrders = [
    {
      id: '1',
      orderNumber: 123,
      status: 'preparing',
      customerName: 'João Silva',
      total: 45.9,
      itemsCount: 3,
      createdAt: new Date().toISOString(),
      paymentMethod: 'pix',
      deliveryType: 'delivery',
      source: 'app',
    },
    {
      id: '2',
      orderNumber: 124,
      status: 'ready',
      customerName: 'Maria Santos',
      total: 67.5,
      itemsCount: 5,
      createdAt: new Date().toISOString(),
      paymentMethod: 'credit_card',
      deliveryType: 'pickup',
      source: 'web',
    },
    {
      id: '3',
      orderNumber: 125,
      status: 'delivered',
      customerName: 'Pedro Oliveira',
      total: 32.0,
      itemsCount: 2,
      createdAt: new Date().toISOString(),
      paymentMethod: 'cash',
      deliveryType: 'delivery',
      source: 'telefone',
    },
  ];

  const mockProducts = [
    {
      id: '1',
      name: 'Pizza Margherita',
      description: 'Molho de tomate, mussarela, manjericão fresco e azeite',
      price: 45.9,
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
      status: 'active',
      categoryName: 'Pizzas',
    },
    {
      id: '2',
      name: 'Hambúrguer Clássico',
      description: 'Pão, hambúrguer 180g, queijo, alface, tomate e molho especial',
      price: 32.9,
      promoPrice: 27.9,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      status: 'active',
      categoryName: 'Hambúrgueres',
    },
    {
      id: '3',
      name: 'Refrigerante Lata',
      description: 'Coca-Cola, Guaraná ou Sprite - 350ml',
      price: 6.0,
      status: 'active',
      categoryName: 'Bebidas',
    },
  ];

  const allStatuses = [
    'created',
    'accepted',
    'preparing',
    'ready',
    'completed',
    'cancelled',
    'pending_payment',
    'confirmed',
    'delivering',
    'delivered',
    'expired',
  ];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistema de Cards Padronizados</h1>
        <p className="text-muted-foreground">Demonstração de todos os componentes de cards</p>
      </div>

      {/* Status Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Status Badges</CardTitle>
          <CardDescription>Badges coloridos por status de pedido</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allStatuses.map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Base Card */}
      <Card>
        <CardHeader>
          <CardTitle>Base Card</CardTitle>
          <CardDescription>Card base reutilizável com composição modular</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <BaseCard>
              <BaseCard.Header title="Card Simples" description="Apenas título e descrição" />
              <BaseCard.Content>Conteúdo do card aqui.</BaseCard.Content>
            </BaseCard>

            <BaseCard onClick={() => alert('Card clicado!')}>
              <BaseCard.Header
                title="Card Clicável"
                description="Com hover e ação"
                action={<Button size="sm">Ação</Button>}
              />
              <BaseCard.Content>Clique no card para ver a ação.</BaseCard.Content>
              <BaseCard.Footer>
                <Button variant="outline" className="w-full">
                  Botão no footer
                </Button>
              </BaseCard.Footer>
            </BaseCard>
          </div>
        </CardContent>
      </Card>

      {/* Order Cards - Compact */}
      <Card>
        <CardHeader>
          <CardTitle>Order Card - Compact (Kanban)</CardTitle>
          <CardDescription>Versão compacta para visualização em colunas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {mockOrders.map((order) => (
              <OrderCard
                key={order.id}
                variant="compact"
                orderNumber={order.orderNumber}
                status={order.status}
                customerName={order.customerName}
                total={order.total}
                itemsCount={order.itemsCount}
                createdAt={order.createdAt}
                source={order.source}
                onClick={() => alert(`Ver pedido #${order.orderNumber}`)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Cards - Full */}
      <Card>
        <CardHeader>
          <CardTitle>Order Card - Full (Lista)</CardTitle>
          <CardDescription>Versão completa com todas as informações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockOrders.map((order) => (
              <OrderCard
                key={order.id}
                variant="full"
                orderNumber={order.orderNumber}
                status={order.status}
                customerName={order.customerName}
                total={order.total}
                itemsCount={order.itemsCount}
                createdAt={order.createdAt}
                paymentMethod={order.paymentMethod}
                deliveryType={order.deliveryType}
                source={order.source}
                onClick={() => alert(`Ver pedido #${order.orderNumber}`)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Cards - Public */}
      <Card>
        <CardHeader>
          <CardTitle>Product Card - Public (Cardápio Público)</CardTitle>
          <CardDescription>Cards para o cardápio público com botão de adicionar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {mockProducts.map((product) => (
              <ProductCard
                key={product.id}
                variant="public"
                name={product.name}
                description={product.description}
                price={product.price}
                imageUrl={product.imageUrl}
                promoPrice={product.promoPrice}
                onClick={() => alert(`Adicionar ${product.name} ao carrinho`)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Cards - Admin */}
      <Card>
        <CardHeader>
          <CardTitle>Product Card - Admin (Gestão)</CardTitle>
          <CardDescription>Cards para área administrativa com botões de ação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {mockProducts.map((product) => (
              <ProductCard
                key={product.id}
                variant="admin"
                name={product.name}
                description={product.description}
                price={product.price}
                imageUrl={product.imageUrl}
                status={product.status}
                categoryName={product.categoryName}
                onEdit={() => alert(`Editar ${product.name}`)}
                onClick={() => alert(`Visualizar ${product.name}`)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Cards - Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Product Card - Preview (Preview Interno)</CardTitle>
          <CardDescription>Cards para preview do cardápio sem checkout</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {mockProducts.map((product) => (
              <ProductCard
                key={product.id}
                variant="preview"
                name={product.name}
                description={product.description}
                price={product.price}
                imageUrl={product.imageUrl}
                onClick={() => alert(`Ver detalhes de ${product.name}`)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
