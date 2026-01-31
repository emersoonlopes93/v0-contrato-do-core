'use client';

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function NoModulesPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Nenhum módulo ativo</CardTitle>
          <CardDescription>
            Seu ambiente está configurado, mas ainda não há módulos ativos para este tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Peça para o administrador acessar o painel SaaS Admin e ativar os módulos desejados
            para este tenant. Depois disso, você verá os módulos disponíveis aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

