'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantLayout } from '../TenantLayout';
import { Plus, Download, Filter, TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';

/**
 * LayoutDemo - Demonstração do Layout Premium
 * 
 * Mostra todas as capacidades do novo layout:
 * - Header com título e ações
 * - Cards com métricas
 * - Grid responsivo
 * - Componentes premium
 */

export function LayoutDemo() {
  return (
    <TenantLayout
      pageTitle="Dashboard Premium"
      headerActions={
        <>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        {/* Seção Hero */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            Bem-vindo ao seu Dashboard
          </h2>
          <p className="text-muted-foreground text-lg">
            Visão geral do seu negócio em tempo real
          </p>
        </div>

        {/* Cards de Métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 45.231,89</div>
              <p className="text-xs text-muted-foreground mt-1">
                +20.1% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pedidos
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2350</div>
              <p className="text-xs text-muted-foreground mt-1">
                +180 desde ontem
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clientes Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground mt-1">
                +19% este mês
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Crescimento
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12.5%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Acima da média do setor
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Conteúdo */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>
                Você tem 23 pedidos pendentes hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors duration-150">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Pedido #{1000 + i}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {i} item(ns) • há {i * 5} minutos
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      R$ {(45 + i * 10).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos em Destaque</CardTitle>
              <CardDescription>
                Os mais vendidos da semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Pizza Margherita', sales: 156 },
                  { name: 'Hambúrguer Artesanal', sales: 132 },
                  { name: 'Refrigerante 2L', sales: 98 },
                  { name: 'Batata Frita', sales: 87 },
                  { name: 'Sorvete', sales: 76 },
                ].map((product, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors duration-150">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                        {product.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {product.sales} vendas
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      #{i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção Final */}
        <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle>Layout Premium Implementado</CardTitle>
            <CardDescription>
              Este é um exemplo do novo layout base do Tenant App
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Mobile-First Design</p>
                  <p className="text-sm text-muted-foreground">
                    Sidebar vira drawer elegante no mobile
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Visual Premium</p>
                  <p className="text-sm text-muted-foreground">
                    Transições suaves, cores consistentes, tipografia clara
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Zero Breaking Changes</p>
                  <p className="text-sm text-muted-foreground">
                    100% compatível com sistema existente
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TenantLayout>
  );
}
