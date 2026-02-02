'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

/**
 * DESIGN SYSTEM SHOWCASE
 * Demonstração visual de todos os tokens e componentes
 */

export function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Design System SaaS</h1>
          <p className="text-base text-muted-foreground">
            Sistema de design profissional, mobile-first e consistente
          </p>
        </div>

        {/* Cores */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Paleta de Cores</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Primary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Primary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-16 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-medium">Primary</span>
                </div>
                <div className="h-12 rounded-md bg-primary-hover flex items-center justify-center">
                  <span className="text-primary-foreground text-sm">Hover</span>
                </div>
                <div className="h-12 rounded-md bg-primary-soft flex items-center justify-center">
                  <span className="text-primary text-sm">Soft</span>
                </div>
              </CardContent>
            </Card>

            {/* Success */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Success</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-16 rounded-md bg-success flex items-center justify-center">
                  <span className="text-success-foreground font-medium">Success</span>
                </div>
                <div className="h-12 rounded-md bg-success-soft flex items-center justify-center">
                  <span className="text-success text-sm">Soft</span>
                </div>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Warning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-16 rounded-md bg-warning flex items-center justify-center">
                  <span className="text-warning-foreground font-medium">Warning</span>
                </div>
                <div className="h-12 rounded-md bg-warning-soft flex items-center justify-center">
                  <span className="text-warning text-sm">Soft</span>
                </div>
              </CardContent>
            </Card>

            {/* Danger */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Danger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-16 rounded-md bg-danger flex items-center justify-center">
                  <span className="text-danger-foreground font-medium">Danger</span>
                </div>
                <div className="h-12 rounded-md bg-danger-soft flex items-center justify-center">
                  <span className="text-danger text-sm">Soft</span>
                </div>
              </CardContent>
            </Card>

            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-16 rounded-md bg-info flex items-center justify-center">
                  <span className="text-info-foreground font-medium">Info</span>
                </div>
                <div className="h-12 rounded-md bg-info-soft flex items-center justify-center">
                  <span className="text-info text-sm">Soft</span>
                </div>
              </CardContent>
            </Card>

            {/* Muted */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Muted</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-16 rounded-md bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground font-medium">Muted</span>
                </div>
                <div className="h-12 rounded-md bg-accent flex items-center justify-center">
                  <span className="text-accent-foreground text-sm">Accent</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tipografia */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Tipografia</h2>
          
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">text-xs (12px)</p>
                <p className="text-xs">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">text-sm (14px)</p>
                <p className="text-sm">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">text-base (16px)</p>
                <p className="text-base">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">text-lg (18px)</p>
                <p className="text-lg">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">text-xl (20px)</p>
                <p className="text-xl">The quick brown fox jumps over the lazy dog</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">text-2xl (24px)</p>
                <p className="text-2xl">The quick brown fox jumps over the lazy dog</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pesos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-normal">Font Normal (400)</p>
              <p className="font-medium">Font Medium (500)</p>
              <p className="font-semibold">Font Semibold (600)</p>
              <p className="font-bold">Font Bold (700)</p>
            </CardContent>
          </Card>
        </section>

        {/* Botões */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Botões</h2>
          
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Default</Label>
                  <Button className="w-full transition-smooth">
                    Primary Button
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Secondary</Label>
                  <Button variant="secondary" className="w-full transition-smooth">
                    Secondary
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Outline</Label>
                  <Button variant="outline" className="w-full transition-smooth">
                    Outline
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ghost</Label>
                  <Button variant="ghost" className="w-full transition-smooth">
                    Ghost
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Destructive</Label>
                  <Button variant="destructive" className="w-full transition-smooth">
                    Destructive
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Disabled</Label>
                  <Button disabled className="w-full">
                    Disabled
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Badges */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Badges de Status</h2>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-success-soft text-success border border-success/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Sucesso
                </Badge>
                <Badge className="bg-warning-soft text-warning border border-warning/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Atenção
                </Badge>
                <Badge className="bg-danger-soft text-danger border border-danger/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  Erro
                </Badge>
                <Badge className="bg-info-soft text-info border border-info/20">
                  <Info className="h-3 w-3 mr-1" />
                  Informação
                </Badge>
                <Badge variant="outline">
                  Outline
                </Badge>
                <Badge variant="secondary">
                  Secondary
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Inputs */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Inputs e Forms</h2>
          
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="input1">Input Padrão</Label>
                <Input 
                  id="input1"
                  placeholder="Digite algo..." 
                  className="transition-smooth"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input2">Input com Valor</Label>
                <Input 
                  id="input2"
                  defaultValue="Valor preenchido" 
                  className="transition-smooth"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input3">Input Desabilitado</Label>
                <Input 
                  id="input3"
                  disabled
                  defaultValue="Desabilitado" 
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="transition-smooth hover:shadow-md">
              <CardHeader>
                <CardTitle>Card Simples</CardTitle>
                <CardDescription>
                  Descrição do card com texto secundário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Conteúdo do card com informações relevantes.
                </p>
              </CardContent>
            </Card>

            <Card className="transition-smooth hover:shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Card com Badge</CardTitle>
                  <Badge className="bg-success-soft text-success border-success/20">
                    Ativo
                  </Badge>
                </div>
                <CardDescription>
                  Card com badge de status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full transition-smooth">
                  Ação Principal
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Espaçamentos */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Espaçamentos</h2>
          
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">spacing-1 (4px)</p>
                <div className="h-1 w-16 bg-primary"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">spacing-2 (8px)</p>
                <div className="h-2 w-24 bg-primary"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">spacing-3 (12px)</p>
                <div className="h-3 w-32 bg-primary"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">spacing-4 (16px)</p>
                <div className="h-4 w-40 bg-primary"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">spacing-6 (24px)</p>
                <div className="h-6 w-48 bg-primary"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">spacing-8 (32px)</p>
                <div className="h-8 w-56 bg-primary"></div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Bordas */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Bordas e Sombras</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-sm">
              <CardHeader>
                <CardTitle className="text-base">rounded-sm</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Raio pequeno (6px)</p>
              </CardContent>
            </Card>

            <Card className="rounded-md">
              <CardHeader>
                <CardTitle className="text-base">rounded-md</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Raio médio (8px)</p>
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardHeader>
                <CardTitle className="text-base">rounded-lg</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Raio grande (12px)</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">shadow-sm</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Sombra sutil</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">shadow-md</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Sombra média</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">shadow-lg</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Sombra grande</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
