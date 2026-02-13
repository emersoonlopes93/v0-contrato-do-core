import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, TrendingUp, AlertTriangle, Settings } from 'lucide-react';

export function LogisticsAiDashboard() {
  return (
    <div className="container mx-auto p-6 lg:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">IA Logística</h1>
          <p className="text-sm text-muted-foreground">Performance operacional e previsões em tempo real.</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Previsões
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Sugestões
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl bg-card/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-3">
                <CardTitle className="text-sm font-medium">Previsões Hoje</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="text-3xl font-semibold">24</div>
                <p className="text-xs text-muted-foreground">
                  +2 em relação a ontem
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-card/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-3">
                <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="text-3xl font-semibold">87%</div>
                <p className="text-xs text-muted-foreground">
                  +5% esta semana
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-card/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-3">
                <CardTitle className="text-sm font-medium">Tempo Médio Economizado</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="text-3xl font-semibold">12min</div>
                <p className="text-xs text-muted-foreground">
                  Por entrega otimizada
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-card/70 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-3">
                <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="text-3xl font-semibold">3</div>
                <p className="text-xs text-muted-foreground">
                  1 crítico
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions">
          <Card className="rounded-2xl bg-card/70 shadow-sm">
            <CardHeader className="p-6 pb-3">
              <CardTitle>Previsões de Atraso</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <p className="text-muted-foreground">
                Visualize e gerencie as previsões de atraso geradas pela IA.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <Card className="rounded-2xl bg-card/70 shadow-sm">
            <CardHeader className="p-6 pb-3">
              <CardTitle>Sugestões de Rota</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <p className="text-muted-foreground">
                Revise as sugestões de otimização de rotas geradas pela IA.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="rounded-2xl bg-card/70 shadow-sm">
            <CardHeader className="p-6 pb-3">
              <CardTitle>Configurações da IA</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <p className="text-muted-foreground">
                Configure as preferências e parâmetros da IA Logística.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
